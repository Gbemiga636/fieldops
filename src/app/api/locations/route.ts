import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function dbErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "Database error";
  if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
    return NextResponse.json(
      {
        error:
          "Cannot reach Supabase. Check .env.local credentials and restart the dev server.",
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database not configured. Add Supabase keys to .env.local and restart npm run dev.",
        },
        { status: 503 }
      );
    }
    const body = await request.json();
    const {
      agent_name,
      latitude,
      longitude,
      accuracy,
      address,
      device,
      browser,
      status = "active",
    } = body;

    if (!agent_name || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Agent name, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("location_shares")
      .insert({
        agent_name: agent_name.trim(),
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        address: address ?? null,
        device: device ?? null,
        browser: browser ?? null,
        status,
        shared_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database not configured. Add Supabase keys to .env.local and restart npm run dev.",
        },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status");
    const agent = searchParams.get("agent");

    let query = supabase
      .from("location_shares")
      .select("*")
      .order("shared_at", { ascending: false });

    if (search) {
      query = query.or(
        `agent_name.ilike.%${search}%,address.ilike.%${search}%`
      );
    }
    if (agent) {
      query = query.ilike("agent_name", `%${agent}%`);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (dateFrom) {
      query = query.gte("shared_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("shared_at", `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

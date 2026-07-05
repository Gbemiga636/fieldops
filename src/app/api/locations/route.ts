import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reverseGeocodeServer } from "@/lib/geocode";

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

    // Resolve full address on server (city, state, country)
    const geocoded = await reverseGeocodeServer(latitude, longitude);

    const row: Record<string, unknown> = {
      agent_name: agent_name.trim(),
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      address: geocoded.formatted,
      street: geocoded.street,
      area: geocoded.area,
      city: geocoded.city,
      state: geocoded.state,
      country: geocoded.country,
      postcode: geocoded.postcode,
      device: device ?? null,
      browser: browser ?? null,
      status,
      shared_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from("location_shares")
      .insert(row)
      .select()
      .single();

    // Retry with address only if extra columns not migrated yet
    if (error) {
      const basic = {
        agent_name: row.agent_name,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        address: row.address,
        device: row.device,
        browser: row.browser,
        status: row.status,
        shared_at: row.shared_at,
      };
      const retry = await supabase
        .from("location_shares")
        .insert(basic)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

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
        `agent_name.ilike.%${search}%,address.ilike.%${search}%,street.ilike.%${search}%,area.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,country.ilike.%${search}%`
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

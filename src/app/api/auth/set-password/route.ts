import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const hash = await hashPassword(password);

    const { error } = await supabase
      .from("admin_users")
      .update({
        password_hash: hash,
        password_set: true,
        remind_later: false,
        updated_at: new Date().toISOString(),
      })
      .eq("username", session.username);

    if (error) {
      return NextResponse.json(
        { error: "Failed to set password" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

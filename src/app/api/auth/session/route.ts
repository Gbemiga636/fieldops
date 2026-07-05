import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("password_set, remind_later")
      .eq("username", session.username)
      .single();

    return NextResponse.json({
      authenticated: true,
      username: session.username,
      passwordSet: admin?.password_set ?? false,
      remindLater: admin?.remind_later ?? false,
      needsPasswordSetup:
        !admin?.password_set && !admin?.remind_later,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

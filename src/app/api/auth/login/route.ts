import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  createSession,
  setSessionCookie,
  verifyAdminPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username.toLowerCase().trim())
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Username only (legacy) — password required if already set
    if (!password) {
      if (!admin.password_set) {
        const token = await createSession(admin.username);
        await setSessionCookie(token);
        return NextResponse.json({
          success: true,
          needsPasswordSetup: true,
        });
      }

      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }
    if (!admin.password_set) {
      const token = await createSession(admin.username);
      await setSessionCookie(token);
      return NextResponse.json({
        success: true,
        needsPasswordSetup: true,
      });
    }

    const valid = await verifyAdminPassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession(admin.username);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      needsPasswordSetup: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

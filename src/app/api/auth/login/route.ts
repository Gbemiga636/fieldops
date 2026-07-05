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

    // Step 1: username only — tell UI what to show next
    if (!password) {
      if (!admin.password_set) {
        const token = await createSession(admin.username);
        await setSessionCookie(token);
        return NextResponse.json({
          success: true,
          needsPasswordSetup: true,
          requiresPassword: false,
          remindLater: admin.remind_later,
        });
      }

      return NextResponse.json({
        success: true,
        requiresPassword: true,
        needsPasswordSetup: false,
      });
    }

    // Step 2: username + password
    if (!admin.password_set) {
      const token = await createSession(admin.username);
      await setSessionCookie(token);
      return NextResponse.json({
        success: true,
        needsPasswordSetup: true,
        requiresPassword: false,
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
      requiresPassword: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

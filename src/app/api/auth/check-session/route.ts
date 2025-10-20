import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: sessionData, error } = await supabaseServer
      .from("admin_sessions")
      .select("admin_email, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (error || !sessionData) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);

    if (now > expiresAt) {
      await supabaseServer
        .from("admin_sessions")
        .delete()
        .eq("session_token", sessionToken);

      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: adminData, error: adminError } = await supabaseServer
      .from("Admins")
      .select("email")
      .eq("email", sessionData.admin_email)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        email: sessionData.admin_email,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

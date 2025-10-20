import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (sessionToken) {
      await supabaseServer
        .from("admin_sessions")
        .delete()
        .eq("session_token", sessionToken);
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

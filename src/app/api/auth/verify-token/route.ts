import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find and verify token
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from("auth_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Mark token as used
    const { error: updateError } = await supabaseServer
      .from("auth_tokens")
      .update({ used: true })
      .eq("id", tokenData.id);

    if (updateError) {
      console.error("Failed to mark token as used:", updateError);
      return NextResponse.json(
        { error: "Failed to process token" },
        { status: 500 }
      );
    }

    // Get user by email using listUsers and filter
    const { data: authUsers, error: authError } =
      await supabaseServer.auth.admin.listUsers();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    const user = authUsers.users.find((u) => u.email === tokenData.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } =
      await supabaseServer.auth.admin.generateLink({
        type: "magiclink",
        email: tokenData.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
        },
      });

    if (sessionError || !sessionData) {
      console.error("Session generation error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Token verified successfully",
      user: {
        id: authUsers.users[0].id,
        email: authUsers.users[0].email,
        user_metadata: authUsers.users[0].user_metadata,
      },
      session_url: sessionData.properties?.action_link,
    });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    console.log("Received token for verification:", token);

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const { data: tokenData, error: tokenError } = await supabaseServer
      .from("auth_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    console.log("Token lookup result:", { tokenData, tokenError });

    if (tokenError || !tokenData) {
      console.log("Token not found or error:", tokenError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    console.log("Token expiry check:", {
      now,
      expiresAt,
      isExpired: now > expiresAt,
    });

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

    console.log("Token marked as used successfully");

    // Get user by email using listUsers and filter
    const { data: authUsers, error: authError } =
      await supabaseServer.auth.admin.listUsers();

    console.log("Auth users lookup:", {
      authError,
      userCount: authUsers?.users?.length,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    const user = authUsers.users.find((u) => u.email === tokenData.email);
    console.log("User found:", { email: tokenData.email, userFound: !!user });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");

    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error: sessionError } = await supabaseServer
      .from("admin_sessions")
      .insert({
        session_token: sessionToken,
        admin_email: tokenData.email,
        expires_at: sessionExpiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    console.log("Custom session created successfully");

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: "Token verified successfully",
      user: {
        email: tokenData.email,
      },
      redirect_to: "/dashboard/admin",
    });

    // Set session cookie
    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

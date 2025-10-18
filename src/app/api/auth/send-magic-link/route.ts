import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { EmailService } from "@/lib/services/emailService";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists in Supabase auth by listing users and filtering by email
    const { data: authUsers, error: authError } =
      await supabaseServer.auth.admin.listUsers();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    const user = authUsers.users.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiry to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store token in database
    const { error: dbError } = await supabaseServer.from("auth_tokens").insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create auth token" },
        { status: 500 }
      );
    }

    // Send magic link email
    try {
      await EmailService.sendMagicLinkEmail({
        email,
        token,
        adminName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the request if email fails, but log it
      // The token is still valid and can be used manually if needed
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent successfully",
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === "development" && { token }),
    });
  } catch (error) {
    console.error("Send magic link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

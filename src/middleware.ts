import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";

const ipRequestMap = new Map<string, number[]>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQ = 100; // Max requests per window

const publicRoutes = ["/", "/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`Middleware running for: ${pathname}`);

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  console.log(`Is public route: ${isPublicRoute}`);

  if (isPublicRoute) {
    console.log(`Allowing public route: ${pathname}`);
    return NextResponse.next();
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "Unknown";
    const currentTime = Date.now();

    if (!ipRequestMap.has(ip)) {
      ipRequestMap.set(ip, []);
    }

    const timestamps = ipRequestMap
      .get(ip)!
      .filter((ts) => currentTime - ts < RATE_LIMIT_WINDOW);

    if (timestamps.length >= MAX_REQ) {
      return new NextResponse("Too many requests, please try again later", {
        status: 429,
      });
    }

    timestamps.push(currentTime);
    ipRequestMap.set(ip, timestamps);
  }

  console.log(`Checking authentication for: ${pathname}`);

  let adminEmail = "unknown@admin.com";

  if (pathname.startsWith("/api/")) {
    try {
      const sessionToken = req.cookies.get("admin_session")?.value;

      if (sessionToken) {
        const { data: sessionData } = await supabaseServer
          .from("admin_sessions")
          .select("admin_email")
          .eq("session_token", sessionToken)
          .single();

        if (sessionData?.admin_email) {
          adminEmail = sessionData.admin_email;
        }
      }
    } catch (error) {
      console.error("Error getting admin email from session:", error);
    }
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/api/")) {
    response.headers.set("x-admin-email", adminEmail);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

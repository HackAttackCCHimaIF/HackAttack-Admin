import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // Authentication check for ALL non-public routes
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options) {
            req.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    // Check if user is authenticated
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log(
      `Auth check result - User: ${user?.email || "null"}, Error: ${
        error?.message || "none"
      }`
    );

    if (error || !user) {
      console.log("No authenticated user, redirecting to login");
      const loginUrl = new URL("/", req.url);
      return NextResponse.redirect(loginUrl);
    }

    console.log("User authenticated:", user.email);
    return response;
  } catch (error) {
    console.error("Auth middleware error:", error);
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

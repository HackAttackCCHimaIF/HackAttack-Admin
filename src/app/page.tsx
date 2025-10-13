"use client";

import { useState } from "react";
import { supabase } from "@/lib/config/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${
            window.location.origin
          }/auth/confirm?next=${encodeURIComponent("/dashboard/admin")}`,
        },
      });

      if (otpError) {
        toast.error("Failed to send verification email: " + otpError.message);
        return;
      }

      toast.success("Verification email sent. Please check your inbox.");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing-page/Map.svg"
          alt="Map background"
          fill
          className="object-cover pointer-events-none opacity-50"
          priority
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="bg-black/80 backdrop-blur-md border-2 border-white/20 text-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hackattack.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10 py-3 rounded-lg focus:border-blue-400 focus:ring-blue-400"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Login
                  </div>
                )}
              </Button>

              {/* Development Skip Button - REMOVED */}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface User {
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/check-session", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            console.log("Found custom session:", data.user.email);
            setUser(data.user);
          } else {
            console.log("No valid session found");
            setUser(null);
          }
        } else {
          console.log("Session check failed");
          setUser(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      setUser(null);
      window.location.href = "/";
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error("Send magic link error:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signOut: handleSignOut,
    sendMagicLink,
    isAuthenticated: !!user,
  };
}

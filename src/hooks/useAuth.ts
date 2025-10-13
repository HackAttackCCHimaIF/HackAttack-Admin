"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/config/supabase";
import { useUserStore } from "@/lib/stores/userStore";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setUser: setStoreUser, reset } = useUserStore();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setUser(null);
          reset();
          router.push("/");
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setStoreUser(session.user);
        } else {
          setUser(null);
          reset();
        }
      } catch (error) {
        console.error("Session error:", error);
        setUser(null);
        reset();
        router.push("/");
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setStoreUser(session.user);
      } else if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        reset();
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, setStoreUser, reset]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        console.error("Sign out error:", error);
      }

      setUser(null);
      reset();

      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        if (name.trim().includes("supabase") || name.trim().includes("sb-")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });

      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      setUser(null);
      reset();
      window.location.href = "/";
    }
  };

  return {
    user,
    loading,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  };
}

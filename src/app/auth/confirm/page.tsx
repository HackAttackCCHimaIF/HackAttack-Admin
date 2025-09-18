"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/config/supabase";
import { useUserStore } from "@/lib/stores/userStore";
import { Suspense } from "react";
import { EmailOtpType } from "@supabase/supabase-js";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  useEffect(() => {
    const handleAuthConfirm = async () => {
      try {
        if (token_hash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            type: type as EmailOtpType,
            token_hash,
          });

          if (error) {
            router.push("/auth/auth-code-error");
            return;
          }

          if (data.session?.user) {
            const user = data.session.user;
            setUser(user);

            router.push("/dashboard/admin");
          } else {
            router.push("/auth/auth-code-error");
          }
        } else {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            router.push("/auth/auth-code-error");
            return;
          }

          if (data.session?.user) {
            setUser(data.session.user);
            router.push("/dashboard/admin");
          } else {
            router.push("/auth/auth-code-error");
          }
        }
      } catch {
        router.push("/auth/auth-code-error");
      }
    };

    handleAuthConfirm();
  }, [router, token_hash, type, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        {/* <p>Confirming your email...</p> */}
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          {/* <div className="text-white">Loading...</div> */}
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}

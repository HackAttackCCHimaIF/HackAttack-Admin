"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/lib/stores/userStore";
import { Suspense } from "react";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  const token = searchParams.get("token");

  useEffect(() => {
    const handleTokenVerification = async () => {
      try {
        if (!token) {
          console.log("No token provided");
          setStatus('error');
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.log("Token verification failed:", data.error);
          setStatus('error');
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        if (data.user) {
          setUser(data.user);
          setStatus('success');
          setTimeout(() => router.push("/dashboard/admin"), 1500);
        } else {
          console.log("User not found in response");
          setStatus('error');
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (error) {
        console.log("Unexpected error in token verification:", error);
        setStatus('error');
        setTimeout(() => router.push("/"), 2000);
      }
    };

    handleTokenVerification();
  }, [router, token, setUser]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Verifying your magic link...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-white text-center">
            <div className="w-8 h-8 mx-auto mb-4 text-green-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p>Login successful! Redirecting...</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-white text-center">
            <div className="w-8 h-8 mx-auto mb-4 text-red-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <p>Invalid or expired link. Redirecting to login...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      {renderContent()}
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

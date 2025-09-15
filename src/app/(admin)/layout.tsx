import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - HackAttack 2025",
  description: "Administrative dashboard for HackAttack 2025 hackathon",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}
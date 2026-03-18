import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { BranchProvider } from "@/context/BranchContext";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = {
  title: "WorkshopOS",
  description: "Premium Garage Management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkshopOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, address, phone")
    .eq("is_active", true)
    .order("name");

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1d4ed8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WorkshopOS" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body style={{ background: "#f2f2f7" }}>
        <BranchProvider branches={branches ?? []}>
          <Sidebar branches={branches ?? []} />
          <main className="md:ml-60 min-h-screen px-4 py-6 md:px-12 md:py-10 pt-16 md:pt-10">
            {children}
          </main>
        </BranchProvider>
      </body>
    </html>
  );
}

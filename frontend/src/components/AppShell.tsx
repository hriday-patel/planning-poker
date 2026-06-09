"use client";

import SiteHeader from "@/components/SiteHeader";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}

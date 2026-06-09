"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Layers3 } from "lucide-react";
import HeaderProfileMenu from "@/components/HeaderProfileMenu";
import { getHomeOrActiveGamePath } from "@/lib/activeGameSession";
import { Button } from "@/components/ui";

const logoTaglines: Record<string, string> = {
  "/": "IBM-ready estimation for agile teams",
  "/login": "Secure estimation workspace",
};

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/game/")) {
    return null;
  }

  const showLogo = pathname === "/" || pathname === "/login";
  const tagline = logoTaglines[pathname];
  const showFaqLink = pathname === "/";
  const pageTitles: Record<string, string> = {
    "/account": "My Account",
    "/settings/jira": "JIRA Settings",
  };
  const pageTitle = pageTitles[pathname] ?? null;

  return (
    <nav
      className="border-b"
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center">
          {showLogo ? (
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-accent)",
                }}
              >
                <Layers3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-semibold tracking-tight">
                  Planning Poker
                </span>
                {tagline && (
                  <span
                    className="hidden text-xs sm:block"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {tagline}
                  </span>
                )}
              </span>
            </Link>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(getHomeOrActiveGamePath())}
              className="shadow-none"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Button>
          )}
        </div>

        {pageTitle && (
          <h1 className="hidden text-xl font-semibold sm:block">{pageTitle}</h1>
        )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showFaqLink && (
            <Link
              href="/faq"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              FAQs
            </Link>
          )}
          <HeaderProfileMenu />
        </div>
      </div>
    </nav>
  );
}

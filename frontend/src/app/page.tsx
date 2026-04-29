"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  BarChart3,
  Clock3,
  Layers3,
  LockKeyhole,
  LogIn,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Card, PageShell } from "@/components/ui";

const ibmLogoUrl =
  process.env.NEXT_PUBLIC_IBM_LOGO_URL ||
  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";

type Feature = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  variant: "info" | "success" | "warning" | "neutral";
};

const proofPoints = [
  ["Real-time", "Live voting and reveal flow"],
  ["Secure", "IBM W3ID and Blue Pages identity"],
  ["Shareable", "Simple URL invite links"],
];

const features: Feature[] = [
  {
    title: "Real-time Voting",
    description:
      "Instant synchronization across all participants with responsive WebSocket updates.",
    icon: Users,
    variant: "info",
  },
  {
    title: "Completely Free",
    description:
      "Unlimited games and voting rounds with no premium tiers or usage caps.",
    icon: Sparkles,
    variant: "success",
  },
  {
    title: "Enterprise Security",
    description:
      "Integrated IBM W3ID authentication and authoritative Blue Pages identity handling.",
    icon: ShieldCheck,
    variant: "neutral",
  },
  {
    title: "Customizable Decks",
    description:
      "Support Fibonacci, T-shirt sizes, or a custom deck tailored to your workflow.",
    icon: Layers3,
    variant: "warning",
  },
  {
    title: "Built-in Timer",
    description:
      "Keep discussions focused with synchronized countdown timers that reset cleanly.",
    icon: Clock3,
    variant: "neutral",
  },
  {
    title: "Voting Analytics",
    description:
      "Review averages, consensus levels, and the full history of every session.",
    icon: BarChart3,
    variant: "info",
  },
];

const deckValues = ["1", "2", "3", "5", "8", "13", "?"];

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiFetch("/api/v1/auth/me");

        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }

        const data = await response.json();
        setIsAuthenticated(!data.user?.isGuest);
      } catch (_error) {
        setIsAuthenticated(false);
      }
    };

    void checkSession();
  }, []);

  const handleStartGame = () => {
    if (isAuthenticated) {
      router.push("/create");
    } else {
      router.push("/login?returnTo=%2Fcreate");
    }
  };

  return (
    <PageShell>
      <nav
        className="border-b"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--primary)", color: "white" }}
            >
              <Layers3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold tracking-tight">
                Planning Poker
              </span>
              <span
                className="hidden text-xs sm:block"
                style={{ color: "var(--text-tertiary)" }}
              >
                IBM-ready estimation for agile teams
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/faq"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              FAQs
            </Link>
            <ThemeToggle />
            <Button
              type="button"
              size="sm"
              onClick={() =>
                router.push(isAuthenticated ? "/create" : "/login")
              }
              className="hidden sm:inline-flex"
            >
              {isAuthenticated ? (
                <Plus className="h-4 w-4" aria-hidden="true" />
              ) : (
                <LogIn className="h-4 w-4" aria-hidden="true" />
              )}
              {isAuthenticated ? "Create Game" : "Sign In"}
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="container mx-auto grid items-center gap-10 px-6 pb-10 pt-10 lg:grid-cols-[1fr_0.9fr] lg:pb-12 lg:pt-14">
          <div>
            <Badge variant="info" className="mb-5 inline-flex">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Secure collaboration with IBM W3ID
            </Badge>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Planning Poker for focused sprint estimates
            </h1>

            <p
              className="mt-5 max-w-2xl text-lg leading-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Real-time estimation for agile teams with authenticated access,
              secure invite links, and a calm workspace built for repeated
              planning sessions.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                onClick={handleStartGame}
                className="w-full sm:w-auto"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                Start New Game
              </Button>

              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => router.push("/create?guest=1")}
                className="w-full sm:w-auto"
              >
                <Users className="h-5 w-5" aria-hidden="true" />
                Try as Guest
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {proofPoints.map(([title, description]) => (
                <Card key={title} className="p-4" variant="secondary">
                  <p className="font-semibold">{title}</p>
                  <p
                    className="mt-1 text-sm leading-6"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div
            className="rounded-lg border p-4 shadow-theme"
            style={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border-color)",
            }}
          >
            <div
              className="flex items-center justify-between gap-4 border-b pb-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  Sprint 24 Estimation
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Connected team workspace
                </p>
              </div>
              <Badge variant="success">Live</Badge>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["AK", "5"],
                ["RM", "8"],
                ["JS", "?"],
              ].map(([initials, value], index) => (
                <div
                  key={initials}
                  className="flex flex-col items-center gap-3 rounded-lg border p-3"
                  style={{
                    animationDelay: `${index * 180}ms`,
                    backgroundColor: "var(--surface-primary)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor:
                        index === 1 ? "var(--accent)" : "var(--primary)",
                      color: "white",
                    }}
                  >
                    {initials}
                  </div>
                  <div
                    className="flex h-20 w-14 items-center justify-center rounded-lg border text-lg font-bold"
                    style={{
                      backgroundColor:
                        index === 1
                          ? "var(--surface-accent)"
                          : "var(--bg-muted)",
                      borderColor:
                        index === 1 ? "var(--primary)" : "var(--border-color)",
                      color:
                        index === 1 ? "var(--primary)" : "var(--text-primary)",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <Button type="button" size="sm" tabIndex={-1}>
                Reveal Cards
              </Button>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {deckValues.map((value) => (
                <div
                  key={value}
                  className="flex h-14 min-w-10 items-center justify-center rounded-lg border text-sm font-bold"
                  style={{
                    backgroundColor: "var(--surface-primary)",
                    borderColor:
                      value === "8" ? "var(--primary)" : "var(--border-subtle)",
                    color:
                      value === "8"
                        ? "var(--primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y py-16"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold">
                Everything a planning room needs
              </h2>
              <p
                className="mt-3 leading-7"
                style={{ color: "var(--text-secondary)" }}
              >
                A minimal, enterprise-friendly workflow for sessions that stay
                fast, secure, and aligned.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <Card key={feature.title} className="p-5">
                    <Badge variant={feature.variant} className="mb-4">
                      <Icon className="h-3.5 w-3.5" aria-hidden={true} />
                      {feature.title}
                    </Badge>
                    <p
                      className="text-sm leading-6"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-6">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "var(--primary)" }}
                >
                  Trusted enterprise foundation
                </p>
                <h2 className="mt-2 text-3xl font-bold">Built for IBM teams</h2>
                <p
                  className="mt-3 max-w-2xl leading-7"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Authenticated access, corporate identity consistency, and
                  secure collaboration flows designed around IBM's ecosystem.
                </p>
              </div>
              <div
                className="inline-flex items-center justify-center rounded-lg border px-8 py-5"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <img
                  src={ibmLogoUrl}
                  alt="IBM logo"
                  className="h-10 w-auto"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-y py-14"
          style={{
            backgroundColor: "var(--surface-accent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="container mx-auto flex flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold">
                Ready to improve your sprint planning?
              </h2>
              <p
                className="mt-2 leading-7"
                style={{ color: "var(--text-secondary)" }}
              >
                Start a focused, secure estimation session in minutes.
              </p>
            </div>
            <Button type="button" size="lg" onClick={handleStartGame}>
              <Plus className="h-5 w-5" aria-hidden="true" />
              Start Your First Game
            </Button>
          </div>
        </section>
      </main>

      <footer
        className="border-t py-10"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--primary)", color: "white" }}
                >
                  <Layers3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-semibold">Planning Poker</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Real-time sprint estimation for agile teams
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:opacity-80">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="hover:opacity-80">
                    Create Game
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:opacity-80">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/faq" className="hover:opacity-80">
                    Help Center
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@planningpoker.com"
                    className="hover:opacity-80"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/legal" className="hover:opacity-80">
                    Legal Notice
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/legal" className="hover:opacity-80">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="hover:opacity-80">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="mt-8 border-t pt-6 text-center text-sm"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-tertiary)",
            }}
          >
            <p>&copy; 2026 Planning Poker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}

// Made with Bob

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  BarChart3,
  History,
  Infinity,
  Layers3,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
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
    title: "Unlimited Voting Rounds",
    description:
      "Run as many estimation rounds as your session needs with no caps or premium limits.",
    icon: Infinity,
    variant: "success",
  },
  {
    title: "Accommodation of Large Teams",
    description:
      "Scale smoothly for big planning rooms with reliable real-time sync across many participants.",
    icon: Users,
    variant: "info",
  },
  {
    title: "Voting and Game History",
    description:
      "Review past rounds, outcomes, and full session records whenever you need context.",
    icon: History,
    variant: "neutral",
  },
  {
    title: "JIRA Integration",
    description:
      "Import sprint issues directly from Jira to keep estimation tied to your backlog.",
    icon: Ticket,
    variant: "warning",
  },
  {
    title: "Custom Decks and Voting Analytics",
    description:
      "Choose Fibonacci, T-shirt sizes, or custom decks, then review averages and consensus trends.",
    icon: BarChart3,
    variant: "info",
  },
  {
    title: "Enterprise Security",
    description:
      "Integrated IBM W3ID authentication and authoritative Blue Pages identity handling.",
    icon: ShieldCheck,
    variant: "neutral",
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

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-6">
              {proofPoints.map(([title, description]) => (
                <div
                  key={title}
                  className="flex items-start gap-3 border-l-2 pl-3"
                  style={{ borderColor: "var(--primary)" }}
                >
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {description}
                    </p>
                  </div>
                </div>
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
                      backgroundColor: "var(--surface-accent)",
                      color: "var(--primary)",
                      border: "1px solid var(--border-color)",
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

            <div className="mt-5 flex items-center justify-center gap-2 overflow-x-auto pb-1">
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
            <div className="mb-10 max-w-xl">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--primary)" }}
              >
                Features
              </p>
              <h2
                className="text-3xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.025em",
                }}
              >
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
      </main>

      <footer
        className="border-t py-5"
        style={{
          backgroundColor: "var(--bg-muted)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-primary)",
              }}
            >
              <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Planning Poker &copy; 2026
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="#features"
              className="transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Features
            </Link>
            <Link
              href="/faq"
              className="transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              FAQ
            </Link>
            <Link
              href="/legal"
              className="transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Legal
            </Link>
            <a
              href="mailto:support@planningpoker.com"
              className="transition-opacity hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </PageShell>
  );
}

// Made with Bob

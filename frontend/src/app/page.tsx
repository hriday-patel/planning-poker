"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const ibmLogoUrl =
  process.env.NEXT_PUBLIC_IBM_LOGO_URL ||
  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        const response = await fetch(`${appUrl}/api/v1/auth/me`, {
          credentials: "include",
        });
        setIsAuthenticated(response.ok);
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
      router.push("/login");
    }
  };

  const primaryButtonStyle = {
    background:
      "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
    color: "white",
    boxShadow:
      "0 16px 40px -24px color-mix(in srgb, var(--primary) 70%, transparent)",
  } as const;

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        background:
          "radial-gradient(circle at top, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 26%), var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <nav
        className="border-b backdrop-blur supports-[backdrop-filter]:bg-[color:var(--overlay)]"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                color: "white",
                boxShadow:
                  "0 18px 40px -24px color-mix(in srgb, var(--primary) 70%, transparent)",
              }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight">
                Planning Poker
              </span>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                IBM-ready estimation for agile teams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/faq"
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              FAQs
            </a>
            <ThemeToggle />
            {isAuthenticated ? (
              <button
                onClick={() => router.push("/create")}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-transform hover:-translate-y-0.5"
                style={primaryButtonStyle}
              >
                Create Game
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-transform hover:-translate-y-0.5"
                style={primaryButtonStyle}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
              style={{
                backgroundColor: "var(--surface-secondary)",
                borderColor: "var(--border-muted)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--accent)" }}
              />
              Secure collaboration with IBM W3ID
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Sprint Planning
              <br />
              <span style={{ color: "var(--primary)" }}>Made Simple</span>
            </h1>

            <p
              className="mb-8 max-w-xl text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              Real-time Planning Poker for agile teams. Estimate user stories
              collaboratively with IBM-authenticated access, secure invite
              links, and a polished workspace built for focus.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleStartGame}
                className="flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-semibold transition-transform hover:-translate-y-0.5"
                style={primaryButtonStyle}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Start New Game
              </button>

              <a
                href="#features"
                className="rounded-2xl border px-8 py-4 text-center text-lg font-semibold transition-colors"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                Learn More
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Real-time", "Live voting and reveal flow"],
                ["Secure", "IBM W3ID and Blue Pages identity"],
                ["Shareable", "Simple URL invite links"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-muted)",
                  }}
                >
                  <p className="font-semibold">{title}</p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-[28px] border p-6 shadow-2xl"
              style={{
                backgroundColor: "var(--surface-elevated)",
                borderColor: "var(--border-color)",
                boxShadow:
                  "0 40px 90px -48px color-mix(in srgb, var(--text-primary) 30%, transparent)",
              }}
            >
              <div
                className="mb-5 flex items-center justify-between rounded-2xl border px-4 py-3"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-muted)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold">Sprint 24 Estimation</p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Connected team workspace
                  </p>
                </div>
                <div
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--success) 18%, transparent)",
                    color: "var(--success)",
                  }}
                >
                  Live
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-3 rounded-2xl p-4 animate-pulse"
                      style={{
                        animationDelay: `${i * 200}ms`,
                        backgroundColor: "var(--surface-primary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor:
                            i === 2 ? "var(--accent)" : "var(--primary)",
                          color: "white",
                        }}
                      >
                        {["AK", "RM", "JS"][i - 1]}
                      </div>
                      <div
                        className="flex h-20 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white"
                        style={{
                          background:
                            i === 2
                              ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 72%, black 28%))"
                              : "linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 72%, black 28%))",
                        }}
                      >
                        {["5", "8", "?"][i - 1]}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <div
                    className="inline-flex rounded-xl px-8 py-3 font-medium text-white"
                    style={primaryButtonStyle}
                  >
                    Reveal Cards
                  </div>
                </div>

                <div className="flex justify-center gap-2 overflow-x-auto">
                  {["1", "2", "3", "5", "8", "13", "?"].map((value) => (
                    <div
                      key={value}
                      className="flex h-16 w-12 cursor-pointer items-center justify-center rounded-xl border font-bold transition-transform hover:-translate-y-1"
                      style={{
                        backgroundColor: "var(--surface-primary)",
                        borderColor:
                          value === "8"
                            ? "var(--primary)"
                            : "var(--border-muted)",
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
            </div>

            <div
              className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: "var(--primary)" }}
            />
            <div
              className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: "var(--accent)" }}
            />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-20"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold">
            Why Teams Love Planning Poker
          </h2>
          <p
            className="mx-auto mb-12 max-w-2xl text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            A minimal, enterprise-friendly workflow for planning sessions that
            stay fast, secure, and aligned.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Real-time Voting",
                description:
                  "Instant synchronization across all participants with responsive WebSocket updates.",
                color: "var(--primary)",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                title: "Completely Free",
                description:
                  "Unlimited games and unlimited voting rounds with no premium tiers or usage caps.",
                color: "var(--success)",
                icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                title: "Enterprise Security",
                description:
                  "Integrated IBM W3ID authentication and authoritative Blue Pages identity handling.",
                color: "var(--accent)",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              },
              {
                title: "Customizable Decks",
                description:
                  "Support Fibonacci, T-shirt sizes, or a custom deck tailored to your workflow.",
                color: "var(--warning)",
                icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
              },
              {
                title: "Built-in Timer",
                description:
                  "Keep discussions focused with synchronized countdown timers that reset cleanly.",
                color: "var(--danger)",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                title: "Voting Analytics",
                description:
                  "Review averages, consensus levels, and the full history of every session.",
                color: "var(--secondary)",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border p-8"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: feature.color }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p style={{ color: "var(--text-tertiary)" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div
            className="mx-auto max-w-4xl rounded-[32px] border px-8 py-12 text-center"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            <p
              className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Trusted enterprise foundation
            </p>
            <h2 className="mb-3 text-3xl font-bold">Built for IBM teams</h2>
            <p
              className="mx-auto mb-8 max-w-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              Authenticated access, corporate identity consistency, and secure
              collaboration flows designed around IBM's ecosystem.
            </p>
            <div
              className="inline-flex items-center justify-center rounded-3xl border px-10 py-6"
              style={{
                backgroundColor: "var(--surface-secondary)",
                borderColor: "var(--border-muted)",
              }}
            >
              <img
                src={ibmLogoUrl}
                alt="IBM logo"
                className="h-12 w-auto"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-20"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 92%, black 8%) 0%, color-mix(in srgb, var(--accent) 78%, var(--primary) 22%) 100%)",
          color: "white",
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-6 text-4xl font-bold">
            Ready to improve your sprint planning?
          </h2>
          <p className="mb-8 text-xl text-white/80">
            Start a focused, secure estimation session in minutes.
          </p>
          <button
            onClick={handleStartGame}
            className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition-transform hover:-translate-y-0.5"
          >
            Start Your First Game
          </button>
        </div>
      </section>

      <footer
        className="border-t py-12"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <span className="font-semibold">Planning Poker</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Real-time sprint estimation for agile teams
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Product</h3>
              <ul
                className="space-y-2 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                <li>
                  <a
                    href="#features"
                    className="transition-colors hover:opacity-80"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/create"
                    className="transition-colors hover:opacity-80"
                  >
                    Create Game
                  </a>
                </li>
                <li>
                  <a href="/faq" className="transition-colors hover:opacity-80">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Support</h3>
              <ul
                className="space-y-2 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                <li>
                  <a href="/faq" className="transition-colors hover:opacity-80">
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@planningpoker.com"
                    className="transition-colors hover:opacity-80"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="/legal"
                    className="transition-colors hover:opacity-80"
                  >
                    Legal Notice
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Company</h3>
              <ul
                className="space-y-2 text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                <li>
                  <a
                    href="/legal"
                    className="transition-colors hover:opacity-80"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/legal"
                    className="transition-colors hover:opacity-80"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="mt-8 border-t pt-8 text-center text-sm"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-tertiary)",
            }}
          >
            <p>&copy; 2026 Planning Poker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Made with Bob

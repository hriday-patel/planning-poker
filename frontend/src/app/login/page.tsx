"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Layers3,
  LogIn,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { apiFetch } from "@/lib/api";
import { Alert, Badge, Button, Card, PageShell } from "@/components/ui";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const errorMessage = useMemo(() => {
    const error = searchParams.get("error");

    switch (error) {
      case "auth_failed":
        return "Authentication failed. Please try signing in again.";
      case "invalid_state":
        return "Your sign-in session expired. Please start again.";
      case "server_error":
        return "A server error occurred during sign-in.";
      default:
        return null;
    }
  }, [searchParams]);

  const returnTo = useMemo(() => {
    const explicitReturnTo = searchParams.get("returnTo");
    const invite = searchParams.get("invite");
    const gameId = searchParams.get("gameId");

    if (
      explicitReturnTo?.startsWith("/") &&
      !explicitReturnTo.startsWith("//")
    ) {
      return explicitReturnTo;
    }

    if (invite && gameId) {
      return `/game/${gameId}?invite=${encodeURIComponent(invite)}`;
    }

    return "/";
  }, [searchParams]);

  useEffect(() => {
    const checkSession = async () => {
      if (searchParams.get("error")) {
        return;
      }

      try {
        const response = await apiFetch("/api/v1/auth/me");

        if (response.ok) {
          const data = await response.json();

          if (data.user?.isGuest) {
            return;
          }

          router.push(returnTo);
        }
      } catch (_error) {
        // Ignore bootstrap failures on login screen
      }
    };

    void checkSession();
  }, [router, returnTo, searchParams]);

  const handleW3IDLogin = () => {
    setIsRedirecting(true);

    const loginUrl =
      process.env.NEXT_PUBLIC_W3ID_LOGIN_URL ||
      "http://localhost:3002/api/v1/auth/w3id";
    const redirectUrl = `${loginUrl}?returnTo=${encodeURIComponent(returnTo)}`;

    window.location.href = redirectUrl;
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
              <span
                className="hidden text-xs sm:block"
                style={{ color: "var(--text-tertiary)" }}
              >
                Secure estimation workspace
              </span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="container mx-auto flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-6 sm:p-8" variant="primary">
          <Badge variant="info" className="mb-5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            IBM W3ID
          </Badge>

          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p
            className="mt-2 leading-7"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign in with IBM W3ID to access your planning sessions.
          </p>

          {errorMessage && (
            <Alert variant="danger" className="mt-6">
              {errorMessage}
            </Alert>
          )}

          <Button
            type="button"
            onClick={handleW3IDLogin}
            disabled={isRedirecting}
            className="mt-6 w-full"
            size="lg"
          >
            {isRedirecting ? (
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <LogIn className="h-5 w-5" aria-hidden="true" />
            )}
            {isRedirecting
              ? "Redirecting to IBM W3ID..."
              : "Sign in with IBM W3ID"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            className="mt-3 w-full"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Button>

          <div
            className="mt-6 border-t pt-5 text-sm leading-6"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-tertiary)",
            }}
          >
            IBM W3ID authentication automatically retrieves your official
            display name from Blue Pages. Your corporate display name is
            read-only and cannot be edited.
          </div>
        </Card>
      </main>
    </PageShell>
  );
}

function LoginFallback() {
  return (
    <PageShell className="flex items-center justify-center">
      <div
        className="flex items-center gap-3"
        style={{ color: "var(--text-secondary)" }}
      >
        <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading...
      </div>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

// Made with Bob

import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import "../styles/globals.css";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/contexts/ThemeContext";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planning Poker - Sprint Estimation Tool",
  description:
    "Real-time sprint planning poker for agile teams with IBM W3ID authentication",
  keywords: [
    "planning poker",
    "scrum",
    "agile",
    "estimation",
    "sprint planning",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${dmSans.variable} font-body`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Made with Bob

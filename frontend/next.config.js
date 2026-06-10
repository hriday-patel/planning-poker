/** @type {import('next').NextConfig} */

const nextConfig = {
  // Keep `/socket.io/` intact so Socket.IO polling works through the dev proxy.
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  images: {
    domains: ["i.pravatar.cc", "localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3002",
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/socket.io",
        destination: `${backendUrl}/socket.io`,
      },
      {
        source: "/socket.io/",
        destination: `${backendUrl}/socket.io/`,
      },
    ];
  },
};

module.exports = nextConfig;

// Made with Bob

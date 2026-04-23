/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["i.pravatar.cc", "localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://localhost:3001",
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL || "https://localhost:3001",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

// Made with Bob

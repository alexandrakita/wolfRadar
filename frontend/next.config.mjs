/** @type {import('next').NextConfig} */
const backend = process.env.STOCKY_BACKEND_URL || "http://127.0.0.1:3333";

const nextConfig = {
  transpilePackages: [],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "financialmodelingprep.com", pathname: "**" },
      { protocol: "https", hostname: "logo.clearbit.com", pathname: "**" },
      { protocol: "https", hostname: "**.yahoo.com", pathname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backend.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

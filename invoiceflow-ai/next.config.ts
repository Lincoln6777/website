import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Disable PWA on Vercel to avoid 404 / routing issues; enable in dev or self-host
const isVercel = process.env.VERCEL === "1";
const pwaDisabled = process.env.NODE_ENV === "development" || isVercel;

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: pwaDisabled,
})(nextConfig);

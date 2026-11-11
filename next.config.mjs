/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No ESLint setup in this project; type-checking still runs during `next build`.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Node-only libraries used by the import pipeline; keep them out of the bundle.
    serverComponentsExternalPackages: ['mammoth', 'sanitize-html'],
  },
};

export default nextConfig;

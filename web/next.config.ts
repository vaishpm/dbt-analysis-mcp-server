import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the SDK to run stdio MCP servers via npx
  serverExternalPackages: ["@cursor/sdk"],
  // Produce a self-contained bundle for Docker
  output: "standalone",
};

export default nextConfig;

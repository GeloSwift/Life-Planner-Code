import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler (experimental)
  reactCompiler: true,
  
  // Output standalone build for Docker deployment
  // This creates a minimal production build that doesn't need node_modules
  output: "standalone",
};

export default nextConfig;

// Note: To disable telemetry, use the environment variable:
// NEXT_TELEMETRY_DISABLED=1

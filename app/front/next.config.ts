import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler (experimental)
  reactCompiler: true,
  
  // Output standalone build for Docker deployment
  // This creates a minimal production build that doesn't need node_modules
  output: "standalone",
  
  // Disable telemetry
  telemetry: false,
};

export default nextConfig;

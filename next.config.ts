import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/david188888.github.io" : "",
  assetPrefix: isGitHubPages ? "/david188888.github.io" : "",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  devIndicators: false,
};

export default nextConfig;

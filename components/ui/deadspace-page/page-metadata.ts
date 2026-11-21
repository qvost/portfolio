import type { DeadspaceRoute } from "./fragments";
import { profile } from "./portfolio-data";

export const siteOrigin = "https://qvost.vercel.app";
export const defaultAssetBase = "https://ui.aryank.space/assets/deadspace-page";

export const pageMetadata = {
  "/": {
    title: `${profile.handle} | Siddid Pandey, Software & Systems Research`,
    description: "qvost is the portfolio of Siddid Pandey, a software and systems researcher in Kathmandu, Nepal. Explore Statis, Strata, Reify, and other open source projects.",
  },
  "/work": {
    title: "Open Source Projects | qvost",
    description: "Browse Siddid Pandey’s open source projects, including Statis for reproducible execution, Strata for vector search, and Vecta for binary analysis.",
  },
  "/project": {
    title: "Reify | qvost",
    description: "Reify is Siddid Pandey’s open source Rust project for turning observed web requests into typed MCP tools. Read about the architecture and find the source code.",
  },
  "/lab": {
    title: "Shaligram Labs | qvost",
    description: "Explore Siddid Pandey’s independent systems research at Shaligram Labs in Kathmandu, Nepal, covering repeatable execution, vector search, and web interfaces.",
  },
  "/contact": {
    title: "Contact Siddid Pandey | qvost",
    description: "Contact Siddid Pandey (qvost) in Kathmandu, Nepal, by email or find his work on GitHub, LinkedIn, and Shaligram Labs.",
  },
} satisfies Record<DeadspaceRoute, { title: string; description: string }>;

export function isPortfolioRoute(path: string): path is DeadspaceRoute {
  return Object.hasOwn(pageMetadata, path);
}

export const portfolioRoutes = Object.keys(pageMetadata).filter(isPortfolioRoute);

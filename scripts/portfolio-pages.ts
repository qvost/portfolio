import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import type { Plugin } from "vite";
import { pageMetadata, portfolioRoutes, siteOrigin } from "../components/ui/deadspace-page/page-metadata";
import { getDeadspaceFragment, profile } from "../components/ui/deadspace-page/portfolio";
import { getDeadspacePageStyles } from "../components/ui/deadspace-page/styles";

const projectStyles = new URL("../components/ui/deadspace-page/", import.meta.url);

export function portfolioPages(assetBase: string): Plugin {
  return {
    name: "portfolio-pages",
    apply: "build",
    async writeBundle({ dir }) {
      if (!dir) throw new Error("Portfolio pages require an output directory.");

      const [shell, portfolioStyles, polishStyles] = await Promise.all([
        readFile(join(dir, "index.html"), "utf8"),
        readFile(new URL("portfolio.css", projectStyles), "utf8"),
        readFile(new URL("polish.css", projectStyles), "utf8"),
      ]);
      const css = [getDeadspacePageStyles(assetBase), portfolioStyles, polishStyles].join("\n");

      for (const route of portfolioRoutes) {
        const dom = new JSDOM(shell);
        const { document } = dom.window;
        const { title, description } = pageMetadata[route];
        const url = new URL(route, siteOrigin).href;
        document.title = title;

        const canonical = document.createElement("link");
        canonical.rel = "canonical";
        canonical.href = url;
        document.head.append(canonical);

        for (const [attribute, name, content] of [
          ["name", "description", description],
          ["property", "og:title", title],
          ["property", "og:description", description],
          ["property", "og:site_name", profile.handle],
          ["property", "og:url", url],
          ["property", "og:type", "website"],
        ]) {
          const meta = document.createElement("meta");
          meta.setAttribute(attribute, name);
          meta.content = content;
          document.head.append(meta);
        }

        if (route === "/") {
          const data = document.createElement("script");
          data.type = "application/ld+json";
          data.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "WebSite", name: profile.handle, url },
              {
                "@type": "ProfilePage",
                url,
                mainEntity: {
                  "@type": "Person",
                  name: profile.name,
                  alternateName: profile.handle,
                  sameAs: [profile.github, profile.linkedin, profile.x],
                },
              },
            ],
          }).replaceAll("<", "\\u003c");
          document.head.append(data);
        }

        const root = document.getElementById("root");
        if (!root) throw new Error("Portfolio mount point is missing from built HTML.");
        const page = document.createElement("div");
        page.className = "deadspace-page static-portfolio";
        const main = document.createElement("main");
        main.id = "top";
        main.className = `deadspace-route deadspace-route-${route === "/" ? "index" : route.slice(1)}`;
        main.innerHTML = getDeadspaceFragment(route, assetBase, document);
        main.querySelectorAll(
          ".preloader, .transition-grid, .menu-toggle-btn, .menu-overlay, .sound-toggle, .copy-email, .target-cursor, .cursor-point, .back-top",
        ).forEach(element => element.remove());
        main.querySelector(".nav-clock")?.setAttribute("hidden", "");
        main.querySelectorAll(".contact-clock").forEach(element => element.closest(".contact-info-row")?.remove());
        page.append(document.createComment("portfolio-page-styles"), main);
        root.replaceChildren(page);

        const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
        await writeFile(join(dir, file), dom.serialize().replace(
          "<!--portfolio-page-styles-->",
          () => `<style>${css}</style>`,
        ));
        dom.window.close();
      }

      const sitemap = portfolioRoutes.map(route => `  <url><loc>${new URL(route, siteOrigin).href}</loc></url>`);
      await Promise.all([
        writeFile(join(dir, "sitemap.xml"), [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...sitemap,
          "</urlset>",
          "",
        ].join("\n")),
        writeFile(join(dir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`),
      ]);
    },
  };
}

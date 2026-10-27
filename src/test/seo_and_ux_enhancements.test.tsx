import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, act, cleanup } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { useBirthdayStore } from "@/features/core/store/useBirthdayStore";
import { useDynamicSEO } from "@/features/core/seo/useDynamicSEO";

const SEOTestComponent = () => {
  const config = useBirthdayStore((state) => state.config);
  useDynamicSEO(config);
  return null;
};

describe("SEO, UX, and PWA Enhancements Test Suite", () => {
  const initialConfig = useBirthdayStore.getState().config;

  beforeEach(() => {
    document.title = "Initial Title";
    useBirthdayStore.setState({ config: { ...initialConfig } });
  });

  afterEach(() => {
    cleanup();
    useBirthdayStore.setState({ config: initialConfig });
  });

  describe("Dynamic Document Title in Index.tsx", () => {
    it("updates document title with English greeting when name is set", () => {
      act(() => {
        useBirthdayStore.setState({
          config: {
            ...initialConfig,
            name: "Alice",
            language: "en",
          },
        });
      });

      act(() => {
        render(<SEOTestComponent />);
      });
      expect(document.title).toBe("Happy Birthday Alice! | Birthday Bloom");
    });

    it("updates document title with Bengali greeting when language is bn", () => {
      act(() => {
        useBirthdayStore.setState({
          config: {
            ...initialConfig,
            name: "অনিন্দিতা",
            language: "bn",
          },
        });
      });

      act(() => {
        render(<SEOTestComponent />);
      });
      expect(document.title).toBe("শুভ জন্মদিন অনিন্দিতা! | Birthday Bloom");
    });

    it("updates document title with Hindi greeting when language is hi", () => {
      act(() => {
        useBirthdayStore.setState({
          config: {
            ...initialConfig,
            name: "राहुल",
            language: "hi",
          },
        });
      });

      act(() => {
        render(<SEOTestComponent />);
      });
      expect(document.title).toBe("जन्मदिन मुबारक राहुल! | Birthday Bloom");
    });

    it("updates document title with French greeting when language is fr", () => {
      act(() => {
        useBirthdayStore.setState({
          config: {
            ...initialConfig,
            name: "Camille",
            language: "fr",
          },
        });
      });

      act(() => {
        render(<SEOTestComponent />);
      });
      expect(document.title).toBe("Joyeux Anniversaire Camille! | Birthday Bloom");
    });

    it("falls back to default title when name is empty or whitespace", () => {
      act(() => {
        useBirthdayStore.setState({
          config: {
            ...initialConfig,
            name: "   ",
            language: "en",
          },
        });
      });

      act(() => {
        render(<SEOTestComponent />);
      });
      expect(document.title).toBe("Birthday Bloom | Magical Cinematic Birthday Celebration Website");
    });
  });

  describe("index.html SEO, Social, and JSON-LD Verification", () => {
    const indexPath = path.resolve(process.cwd(), "index.html");
    const htmlContent = fs.readFileSync(indexPath, "utf-8");

    it("contains canonical link tag", () => {
      expect(htmlContent).toContain('<link rel="canonical" href="https://anne-birthday-surprise.vercel.app/" />');
    });

    it("contains OpenGraph locale and alternate language tags", () => {
      expect(htmlContent).toContain('<meta property="og:locale" content="fr_FR" />');
      expect(htmlContent).toContain('<meta property="og:site_name" content="Anne’s Birthday Surprise" />');
      expect(htmlContent).toContain('Joyeux anniversaire, Anne');
    });

    it("contains personalized Twitter metadata without the original author's social handle", () => {
      expect(htmlContent).toContain('<meta name="twitter:title" content="Joyeux anniversaire, Anne ❤️" />');
      expect(htmlContent).toContain('name="twitter:description"');
      expect(htmlContent).not.toContain('name="twitter:creator" content="@NSGAMMING699"');
    });

    it("does not publish stale structured data for the original template deployment", () => {
      expect(htmlContent).not.toContain('https://birthday-bloom.vercel.app/');
      expect(htmlContent).not.toContain('"name": "Birthday Bloom"');
      expect(htmlContent).toContain('Anne’s Birthday Surprise');
    });

    it("contains semantic crawlable noscript fallback", () => {
      expect(htmlContent).toContain("<noscript>");
      expect(htmlContent).toContain("<h1>Joyeux anniversaire, Anne");
      expect(htmlContent).toContain("3D Interactive Cake Cutting");
    });
  });

  describe("PWA Manifest Synchronization in public/site.webmanifest", () => {
    const manifestPath = path.resolve(process.cwd(), "public/site.webmanifest");
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const parsedManifest = JSON.parse(manifestContent);

    it("harmonizes theme_color, background_color, categories, and shortcuts", () => {
      expect(parsedManifest.name).toBe("Anne’s Birthday Surprise");
      expect(parsedManifest.theme_color).toBe("#ff4d8d");
      expect(parsedManifest.background_color).toBe("#fff5f8");
      expect(parsedManifest.lang).toBe("fr");
      expect(parsedManifest.categories).toContain("entertainment");
      expect(Array.isArray(parsedManifest.shortcuts)).toBe(true);
      expect(parsedManifest.shortcuts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Robots.txt and Sitemap.xml Verification", () => {
    const robotsPath = path.resolve(process.cwd(), "public/robots.txt");
    const robotsContent = fs.readFileSync(robotsPath, "utf-8");

    it("robots.txt configures search engines, AI crawlers, and sitemap pointer", () => {
      expect(robotsContent).toContain("User-agent: Googlebot");
      expect(robotsContent).toContain("User-agent: GPTBot");
      expect(robotsContent).toContain("User-agent: ClaudeBot");
      expect(robotsContent).toContain("User-agent: PerplexityBot");
      expect(robotsContent).toContain("Sitemap: https://anne-birthday-surprise.vercel.app/sitemap.xml");
    });

    const sitemapPath = path.resolve(process.cwd(), "public/sitemap.xml");
    const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");

    it("sitemap.xml contains multilingual hreflang and archetypes", () => {
      expect(sitemapContent).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
      expect(sitemapContent).toContain('hreflang="bn"');
      expect(sitemapContent).toContain('hreflang="hi"');
      expect(sitemapContent).toContain('hreflang="fr"');
      expect(sitemapContent).toContain("relationship=partner");
      expect(sitemapContent).toContain("relationship=friend");
      expect(sitemapContent).toContain("relationship=family");
    });
  });
});

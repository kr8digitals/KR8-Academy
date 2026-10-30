import { useEffect } from "react";

const SITE = "KR8 Academy";
const BASE = "https://academy.kr8digitals.com";

type SeoInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeo({ title, description, path = "/", image, jsonLd, noindex }: SeoInput) {
  useEffect(() => {
    const fullTitle = title.includes(SITE) ? title : `${title} · ${SITE}`;
    document.title = fullTitle;
    const desc =
      description ??
      "KR8 Academy is the tuition-free school of KR8 Digitals — eight-week cohorts in design, video, web, front-end, content, social media and digital marketing.";
    setMeta('meta[name="description"]', "name", "description", desc);

    const url = `${BASE}${path}`;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    if (image) setMeta('meta[property="og:image"]', "property", "og:image", `${BASE}${image}`);
    setMeta(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      "summary_large_image"
    );
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex,nofollow" : "index,follow");

    const scriptId = "kr8-jsonld";
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = scriptId;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, path, image, jsonLd, noindex]);
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "KR8 Academy",
  alternateName: "KR8 Digitals Academy",
  url: BASE,
  logo: `${BASE}/brand/kr8-logo.png`,
  description:
    "A tuition-free creative academy offering eight-week cohort-based training in graphic design, video editing, website development, front-end engineering, content creation, social media management and digital marketing.",
  parentOrganization: { "@type": "Organization", name: "KR8 Digitals", url: "https://www.kr8digitals.com" },
  address: { "@type": "PostalAddress", addressCountry: "NG" },
  email: "academy@kr8digitals.com",
  sameAs: ["https://instagram.com/kr8digitals", "https://tiktok.com/@kr8digitals"],
};

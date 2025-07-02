const fetch = require("node-fetch");

export async function handler() {
  const staticUrls = [
    "index.html", "cabinet.html", "expertises.html", "secteurs.html",
    "blog.html", "outils.html", "contact.html", "iso.html", "mentions.html"
  ];

  const baseUrl = "https://www.placedesexperts.fr";
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeYPB8TcxaqiZL2FUMsiHxLkpg6669WPPq3gzfgz16s-EYrMA8Q4NrzJODs2EFr1cuL3OsvRtMi0Nq/pub?output=csv";

  try {
    const response = await fetch(sheetUrl);
    const csv = await response.text();
    const rows = csv.split("\n").slice(1).filter(Boolean);

    const dynamicUrls = rows.map(row => {
      const title = row.split(",")[0]?.trim();
      const slug = normalizeTitle(title);
      return `${baseUrl}/article.html?title=${encodeURIComponent(slug)}`;
    });

    const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.map(p => `
    <url><loc>${baseUrl}/${p}</loc></url>
  `).join("")}
  ${dynamicUrls.map(u => `
    <url><loc>${u}</loc></url>
  `).join("")}
</urlset>
`.trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: sitemapXml,
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: "Erreur lors de la génération du sitemap.",
    };
  }
}

function normalizeTitle(str = "") {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .replace(/-/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase()
    .trim();
}

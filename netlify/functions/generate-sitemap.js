const fetch = require("node-fetch");

exports.handler = async function () {
  const baseUrl = "http://www2.placedesexperts.fr";
  const staticUrls = [
    { path: "index.html", priority: "1.0" },
    { path: "cabinet.html", priority: "0.8" },
    { path: "expertises.html", priority: "0.8" },
    { path: "secteurs.html", priority: "0.7" },
    { path: "blog.html", priority: "0.6" },
    { path: "outils.html", priority: "0.5" },
    { path: "contact.html", priority: "0.9" },
    { path: "iso.html", priority: "0.4" },
    { path: "mentions.html", priority: "0.4" },
  ];

  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeYPB8TcxaqiZL2FUMsiHxLkpg6669WPPq3gzfgz16s-EYrMA8Q4NrzJODs2EFr1cuL3OsvRtMi0Nq/pub?output=csv";

  try {
    const response = await fetch(sheetUrl);
    const csv = await response.text();
    const rows = csv.split("\n").slice(1).filter(Boolean);

    const articleUrls = rows.map(row => {
      const title = row.split(",")[0]?.trim();
      const slug = normalizeTitle(title);
      return {
        loc: `${baseUrl}/article.html?title=${encodeURIComponent(slug)}`,
        priority: "0.6"
      };
    });

    const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.map(({ path, priority }) => `
    <url>
      <loc>${baseUrl}/${path}</loc>
      <priority>${priority}</priority>
    </url>
  `).join("")}
  ${articleUrls.map(({ loc, priority }) => `
    <url>
      <loc>${loc}</loc>
      <priority>${priority}</priority>
    </url>
  `).join("")}
</urlset>
`.trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: sitemapXml,
    };

  } catch (error) {
    console.error("Erreur détaillée :", error);
    return {
      statusCode: 500,
      body: "Erreur lors de la génération du sitemap.",
    };
  }
};

function normalizeTitle(str = "") {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .replace(/-/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase()
    .trim();
}

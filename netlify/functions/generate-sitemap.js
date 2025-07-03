const fetch = require("node-fetch");

exports.handler = async function () {
  const staticUrls = [
    "index.html", "cabinet.html", "expertises.html", "secteurs.html",
    "blog.html", "outils.html", "contact.html", "iso.html", "mentions.html"
  ];

  const baseUrl = "https://www2.placedesexperts.fr"; // temporaire
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeYPB8TcxaqiZL2FUMsiHxLkpg6669WPPq3gzfgz16s-EYrMA8Q4NrzJODs2EFr1cuL3OsvRtMi0Nq/pub?output=csv";

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Échec fetch: ${response.statusText}`);

    const csv = await response.text();
    const rows = csv.split("\n").slice(1).filter(Boolean);

    const dynamicUrls = rows.map(row => {
      const title = row.split(",")[0]?.trim();
      if (!title) return null;
      const slug = normalizeTitle(title);
      return `${baseUrl}/article.html?title=${encodeURIComponent(slug)}`;
    }).filter(Boolean); // supprime les null

    const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.map(p => `<url><loc>${baseUrl}/${p}</loc></url>`).join("\n")}
  ${dynamicUrls.map(u => `<url><loc>${u}</loc></url>`).join("\n")}
</urlset>
    `.trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: sitemapXml,
    };
  } catch (error) {
    console.error("Erreur détaillée sitemap :", error);
    return {
      statusCode: 500,
      body: "Erreur lors de la génération du sitemap.",
    };
  }
};

function normalizeTitle(str = "") {
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // Supprime accents
    .replace(/’/g, "'")                  // Apostrophes
    .replace(/-/g, " ")                  // Tirets → espaces
    .replace(/[^a-zA-Z0-9\s]/g, "")      // Supprime spéciaux
    .toLowerCase()
    .trim();
}

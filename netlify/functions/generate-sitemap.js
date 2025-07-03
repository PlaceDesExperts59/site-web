const fetch = require("node-fetch");

exports.handler = async function () {
  const staticUrls = [
    "index.html", "cabinet.html", "expertises.html", "secteurs.html",
    "blog.html", "outils.html", "contact.html", "iso.html", "mentions.html"
  ];

  const baseUrl = "https://www2.placedesexperts.fr";
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeYPB8TcxaqiZL2FUMsiHxLkpg6669WPPq3gzfgz16s-EYrMA8Q4NrzJODs2EFr1cuL3OsvRtMi0Nq/pub?output=csv";

  try {
    console.log("📥 Fetching CSV from Google Sheets...");
    const response = await fetch(sheetUrl);
    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      console.error("❌ Erreur HTTP:", response.statusText);
      throw new Error(`Échec fetch: ${response.statusText}`);
    }

    const csv = await response.text();
    console.log("🧾 CSV reçu. Longueur brute:", csv.length);

    const rows = csv.split("\n").slice(1).filter(Boolean);
    console.log("🔢 Nombre de lignes (sans header):", rows.length);

    const dynamicUrls = rows.map((row, i) => {
      const title = row.split(",")[0]?.trim();
      if (!title) {
        console.warn(`⚠️ Ligne ${i + 2} ignorée : titre vide`);
        return null;
      }
      const slug = normalizeTitle(title);
      const url = `${baseUrl}/article.html?title=${encodeURIComponent(slug)}`;
      console.log(`✅ [${i + 2}] ${title} → ${url}`);
      return url;
    }).filter(Boolean);

    const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.map(p => `<url><loc>${baseUrl}/${p}</loc></url>`).join("\n")}
  ${dynamicUrls.map(u => `<url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`.trim();

    console.log("✅ Sitemap généré avec", staticUrls.length + dynamicUrls.length, "URLs");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: sitemapXml,
    };
  } catch (error) {
  console.error("❌ Erreur finale attrapée :", error);
  return {
    statusCode: 500,
    headers: { "Content-Type": "text/plain" },
    body: `Erreur lors de la génération du sitemap : ${error.message || error}`,
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

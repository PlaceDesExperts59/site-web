
const Papa = require("papaparse");

exports.handler = async function () {
  const staticUrls = [
    { page: "index.html", priority: 1.0 },
    { page: "cabinet.html", priority: 0.8 },
    { page: "expertises.html", priority: 0.8 },
    { page: "secteurs.html", priority: 0.8 },
    { page: "blog.html", priority: 0.7 },
    { page: "outils.html", priority: 0.7 },
    { page: "contact.html", priority: 0.9 },
    { page: "iso.html", priority: 0.5 },
    { page: "mentions.html", priority: 0.4 }
  ];

  const baseUrl = "http://www2.placedesexperts.fr";
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeYPB8TcxaqiZL2FUMsiHxLkpg6669WPPq3gzfgz16s-EYrMA8Q4NrzJODs2EFr1cuL3OsvRtMi0Nq/pub?output=csv";

  try {
    console.log("📥 Récupération du CSV...");
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Erreur fetch: ${response.statusText}`);

    const csv = await response.text();
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    console.log(`🧾 ${parsed.data.length} lignes valides trouvées.`);

    const dynamicUrls = parsed.data.map((row, i) => {
      const title = row["Titre"]?.trim(); // <- lecture propre de la vraie colonne
      if (!title) {
        console.warn(`⚠️ Ligne ${i + 2} ignorée (pas de titre)`);
        return null;
      }
      const slug = normalizeTitle(title);
      const url = `${baseUrl}/article.html?title=${encodeURIComponent(slug)}`;
      return `<url><loc>${url}</loc><priority>0.5</priority></url>`;
    }).filter(Boolean);

    const beforeArticles = staticUrls
      .filter(p => p.page !== "outils.html" && p.page !== "contact.html" && p.page !== "iso.html" && p.page !== "mentions.html")
      .map(p => {
        const loc = p.page === "index.html" ? `${baseUrl}/` : `${baseUrl}/${p.page}`;
        return `<url><loc>${loc}</loc><priority>${p.priority}</priority></url>`;
      });


    const afterArticles = staticUrls
      .filter(p => ["outils.html", "contact.html", "iso.html", "mentions.html"].includes(p.page))
      .map(p => `<url><loc>${baseUrl}/${p.page}</loc><priority>${p.priority}</priority></url>`);

    const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...beforeArticles, ...dynamicUrls, ...afterArticles].join("\n")}
</urlset>`.trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: sitemapXml,
    };
  } catch (error) {
    console.error("❌ Erreur attrapée :", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: `Erreur lors de la génération du sitemap : ${error.message || error}`,
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

exports.handler = async function () {
  const baseUrl = "http://www2.placedesexperts.fr";
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeYPB8TcxaqiZL2FUMsiHxLkpg6669WPPq3gzfgz16s-EYrMA8Q4NrzJODs2EFr1cuL3OsvRtMi0Nq/pub?output=csv";

  const staticPages = [
    { path: "index.html", priority: "1.0" },
    { path: "cabinet.html", priority: "0.9" },
    { path: "expertises.html", priority: "0.9" },
    { path: "secteurs.html", priority: "0.9" },
    { path: "blog.html", priority: "0.8" },
    { path: "outils.html", priority: "0.6" },
    { path: "contact.html", priority: "0.6" },
    { path: "iso.html", priority: "0.6" },
    { path: "mentions.html", priority: "0.5" }
  ];

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.statusText}`);

    const csv = await response.text();
    const rows = csv.split("\n").slice(1).filter(Boolean);

    const dynamicUrls = rows.map((row, i) => {
      const cells = row.split(",");
      const title = cells[1]?.trim(); // colonne "Titre"
      if (!title) return null;

      const slug = normalizeTitle(title);
      const loc = `${baseUrl}/article.html?title=${encodeURIComponent(slug)}`;

      return `<url><loc>${loc}</loc><priority>0.7</priority></url>`;
    }).filter(Boolean);

    const staticXml = staticPages.map(p =>
      `<url><loc>${baseUrl}/${p.path}</loc><priority>${p.priority}</priority></url>`
    ).join("\n");

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${dynamicUrls.join("\n")}
</urlset>`.trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: sitemapXml,
    };
  } catch (error) {
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

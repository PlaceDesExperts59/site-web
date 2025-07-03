exports.handler = async function () {
  const baseUrl = "http://www2.placedesexperts.fr";
  const staticUrls = [
    "index.html", "cabinet.html", "expertises.html", "secteurs.html",
    "blog.html", "outils.html", "contact.html", "iso.html", "mentions.html"
  ];

  const sitemapXml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.map(p => `
    <url><loc>${baseUrl}/${p}</loc></url>
  `).join("")}
</urlset>
`.trim();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/xml" },
    body: sitemapXml,
  };
};

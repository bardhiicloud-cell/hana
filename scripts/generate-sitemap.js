// HANA FREE SHOP — Dynamic Sitemap Generator for 100k
// Generates sitemap.xml from Firestore products

import fs from 'fs';

const BASE_URL = 'https://hanafreeshop.com';
const DATE = new Date().toISOString().split('T')[0];

// In production, fetch from Firestore
// const products = await fetchProductsFromFirestore();

const mockProducts = [
  {id: 'redbull-250ml', updatedAt: DATE},
  {id: 'lindt-lindor', updatedAt: DATE},
  {id: 'grey-goose-vodka', updatedAt: DATE},
  {id: 'jack-daniels', updatedAt: DATE},
  {id: 'puro-tobacco', updatedAt: DATE},
  {id: 'golden-eagle', updatedAt: DATE},
  {id: 'bulldak-noodles', updatedAt: DATE},
  {id: 'ice-cups', updatedAt: DATE},
];

const staticUrls = [
  {loc: '/', priority: '1.0', changefreq: 'daily'},
  {loc: '/market/', priority: '0.9', changefreq: 'daily'},
  {loc: '/market/?cat=ushqime-pije', priority: '0.8', changefreq: 'weekly'},
  {loc: '/market/?cat=cokollata-embelsira', priority: '0.8', changefreq: 'weekly'},
  {loc: '/market/?cat=pije-tonike', priority: '0.8', changefreq: 'weekly'},
  {loc: '/market/?cat=alkool', priority: '0.8', changefreq: 'weekly'},
  {loc: '/market/?cat=cigare', priority: '0.8', changefreq: 'weekly'},
  {loc: '/market/?cat=bulldak', priority: '0.8', changefreq: 'weekly'},
  {loc: '/market/?cat=ice', priority: '0.7', changefreq: 'weekly'},
  {loc: '/market/?filter=oferta', priority: '0.9', changefreq: 'daily'},
  {loc: '/market/?filter=popular', priority: '0.9', changefreq: 'daily'},
  {loc: '/terms.html', priority: '0.3', changefreq: 'monthly'},
  {loc: '/privacy.html', priority: '0.3', changefreq: 'monthly'},
  {loc: '/returns.html', priority: '0.3', changefreq: 'monthly'},
  {loc: '/shipping.html', priority: '0.3', changefreq: 'monthly'},
];

const productUrls = mockProducts.map(p => ({
  loc: `/market/?product=${p.id}`,
  lastmod: p.updatedAt,
  changefreq: 'weekly',
  priority: '0.7'
}));

const allUrls = [...staticUrls, ...productUrls];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod || DATE}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync('./sitemap.xml', sitemap);
console.log(`[Sitemap] Generated ${allUrls.length} URLs to sitemap.xml`);
console.log(`[SEO] Sitemap ready for Search Console - ${BASE_URL}/sitemap.xml`);

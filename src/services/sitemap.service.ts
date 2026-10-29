/**
 * @file sitemap.service.ts
 * @description Builds the public sitemap.xml from static marketing pages and
 *              every active vehicle listing slug.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as vehicleDao from '../dao/vehicle.dao';
import envConfig from '../config/environment';

const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/vehicles', priority: '0.9', changefreq: 'daily' },
  { path: '/sell', priority: '0.9', changefreq: 'weekly' },
  { path: '/emi-calculator', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const buildSitemap = async (): Promise<string> => {
  const { frontendUrl } = envConfig.getServerConfig();
  const base = frontendUrl.replace(/\/$/, '');

  const vehicles = await vehicleDao.findForSitemap(5000);
  const now = new Date().toISOString();

  const staticUrls = STATIC_PAGES.map(
    (p) => `  <url>
    <loc>${escapeXml(base + p.path)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  ).join('\n');

  const vehicleUrls = vehicles
    .map(
      (v: any) => `  <url>
    <loc>${escapeXml(`${base}/vehicles/${v.slug}`)}</loc>
    <lastmod>${new Date(v.updatedAt || now).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${vehicleUrls}
</urlset>`;
};

export default { buildSitemap };

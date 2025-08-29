import * as fs from 'fs';
import * as path from 'path';
import { storage } from '../storage';

export interface ExportOptions {
  format: 'static' | 'zip' | 'cdn';
  siteName: string;
  exportDirectory: string;
  includeLiveOnly: boolean;
  generateSitemap: boolean;
  minifyAssets: boolean;
  includeMedia: boolean;
}

export interface ExportResult {
  success: boolean;
  message: string;
  exportPath?: string;
  fileCount?: number;
  totalSize?: number;
}

export async function exportSite(options: ExportOptions): Promise<ExportResult> {
  try {
    const pages = options.includeLiveOnly 
      ? await storage.getPagesByState('Live')
      : await storage.getPages();

    if (pages.length === 0) {
      return {
        success: false,
        message: 'No pages to export'
      };
    }

    const exportDir = path.join(process.cwd(), options.exportDirectory);
    
    // Create export directory
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    let fileCount = 0;
    let totalSize = 0;

    // Export pages
    for (const page of pages) {
      const filename = page.name.toLowerCase().replace(/\s+/g, '-') + '.html';
      const filePath = path.join(exportDir, filename);
      
      // Combine HTML with embedded CSS and JS
      const fullHTML = combinePageAssets(page.html, page.css, page.js);
      
      fs.writeFileSync(filePath, fullHTML, 'utf8');
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      fileCount++;
    }

    // Export media files if requested
    if (options.includeMedia) {
      const mediaItems = await storage.getMedia();
      const mediaDir = path.join(exportDir, 'media');
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      for (const media of mediaItems) {
        try {
          if (fs.existsSync(media.path)) {
            const destPath = path.join(mediaDir, media.filename);
            fs.copyFileSync(media.path, destPath);
            totalSize += media.size;
            fileCount++;
          }
        } catch (error) {
          console.warn(`Failed to copy media file ${media.filename}:`, error);
        }
      }
    }

    // Generate sitemap if requested
    if (options.generateSitemap) {
      const sitemap = generateSitemap(pages, options.siteName);
      const sitemapPath = path.join(exportDir, 'sitemap.xml');
      fs.writeFileSync(sitemapPath, sitemap, 'utf8');
      const stats = fs.statSync(sitemapPath);
      totalSize += stats.size;
      fileCount++;
    }

    return {
      success: true,
      message: `Successfully exported ${fileCount} files`,
      exportPath: exportDir,
      fileCount,
      totalSize
    };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function combinePageAssets(html: string, css: string, js: string): string {
  // Insert CSS into head
  let combinedHTML = html;
  
  if (css) {
    const styleTag = `<style>\n${css}\n</style>`;
    if (combinedHTML.includes('</head>')) {
      combinedHTML = combinedHTML.replace('</head>', `${styleTag}\n</head>`);
    } else {
      combinedHTML = `<style>\n${css}\n</style>\n${combinedHTML}`;
    }
  }

  if (js) {
    const scriptTag = `<script>\n${js}\n</script>`;
    if (combinedHTML.includes('</body>')) {
      combinedHTML = combinedHTML.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      combinedHTML = `${combinedHTML}\n<script>\n${js}\n</script>`;
    }
  }

  return combinedHTML;
}

function generateSitemap(pages: any[], siteName: string): string {
  const baseUrl = `https://${siteName}.com`; // This would be configurable in a real app
  const urls = pages.map(page => {
    const filename = page.name.toLowerCase().replace(/\s+/g, '-') + '.html';
    const loc = filename === 'home.html' ? baseUrl : `${baseUrl}/${filename}`;
    const lastmod = new Date(page.createdAt).toISOString().split('T')[0];
    
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

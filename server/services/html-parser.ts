import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export interface ParsedHTML {
  title: string;
  html: string;
  css: string;
  js: string;
  description?: string;
  thumbnail?: string;
}

export function parseHTMLFile(filePath: string): ParsedHTML {
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // Extract title
    const title = $('title').text() || $('h1').first().text() || path.basename(filePath, '.html');

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    // Extract and consolidate CSS
    let css = '';
    
    // Inline styles from <style> tags
    $('style').each((_, el) => {
      css += $(el).html() + '\n';
    });

    // Extract external stylesheets content (if they're inline or we can access them)
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        try {
          const cssPath = path.resolve(path.dirname(filePath), href);
          if (fs.existsSync(cssPath)) {
            css += fs.readFileSync(cssPath, 'utf-8') + '\n';
          }
        } catch (err) {
          console.warn(`Could not read CSS file: ${href}`);
        }
      }
    });

    // Extract and consolidate JavaScript
    let js = '';
    
    // Inline scripts
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) {
        // Inline script
        js += $(el).html() + '\n';
      } else if (!src.startsWith('http')) {
        // Local script file
        try {
          const jsPath = path.resolve(path.dirname(filePath), src);
          if (fs.existsSync(jsPath)) {
            js += fs.readFileSync(jsPath, 'utf-8') + '\n';
          }
        } catch (err) {
          console.warn(`Could not read JS file: ${src}`);
        }
      }
    });

    // Clean up the HTML - remove style and script tags since we extracted them
    $('style').remove();
    $('script').each((_, el) => {
      const src = $(el).attr('src');
      if (!src || !src.startsWith('http')) {
        $(el).remove();
      }
    });
    
    // Remove local stylesheet links since we extracted them
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        $(el).remove();
      }
    });

    // Generate a simple SVG thumbnail
    const thumbnail = generateHTMLThumbnail(title, description);

    return {
      title: title.trim(),
      html: $.html(),
      css: css.trim(),
      js: js.trim(),
      description: description.trim(),
      thumbnail
    };
  } catch (error) {
    console.error('Error parsing HTML file:', error);
    throw new Error('Failed to parse HTML file');
  }
}

function generateHTMLThumbnail(title: string, description: string): string {
  const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
  const truncatedDesc = description.length > 30 ? description.substring(0, 30) + '...' : description;
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f8fafc"/>
      <rect x="0" y="0" width="200" height="40" fill="#3b82f6"/>
      <text x="100" y="25" font-family="Arial" font-size="12" fill="white" text-anchor="middle">${truncatedTitle}</text>
      <rect x="20" y="60" width="160" height="70" fill="white" stroke="#e2e8f0" stroke-width="1"/>
      <text x="100" y="80" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle">Uploaded HTML</text>
      <text x="100" y="100" font-family="Arial" font-size="8" fill="#94a3b8" text-anchor="middle">${truncatedDesc}</text>
      <circle cx="30" cy="140" r="3" fill="#10b981"/>
      <text x="40" y="145" font-family="Arial" font-size="8" fill="#059669">Ready to link</text>
    </svg>
  `)}`;
}

export function extractPageMetadata(htmlContent: string): { title: string; description: string } {
  const $ = cheerio.load(htmlContent);
  
  const title = $('title').text() || $('h1').first().text() || 'Uploaded Page';
  const description = $('meta[name="description"]').attr('content') || 
                     $('meta[property="og:description"]').attr('content') || 
                     $('p').first().text().substring(0, 150) || 
                     'Page uploaded from HTML file';

  return { title: title.trim(), description: description.trim() };
}
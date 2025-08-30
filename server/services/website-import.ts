import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { parseHTMLFile } from './html-parser';

export interface WebsiteProject {
  name: string;
  description?: string;
  pages: WebsitePage[];
  assets: WebsiteAsset[];
}

export interface WebsitePage {
  filename: string;
  title: string;
  html: string;
  css: string;
  js: string;
  thumbnail: string;
  relativePath: string;
}

export interface WebsiteAsset {
  filename: string;
  relativePath: string;
  mimeType: string;
  size: number;
  data: Buffer;
}

export function extractWebsiteFromZip(zipFilePath: string, projectName?: string): WebsiteProject {
  try {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    
    const pages: WebsitePage[] = [];
    const assets: WebsiteAsset[] = [];
    
    // Create temporary directory for extraction
    const tempDir = path.join(process.cwd(), 'temp_website_extract');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Extract all files to temp directory
    zip.extractAllTo(tempDir, true);
    
    // Find HTML files
    const htmlFiles = findHtmlFiles(tempDir);
    
    for (const htmlFile of htmlFiles) {
      try {
        const parsedHTML = parseHTMLFile(htmlFile.fullPath);
        const relativePath = htmlFile.relativePath;
        
        pages.push({
          filename: htmlFile.filename,
          title: parsedHTML.title,
          html: parsedHTML.html,
          css: parsedHTML.css,
          js: parsedHTML.js,
          thumbnail: parsedHTML.thumbnail || generateWebsitePageThumbnail(parsedHTML.title, relativePath),
          relativePath: relativePath
        });
      } catch (error) {
        console.warn(`Failed to parse HTML file ${htmlFile.filename}:`, error);
      }
    }
    
    // Find asset files (CSS, JS, images, etc.)
    const assetFiles = findAssetFiles(tempDir);
    
    for (const assetFile of assetFiles) {
      try {
        const data = fs.readFileSync(assetFile.fullPath);
        const stats = fs.statSync(assetFile.fullPath);
        
        assets.push({
          filename: assetFile.filename,
          relativePath: assetFile.relativePath,
          mimeType: getMimeType(assetFile.filename),
          size: stats.size,
          data: data
        });
      } catch (error) {
        console.warn(`Failed to read asset file ${assetFile.filename}:`, error);
      }
    }
    
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    const websiteName = projectName || path.basename(zipFilePath, '.zip');
    
    return {
      name: websiteName,
      description: `Website project with ${pages.length} pages and ${assets.length} assets`,
      pages,
      assets
    };
    
  } catch (error) {
    console.error('Error extracting website from ZIP:', error);
    throw new Error('Failed to extract website from ZIP file');
  }
}

function findHtmlFiles(rootDir: string): Array<{filename: string, relativePath: string, fullPath: string}> {
  const htmlFiles: Array<{filename: string, relativePath: string, fullPath: string}> = [];
  
  function searchDirectory(dir: string, basePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        searchDirectory(fullPath, path.join(basePath, item));
      } else if (item.toLowerCase().endsWith('.html') || item.toLowerCase().endsWith('.htm')) {
        htmlFiles.push({
          filename: item,
          relativePath: path.join(basePath, item),
          fullPath: fullPath
        });
      }
    }
  }
  
  searchDirectory(rootDir);
  return htmlFiles;
}

function findAssetFiles(rootDir: string): Array<{filename: string, relativePath: string, fullPath: string}> {
  const assetFiles: Array<{filename: string, relativePath: string, fullPath: string}> = [];
  const assetExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot'];
  
  function searchDirectory(dir: string, basePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        searchDirectory(fullPath, path.join(basePath, item));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (assetExtensions.includes(ext)) {
          assetFiles.push({
            filename: item,
            relativePath: path.join(basePath, item),
            fullPath: fullPath
          });
        }
      }
    }
  }
  
  searchDirectory(rootDir);
  return assetFiles;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

function generateWebsitePageThumbnail(title: string, relativePath: string): string {
  const truncatedTitle = title.length > 15 ? title.substring(0, 15) + '...' : title;
  const truncatedPath = relativePath.length > 20 ? '...' + relativePath.substring(relativePath.length - 17) : relativePath;
  
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f1f5f9"/>
      <rect x="0" y="0" width="200" height="35" fill="#0f172a"/>
      <text x="100" y="22" font-family="Arial" font-size="11" fill="white" text-anchor="middle">${truncatedTitle}</text>
      <rect x="15" y="50" width="170" height="80" fill="white" stroke="#cbd5e1" stroke-width="1"/>
      <text x="100" y="70" font-family="Arial" font-size="9" fill="#475569" text-anchor="middle">Website Page</text>
      <text x="100" y="90" font-family="Arial" font-size="8" fill="#64748b" text-anchor="middle">${truncatedPath}</text>
      <circle cx="25" cy="140" r="3" fill="#22c55e"/>
      <text x="35" y="145" font-family="Arial" font-size="8" fill="#16a34a">Imported</text>
    </svg>
  `)}`;
}
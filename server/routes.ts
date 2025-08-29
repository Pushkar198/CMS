import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPageSchema, insertLinkSchema, insertMediaSchema, insertGenerationSchema, insertComponentSchema, insertPageComponentSchema, type InsertPage } from "@shared/schema";
import { generatePageWithAI, generatePageThumbnail } from "./services/gemini";
import { exportSite } from "./services/export";
import { generateNavigationScript } from "./services/page-navigation";
import { extractClickableElements } from "./services/element-extractor";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Pages routes
  app.get('/api/pages', async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ error: 'Failed to fetch pages' });
    }
  });

  // Get pages pending approval (must be before /api/pages/:id)
  app.get('/api/pages/pending-approval', async (req, res) => {
    try {
      const pages = await storage.getPendingApprovalPages();
      res.json(pages);
    } catch (error) {
      console.error('Error fetching pending approval pages:', error);
      res.status(500).json({ error: 'Failed to fetch pending approval pages' });
    }
  });

  app.get('/api/pages/:id', async (req, res) => {
    try {
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ error: 'Failed to fetch page' });
    }
  });

  app.post('/api/pages', async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      const page = await storage.createPage(validatedData);
      res.status(201).json(page);
    } catch (error) {
      console.error('Error creating page:', error);
      res.status(400).json({ error: 'Invalid page data' });
    }
  });

  app.put('/api/pages/:id', async (req, res) => {
    try {
      const validatedData = insertPageSchema.partial().parse(req.body);
      const page = await storage.updatePage(req.params.id, validatedData);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error updating page:', error);
      res.status(400).json({ error: 'Invalid page data' });
    }
  });

  // Page state management
  app.patch('/api/pages/:id/state', async (req, res) => {
    try {
      const { state } = req.body;
      if (!['Draft', 'Pending_Approval', 'Approved', 'Live', 'Expired', 'Rejected'].includes(state)) {
        return res.status(400).json({ error: 'Invalid state. Must be Draft, Pending_Approval, Approved, Live, Expired, or Rejected' });
      }

      const currentPage = await storage.getPage(req.params.id);
      if (!currentPage) {
        return res.status(404).json({ error: 'Page not found' });
      }

      const updateData: Partial<InsertPage> = { state };
      
      // Set publishAt when moving to Live state (only from Approved state)
      if (state === 'Live' && currentPage.state === 'Approved') {
        updateData.publishAt = new Date();
      }
      
      // Set expireAt when moving to Expired state
      if (state === 'Expired' && currentPage.state !== 'Expired') {
        updateData.expireAt = new Date();
      }

      const page = await storage.updatePage(req.params.id, updateData);
      res.json(page);
    } catch (error) {
      console.error('Error updating page state:', error);
      res.status(500).json({ error: 'Failed to update page state' });
    }
  });

  // Approval workflow routes
  app.post('/api/pages/:id/submit-for-approval', async (req, res) => {
    try {
      const page = await storage.submitPageForApproval(req.params.id);
      if (!page) {
        return res.status(404).json({ error: 'Page not found or cannot be submitted for approval' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error submitting page for approval:', error);
      res.status(500).json({ error: 'Failed to submit page for approval' });
    }
  });

  app.post('/api/pages/:id/approve', async (req, res) => {
    try {
      const { approverId } = req.body;
      if (!approverId) {
        return res.status(400).json({ error: 'Approver ID is required' });
      }
      
      const page = await storage.approvePage(req.params.id, approverId);
      if (!page) {
        return res.status(404).json({ error: 'Page not found or not pending approval' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error approving page:', error);
      res.status(500).json({ error: 'Failed to approve page' });
    }
  });

  app.post('/api/pages/:id/reject', async (req, res) => {
    try {
      const { approverId, reason } = req.body;
      if (!approverId || !reason) {
        return res.status(400).json({ error: 'Approver ID and rejection reason are required' });
      }
      
      const page = await storage.rejectPage(req.params.id, approverId, reason);
      if (!page) {
        return res.status(404).json({ error: 'Page not found or not pending approval' });
      }
      res.json(page);
    } catch (error) {
      console.error('Error rejecting page:', error);
      res.status(500).json({ error: 'Failed to reject page' });
    }
  });



  app.delete('/api/pages/:id', async (req, res) => {
    try {
      const success = await storage.deletePage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  });

  // Links routes
  app.get('/api/links', async (req, res) => {
    try {
      const links = await storage.getLinks();
      res.json(links);
    } catch (error) {
      console.error('Error fetching links:', error);
      res.status(500).json({ error: 'Failed to fetch links' });
    }
  });

  app.get('/api/links/page/:pageId', async (req, res) => {
    try {
      const links = await storage.getLinksByPage(req.params.pageId);
      res.json(links);
    } catch (error) {
      console.error('Error fetching page links:', error);
      res.status(500).json({ error: 'Failed to fetch page links' });
    }
  });

  app.post('/api/links', async (req, res) => {
    try {
      const validatedData = insertLinkSchema.parse(req.body);
      const link = await storage.createLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating link:', error);
      res.status(400).json({ error: 'Invalid link data' });
    }
  });

  app.delete('/api/links/:id', async (req, res) => {
    try {
      const success = await storage.deleteLink(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Link not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting link:', error);
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  // Media routes
  app.get('/api/media', async (req, res) => {
    try {
      const { search } = req.query;
      const media = search && typeof search === 'string' 
        ? await storage.searchMedia(search)
        : await storage.getMedia();
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  app.post('/api/media/upload', upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedMedia = [];
      for (const file of req.files) {
        const mediaData = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          tags: [],
        };
        const media = await storage.createMedia(mediaData);
        uploadedMedia.push(media);
      }

      res.status(201).json(uploadedMedia);
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  });

  app.delete('/api/media/:id', async (req, res) => {
    try {
      const media = await storage.getMediaItem(req.params.id);
      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Delete file from filesystem
      try {
        fs.unlinkSync(media.path);
      } catch (error) {
        console.warn('Failed to delete file from filesystem:', error);
      }

      const success = await storage.deleteMedia(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  });

  // Serve uploaded media files
  app.get('/api/media/file/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // AI generation routes
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, pageType, pageName, options } = req.body;
      
      if (!prompt || !pageType || !pageName) {
        return res.status(400).json({ error: 'Missing required fields: prompt, pageType, pageName' });
      }

      // Create generation record
      const generationData = {
        prompt,
        pageType,
        status: 'processing' as const,
      };
      
      const generation = await storage.createGeneration(generationData);
      
      // Start AI generation (this would be better as a background job in production)
      const startTime = Date.now();
      
      try {
        const generatedContent = await generatePageWithAI(prompt, pageType, options);
        const thumbnail = await generatePageThumbnail(generatedContent.html, generatedContent.css);
        
        // Create the page
        const pageData = {
          name: pageName,
          state: 'Draft' as const,
          html: generatedContent.html,
          css: generatedContent.css,
          js: generatedContent.js,
          thumbnail,
          pageType,
        };
        
        const page = await storage.createPage(pageData);
        
        // Update generation record
        const duration = Date.now() - startTime;
        await storage.updateGeneration(generation.id, {
          pageId: page.id,
          status: 'completed',
          duration,
        });
        
        res.status(201).json({ page, generation: { ...generation, status: 'completed', duration, pageId: page.id } });
      } catch (error) {
        // Update generation record with failure
        await storage.updateGeneration(generation.id, {
          status: 'failed',
          duration: Date.now() - startTime,
        });
        throw error;
      }
    } catch (error) {
      console.error('Error generating page:', error);
      res.status(500).json({ 
        error: 'Failed to generate page', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/generations', async (req, res) => {
    try {
      const generations = await storage.getGenerations();
      res.json(generations);
    } catch (error) {
      console.error('Error fetching generations:', error);
      res.status(500).json({ error: 'Failed to fetch generations' });
    }
  });

  // Page preview route - serves individual pages
  app.get('/preview/:id', async (req, res) => {
    try {
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).send('<h1>Page not found</h1>');
      }

      // Allow viewing Live and Draft pages in preview
      if (page.state === 'Expired') {
        return res.status(404).send('<h1>Page expired</h1><p>This page is no longer available.</p>');
      }

      // Get page navigation links for this page
      const pageLinks = await storage.getLinksByPage(req.params.id);
      
      // Generate JavaScript to handle page navigation
      const navigationScript = generateNavigationScript(pageLinks);

      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <style>${page.css || ''}</style>
</head>
<body>
  ${page.html}
  <script>
    ${page.js || ''}
    ${navigationScript}
  </script>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(fullHtml);
    } catch (error) {
      console.error('Error serving page preview:', error);
      res.status(500).send('<h1>Error loading page</h1>');
    }
  });

  // Extract clickable elements from a page
  app.get('/api/pages/:id/clickable-elements', async (req, res) => {
    try {
      const page = await storage.getPage(req.params.id);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      const clickableElements = extractClickableElements(page.html);
      res.json(clickableElements);
    } catch (error) {
      console.error('Error extracting clickable elements:', error);
      res.status(500).json({ error: 'Failed to extract clickable elements' });
    }
  });

  // Component routes
  app.get('/api/components', async (req, res) => {
    try {
      const components = await storage.getComponents();
      res.json(components);
    } catch (error) {
      console.error('Error fetching components:', error);
      res.status(500).json({ error: 'Failed to fetch components' });
    }
  });

  app.get('/api/components/page/:pageId', async (req, res) => {
    try {
      const components = await storage.getComponentsByPage(req.params.pageId);
      res.json(components);
    } catch (error) {
      console.error('Error fetching page components:', error);
      res.status(500).json({ error: 'Failed to fetch page components' });
    }
  });

  app.post('/api/components', async (req, res) => {
    try {
      const validatedData = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      console.error('Error creating component:', error);
      res.status(400).json({ error: 'Invalid component data' });
    }
  });

  app.delete('/api/components/:id', async (req, res) => {
    try {
      const success = await storage.deleteComponent(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error('Error deleting component:', error);
      res.status(500).json({ error: 'Failed to delete component' });
    }
  });

  // Page component routes
  app.get('/api/pages/:pageId/components', async (req, res) => {
    try {
      const pageComponents = await storage.getPageComponents(req.params.pageId);
      res.json(pageComponents);
    } catch (error) {
      console.error('Error fetching page components:', error);
      res.status(500).json({ error: 'Failed to fetch page components' });
    }
  });

  app.post('/api/pages/:pageId/components', async (req, res) => {
    try {
      const validatedData = insertPageComponentSchema.parse({
        ...req.body,
        pageId: req.params.pageId,
      });
      const pageComponent = await storage.addComponentToPage(validatedData);
      res.status(201).json(pageComponent);
    } catch (error) {
      console.error('Error adding component to page:', error);
      res.status(400).json({ error: 'Invalid page component data' });
    }
  });

  app.delete('/api/pages/components/:id', async (req, res) => {
    try {
      const success = await storage.removeComponentFromPage(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error('Error removing component from page:', error);
      res.status(500).json({ error: 'Failed to remove component from page' });
    }
  });

  // Export routes
  // Initialize dummy pages for testing
  app.post('/api/init-dummy-pages', async (req, res) => {
    try {
      const fs = await import('fs/promises');
      
      // Read dummy page data
      const homePageData = JSON.parse(await fs.readFile('dummy-home-page.json', 'utf-8'));
      const aboutPageData = JSON.parse(await fs.readFile('dummy-about-page.json', 'utf-8'));
      
      // Create the pages
      const homePage = await storage.createPage(homePageData);
      const aboutPage = await storage.createPage(aboutPageData);
      
      res.json({ 
        message: 'Dummy pages created successfully',
        pages: [homePage, aboutPage]
      });
    } catch (error) {
      console.error('Error creating dummy pages:', error);
      res.status(500).json({ error: 'Failed to create dummy pages' });
    }
  });

  app.post('/api/export', async (req, res) => {
    try {
      const options = req.body;
      const result = await exportSite(options);
      res.json(result);
    } catch (error) {
      console.error('Error exporting site:', error);
      res.status(500).json({ error: 'Failed to export site' });
    }
  });

  // Stats endpoint for dashboard
  app.get('/api/stats', async (req, res) => {
    try {
      const allPages = await storage.getPages();
      const media = await storage.getMedia();
      
      const stats = {
        totalPages: allPages.length,
        livePages: allPages.filter(p => p.state === 'Live').length,
        draftPages: allPages.filter(p => p.state === 'Draft').length,
        expiredPages: allPages.filter(p => p.state === 'Expired').length,
        mediaFiles: media.length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

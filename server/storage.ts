import { type Page, type InsertPage, type Link, type InsertLink, type Media, type InsertMedia, type Generation, type InsertGeneration, type User, type InsertUser, type Component, type InsertComponent, type PageComponent, type InsertPageComponent, type PageVersion, type InsertPageVersion } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  initializeDummyUsers(): Promise<void>;

  // Page methods
  getPages(): Promise<Page[]>;
  getPage(id: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: string, updates: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: string): Promise<boolean>;
  getPagesByState(state: string): Promise<Page[]>;
  
  // Approval workflow methods
  submitPageForApproval(pageId: string): Promise<Page | undefined>;
  approvePage(pageId: string, approverId: string): Promise<Page | undefined>;
  rejectPage(pageId: string, approverId: string, reason: string): Promise<Page | undefined>;
  getPendingApprovalPages(): Promise<Page[]>;

  // Link methods
  getLinks(): Promise<Link[]>;
  getLinksByPage(pageId: string): Promise<Link[]>;
  createLink(link: InsertLink): Promise<Link>;
  deleteLink(id: string): Promise<boolean>;

  // Media methods
  getMedia(): Promise<Media[]>;
  getMediaItem(id: string): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  deleteMedia(id: string): Promise<boolean>;
  searchMedia(query: string): Promise<Media[]>;

  // Generation methods
  getGenerations(): Promise<Generation[]>;
  getGeneration(id: string): Promise<Generation | undefined>;
  createGeneration(generation: InsertGeneration): Promise<Generation>;
  updateGeneration(id: string, updates: Partial<InsertGeneration>): Promise<Generation | undefined>;

  // Component methods
  getComponents(): Promise<Component[]>;
  getComponent(id: string): Promise<Component | undefined>;
  getComponentsByPage(pageId: string): Promise<Component[]>;
  createComponent(component: InsertComponent): Promise<Component>;
  deleteComponent(id: string): Promise<boolean>;

  // Page component methods
  getPageComponents(pageId: string): Promise<PageComponent[]>;
  addComponentToPage(pageComponent: InsertPageComponent): Promise<PageComponent>;
  removeComponentFromPage(id: string): Promise<boolean>;

  // Page version methods
  getPageVersions(pageId: string): Promise<PageVersion[]>;
  getPageVersion(id: string): Promise<PageVersion | undefined>;
  createPageVersion(version: InsertPageVersion): Promise<PageVersion>;
  rollbackToVersion(pageId: string, versionId: string, userId: string): Promise<Page | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private pages: Map<string, Page> = new Map();
  private links: Map<string, Link> = new Map();
  private mediaItems: Map<string, Media> = new Map();
  private generations: Map<string, Generation> = new Map();
  private components: Map<string, Component> = new Map();
  private pageComponents: Map<string, PageComponent> = new Map();
  private pageVersions: Map<string, PageVersion> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'maker',
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async initializeDummyUsers(): Promise<void> {
    // Clear existing users and create dummy ones
    this.users.clear();
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const dummyUsers = [
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin' as const,
      },
      {
        username: 'maker',
        password: hashedPassword,
        role: 'maker' as const,
      },
      {
        username: 'checker',
        password: hashedPassword,
        role: 'checker' as const,
      },
    ];

    for (const userData of dummyUsers) {
      await this.createUser(userData);
    }
  }

  // Page methods
  async getPages(): Promise<Page[]> {
    return Array.from(this.pages.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPage(id: string): Promise<Page | undefined> {
    return this.pages.get(id);
  }

  async createPage(insertPage: InsertPage): Promise<Page> {
    const id = randomUUID();
    const now = new Date();
    const page: Page = {
      ...insertPage,
      id,
      createdAt: now,
      state: insertPage.state || 'Draft',
      publishAt: insertPage.publishAt || null,
      expireAt: insertPage.expireAt || null,
      submittedAt: insertPage.submittedAt || null,
      approvedAt: insertPage.approvedAt || null,
      rejectedAt: insertPage.rejectedAt || null,
      approvedBy: insertPage.approvedBy || null,
      rejectionReason: insertPage.rejectionReason || null,
      thumbnail: insertPage.thumbnail || null,
      pageType: insertPage.pageType || 'custom',
    };
    this.pages.set(id, page);
    return page;
  }

  async updatePage(id: string, updates: Partial<InsertPage>, userId?: string): Promise<Page | undefined> {
    const existing = this.pages.get(id);
    if (!existing) return undefined;
    
    // Create a version before updating the page (only if it's a significant change)
    const hasSignificantChange = updates.html || updates.css || updates.js || updates.name;
    if (hasSignificantChange) {
      await this.createPageVersion({
        pageId: existing.id,
        versionNumber: await this.getNextVersionNumber(existing.id),
        name: existing.name,
        html: existing.html,
        css: existing.css,
        js: existing.js,
        state: existing.state,
        changeDescription: 'Page updated',
        createdBy: userId || null,
      });
    }
    
    const updated: Page = { ...existing, ...updates };
    this.pages.set(id, updated);
    return updated;
  }

  async deletePage(id: string): Promise<boolean> {
    // Also delete associated links
    const linksToDelete = Array.from(this.links.values()).filter(
      link => link.fromPageId === id || link.toPageId === id
    );
    linksToDelete.forEach(link => this.links.delete(link.id));
    
    return this.pages.delete(id);
  }

  async getPagesByState(state: string): Promise<Page[]> {
    return Array.from(this.pages.values()).filter(page => page.state === state);
  }

  // Approval workflow methods
  async submitPageForApproval(pageId: string): Promise<Page | undefined> {
    const page = this.pages.get(pageId);
    if (!page) return undefined;
    
    const updated: Page = {
      ...page,
      state: 'Pending_Approval',
      submittedAt: new Date()
    };
    this.pages.set(pageId, updated);
    return updated;
  }

  async approvePage(pageId: string, approverId: string): Promise<Page | undefined> {
    const page = this.pages.get(pageId);
    if (!page || page.state !== 'Pending_Approval') return undefined;
    
    const updated: Page = {
      ...page,
      state: 'Approved',
      approvedAt: new Date(),
      approvedBy: approverId,
      rejectionReason: null
    };
    this.pages.set(pageId, updated);
    return updated;
  }

  async rejectPage(pageId: string, approverId: string, reason: string): Promise<Page | undefined> {
    const page = this.pages.get(pageId);
    if (!page || page.state !== 'Pending_Approval') return undefined;
    
    const updated: Page = {
      ...page,
      state: 'Rejected',
      rejectedAt: new Date(),
      approvedBy: approverId,
      rejectionReason: reason
    };
    this.pages.set(pageId, updated);
    return updated;
  }

  async getPendingApprovalPages(): Promise<Page[]> {
    return Array.from(this.pages.values())
      .filter(page => page.state === 'Pending_Approval')
      .sort((a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime());
  }

  // Link methods
  async getLinks(): Promise<Link[]> {
    return Array.from(this.links.values());
  }

  async getLinksByPage(pageId: string): Promise<Link[]> {
    return Array.from(this.links.values()).filter(
      link => link.fromPageId === pageId
    );
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    const id = randomUUID();
    const now = new Date();
    const link: Link = {
      ...insertLink,
      id,
      createdAt: now,
      linkType: insertLink.linkType || "button",
      fromElementId: insertLink.fromElementId || null,
      triggerText: insertLink.triggerText || null,
    };
    this.links.set(id, link);
    return link;
  }

  async deleteLink(id: string): Promise<boolean> {
    return this.links.delete(id);
  }

  // Media methods
  async getMedia(): Promise<Media[]> {
    return Array.from(this.mediaItems.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMediaItem(id: string): Promise<Media | undefined> {
    return this.mediaItems.get(id);
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = randomUUID();
    const now = new Date();
    const media: Media = {
      ...insertMedia,
      id,
      createdAt: now,
      tags: (insertMedia.tags as string[]) || [],
    };
    this.mediaItems.set(id, media);
    return media;
  }

  async deleteMedia(id: string): Promise<boolean> {
    return this.mediaItems.delete(id);
  }

  async searchMedia(query: string): Promise<Media[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.mediaItems.values()).filter(media =>
      media.filename.toLowerCase().includes(lowercaseQuery) ||
      media.originalName.toLowerCase().includes(lowercaseQuery) ||
      (media.tags && media.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
    );
  }

  // Generation methods
  async getGenerations(): Promise<Generation[]> {
    return Array.from(this.generations.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getGeneration(id: string): Promise<Generation | undefined> {
    return this.generations.get(id);
  }

  async createGeneration(insertGeneration: InsertGeneration): Promise<Generation> {
    const id = randomUUID();
    const now = new Date();
    const generation: Generation = {
      ...insertGeneration,
      id,
      createdAt: now,
      status: insertGeneration.status || 'processing',
      duration: insertGeneration.duration || null,
      pageId: insertGeneration.pageId || null,
    };
    this.generations.set(id, generation);
    return generation;
  }

  async updateGeneration(id: string, updates: Partial<InsertGeneration>): Promise<Generation | undefined> {
    const existing = this.generations.get(id);
    if (!existing) return undefined;
    
    const updated: Generation = { ...existing, ...updates };
    this.generations.set(id, updated);
    return updated;
  }

  // Component methods
  async getComponents(): Promise<Component[]> {
    return Array.from(this.components.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getComponent(id: string): Promise<Component | undefined> {
    return this.components.get(id);
  }

  async getComponentsByPage(pageId: string): Promise<Component[]> {
    return Array.from(this.components.values()).filter(
      component => component.sourcePageId === pageId
    );
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    const id = randomUUID();
    const now = new Date();
    const component: Component = {
      ...insertComponent,
      id,
      createdAt: now,
      description: insertComponent.description || null,
    };
    this.components.set(id, component);
    return component;
  }

  async deleteComponent(id: string): Promise<boolean> {
    // Also delete associated page components
    const pageComponentsToDelete = Array.from(this.pageComponents.values()).filter(
      pc => pc.componentId === id
    );
    pageComponentsToDelete.forEach(pc => this.pageComponents.delete(pc.id));
    
    return this.components.delete(id);
  }

  // Page component methods
  async getPageComponents(pageId: string): Promise<PageComponent[]> {
    return Array.from(this.pageComponents.values()).filter(
      pc => pc.pageId === pageId
    ).sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  async addComponentToPage(insertPageComponent: InsertPageComponent): Promise<PageComponent> {
    const id = randomUUID();
    const now = new Date();
    const pageComponent: PageComponent = {
      ...insertPageComponent,
      id,
      createdAt: now,
      position: insertPageComponent.position || 0,
      targetSelector: insertPageComponent.targetSelector || null,
    };
    this.pageComponents.set(id, pageComponent);
    return pageComponent;
  }

  async removeComponentFromPage(id: string): Promise<boolean> {
    return this.pageComponents.delete(id);
  }

  // Page version methods
  async getPageVersions(pageId: string): Promise<PageVersion[]> {
    return Array.from(this.pageVersions.values())
      .filter(version => version.pageId === pageId)
      .sort((a, b) => b.versionNumber - a.versionNumber); // Latest first
  }

  async getPageVersion(id: string): Promise<PageVersion | undefined> {
    return this.pageVersions.get(id);
  }

  async createPageVersion(insertVersion: InsertPageVersion): Promise<PageVersion> {
    const id = randomUUID();
    const now = new Date();
    const version: PageVersion = {
      ...insertVersion,
      id,
      createdAt: now,
      changeDescription: insertVersion.changeDescription || null,
      createdBy: insertVersion.createdBy || null,
    };
    this.pageVersions.set(id, version);
    return version;
  }

  async getNextVersionNumber(pageId: string): Promise<number> {
    const versions = await this.getPageVersions(pageId);
    return versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1;
  }

  async rollbackToVersion(pageId: string, versionId: string, userId: string): Promise<Page | undefined> {
    const version = this.pageVersions.get(versionId);
    const currentPage = this.pages.get(pageId);
    
    if (!version || !currentPage || version.pageId !== pageId) {
      return undefined;
    }

    // Create a version of the current state before rollback
    await this.createPageVersion({
      pageId: currentPage.id,
      versionNumber: await this.getNextVersionNumber(currentPage.id),
      name: currentPage.name,
      html: currentPage.html,
      css: currentPage.css,
      js: currentPage.js,
      state: currentPage.state,
      changeDescription: `Rollback to version ${version.versionNumber}`,
      createdBy: userId,
    });

    // Update page with version data
    const rollbackPage: Page = {
      ...currentPage,
      name: version.name,
      html: version.html,
      css: version.css,
      js: version.js,
      state: 'Draft', // Always set to Draft after rollback for review
    };
    
    this.pages.set(pageId, rollbackPage);
    return rollbackPage;
  }
}

export const storage = new MemStorage();

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  state: text("state").notNull().default("Draft"), // Draft, Pending_Approval, Approved, Live, Expired, Rejected
  html: text("html").notNull(),
  css: text("css").notNull(),
  js: text("js").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishAt: timestamp("publish_at"),
  expireAt: timestamp("expire_at"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  thumbnail: text("thumbnail"), // base64 encoded thumbnail or path
  pageType: text("page_type").notNull().default("custom"), // landing, dashboard, form, blog, etc.
});

export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromPageId: varchar("from_page_id").notNull().references(() => pages.id),
  fromElementId: text("from_element_id"), // CSS selector or element ID
  triggerText: text("trigger_text"), // Text content to identify clickable element (e.g., "Settings")
  toPageId: varchar("to_page_id").notNull().references(() => pages.id),
  linkType: text("link_type").notNull().default("button"), // button, link, image, custom
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generations = pgTable("generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").references(() => pages.id),
  prompt: text("prompt").notNull(),
  pageType: text("page_type").notNull(),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  duration: integer("duration"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const components = pgTable("components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sourcePageId: varchar("source_page_id").notNull().references(() => pages.id),
  selector: text("selector").notNull(), // CSS selector to extract component
  html: text("html").notNull(), // extracted HTML
  css: text("css").notNull(), // extracted/scoped CSS
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pageComponents = pgTable("page_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => pages.id),
  componentId: varchar("component_id").notNull().references(() => components.id),
  position: integer("position").default(0), // order within page
  targetSelector: text("target_selector"), // where to insert the component
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Page versions table for version control and rollback functionality
export const pageVersions = pgTable("page_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().references(() => pages.id),
  versionNumber: integer("version_number").notNull(),
  name: text("name").notNull(),
  html: text("html").notNull(),
  css: text("css").notNull(),
  js: text("js").notNull(),
  state: text("state").notNull(),
  changeDescription: text("change_description"), // Optional description of what changed
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
});

export const insertGenerationSchema = createInsertSchema(generations).omit({
  id: true,
  createdAt: true,
});

export const insertComponentSchema = createInsertSchema(components).omit({
  id: true,
  createdAt: true,
});

export const insertPageComponentSchema = createInsertSchema(pageComponents).omit({
  id: true,
  createdAt: true,
});

export const insertPageVersionSchema = createInsertSchema(pageVersions).omit({
  id: true,
  createdAt: true,
});

// Types
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Link = typeof links.$inferSelect;
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Component = typeof components.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type PageComponent = typeof pageComponents.$inferSelect;
export type InsertPageComponent = z.infer<typeof insertPageComponentSchema>;
export type PageVersion = typeof pageVersions.$inferSelect;
export type InsertPageVersion = z.infer<typeof insertPageVersionSchema>;

// Users table (keeping existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("maker"), // maker, checker, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

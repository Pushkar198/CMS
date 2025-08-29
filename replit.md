# Overview

This is an AI-powered website builder that allows users to create, edit, and manage web pages through an intuitive interface. The system combines AI generation capabilities with traditional web development tools, featuring a visual page editor, media library, flow-based site architecture visualization, and export functionality. Built as a full-stack TypeScript application with React frontend and Express backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 13, 2025)

## Migration from Replit Agent to Replit Environment
- ✓ Successfully installed all required dependencies including tsx and TypeScript
- ✓ Fixed server startup and port configuration 
- ✓ Resolved DOM nesting warning in sidebar navigation
- ✓ Added page preview functionality - users can now view published pages at `/preview/{page-id}`
- ✓ Enhanced dashboard and export pages with working preview buttons
- ✓ Modified "Publish Site" button to "View Site" button for better user experience
- ✓ Completed migration from Replit Agent to standard Replit environment (August 13, 2025)
- ✓ Resolved tsx dependency issue and confirmed application startup
- ✓ Verified full functionality of AI website builder interface
- ✓ Updated AI service to use PWC GenAI API instead of Google Gemini
- ✓ Removed @google/genai dependency and implemented PWC API integration
- ✓ Configured PWC_API_KEY for authentication
- ✓ Successfully tested PWC GenAI integration with vertex_ai.gemini-2.0-flash model
- ✓ Implemented markdown code block cleanup for PWC API response format
- ✓ Verified AI page generation working with PWC infrastructure

## Approval Workflow System Implementation
- ✓ Updated database schema with approval workflow states: Draft → Pending_Approval → Approved → Live
- ✓ Added approval tracking fields: submittedAt, approvedAt, rejectedAt, approvedBy, rejectionReason
- ✓ Enhanced user model with role-based system (creator, approver, admin)
- ✓ Implemented comprehensive approval workflow API endpoints
- ✓ Created dedicated Approval Dashboard for reviewers to manage pending pages
- ✓ Enhanced main dashboard with "Submit for Approval" functionality
- ✓ Added approval workflow navigation and proper state management
- ✓ Fixed page linking system: improved auto-extract and precise element targeting

## Page Linking System Improvements
- ✓ Enhanced auto-extract to find all clickable elements comprehensively
- ✓ Fixed page navigation to target specific elements instead of entire page
- ✓ Improved element selection with user-friendly interface

## Component System Implementation
- ✓ Added component extraction and reuse functionality to Page Flow Editor
- ✓ Created database schema for components and page-component relationships
- ✓ Implemented API endpoints for component CRUD operations
- ✓ Enhanced Flow Editor with component management UI
- ✓ Users can now extract components from one page and add them to other pages
- ✓ Component sidebar shows all available reusable components

## Page Navigation Flow System
- ✓ Enhanced database schema to support page-to-page navigation links
- ✓ Added triggerText and linkType fields to links table for defining clickable elements
- ✓ Created comprehensive API endpoints for creating and managing page navigation flows
- ✓ Implemented hooks for page link management (useLinks, useCreateLink, etc.)
- ✓ Enhanced Flow Editor with "Create Page Link" functionality
- ✓ Users can now define clickable elements (buttons, links) that navigate between pages
- ✓ Visual flow editor displays navigation connections with labeled edges
- ✓ Sidebar shows all page navigation links with source → destination visualization

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing with a simple file-based page structure
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with Tailwind CSS for styling, following the shadcn/ui design system
- **Component Structure**: Modular component architecture with separate directories for UI components, pages, hooks, and utilities

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Storage**: In-memory storage implementation with interface-based design allowing for easy database integration
- **API Design**: RESTful API endpoints with comprehensive CRUD operations for pages, media, links, and generations
- **File Handling**: Multer middleware for file uploads with local filesystem storage

## Data Storage Solutions
- **Database**: Configured for PostgreSQL using Drizzle ORM with Neon Database serverless driver
- **Schema**: Well-defined database schema with tables for pages, links, media, and AI generations
- **Migration System**: Drizzle Kit for database migrations and schema management
- **Current Implementation**: Memory-based storage for development/testing with production-ready database configuration

## Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Express sessions configured with PostgreSQL session store (connect-pg-simple)
- **User Model**: Database schema includes user table structure ready for implementation

## External Dependencies

### AI and Content Generation
- **PWC GenAI API**: Integration with PWC's Gemini-2.0-flash model for AI-powered page generation and content creation
- **Features**: Automatic HTML/CSS/JavaScript generation, page thumbnails, and content suggestions
- **API Endpoint**: https://genai-sharedservice-americas.pwc.com/completions

### Database and Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database interactions and query building
- **Local File Storage**: Multer-based file upload system for media assets

### UI and Styling
- **Radix UI**: Comprehensive component library for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Flow**: Interactive node-based editor for visualizing page relationships
- **Lucide React**: Icon library for UI elements

### Development Tools
- **Replit Integration**: Custom plugins for development environment and error handling
- **Vite Plugins**: Hot module replacement, runtime error overlay, and development tooling
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

### Form and Data Handling
- **React Hook Form**: Form management with validation
- **Zod**: Schema validation for data integrity
- **Date-fns**: Date manipulation and formatting utilities
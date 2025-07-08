# Receipt Management Application

## Overview

This is a full-stack receipt management application built with React (frontend) and Express.js (backend). The application allows users to capture, upload, and manage receipts using camera functionality and Google Drive integration. It features Google OAuth authentication and provides a mobile-friendly interface for receipt management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2025-01-07**: Built receipt management app with Google OAuth authentication
- **2025-01-07**: Implemented camera capture with front/back switching
- **2025-01-07**: Added Google Drive integration with organized folder structure (receipts/username/date)
- **2025-01-07**: Created mode toggle between capture and view modes
- **2025-01-07**: Fixed OAuth popup handling for iframe environments like Replit
- **2025-01-07**: Currently troubleshooting Google Cloud Console OAuth consent screen configuration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **File Processing**: Multer for uploads, Sharp for image processing

## Key Components

### Authentication System
- **Google OAuth 2.0**: Complete authentication flow with access/refresh tokens
- **Session Management**: Server-side sessions stored in PostgreSQL
- **User Profile**: Stores Google profile information and Drive API credentials

### Receipt Management
- **Camera Capture**: Native camera API integration with device camera switching
- **File Upload**: Multi-format support with 10MB file size limit
- **Google Drive Integration**: Automatic upload to user's Drive with folder organization
- **Receipt Gallery**: Organized view with search and filtering capabilities

### Database Schema
- **Users Table**: Stores user profiles, OAuth tokens, and preferences
- **Receipts Table**: Tracks uploaded receipts with metadata and Drive references
- **Relationships**: Foreign key constraints linking receipts to users

### UI Components
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Component Library**: Comprehensive set of reusable UI components
- **Dark Mode Support**: Built-in theme switching capabilities
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

1. **Authentication Flow**:
   - User initiates Google OAuth login
   - Server generates auth URL and redirects to Google
   - Google returns authorization code
   - Server exchanges code for access/refresh tokens
   - User session created with stored credentials

2. **Receipt Upload Flow**:
   - User captures photo or selects file
   - Frontend validates file size and type
   - File uploaded to server via multipart form
   - Server processes image and uploads to Google Drive
   - Receipt metadata stored in database
   - Real-time UI updates via query invalidation

3. **Receipt Viewing Flow**:
   - Frontend queries receipts from database
   - Server returns receipt metadata with Drive URLs
   - UI displays organized gallery with thumbnails
   - Users can view, search, and filter receipts

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **googleapis**: Google Drive and OAuth API integration
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React routing

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component styling variants

### Development Dependencies
- **vite**: Development server and build tool
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reloading
- **Database**: PostgreSQL with Drizzle migrations
- **Environment Variables**: Google OAuth credentials and database URL

### Production Build
- **Frontend**: Vite production build with optimization
- **Backend**: esbuild bundling for Node.js deployment
- **Database**: PostgreSQL with automated migrations
- **Static Assets**: Served via Express static middleware

### Configuration Requirements
- **Google OAuth**: Client ID, secret, and redirect URI setup
- **Database**: PostgreSQL connection string
- **Session**: Secure session secret for production
- **CORS**: Configured for production domain

The application is designed to be deployed on platforms like Replit, with environment-specific configurations for development and production modes.
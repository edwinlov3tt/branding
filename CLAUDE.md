# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a React + TypeScript application built with Vite for high-performance development and production builds. The application provides a complete branding and creative intelligence platform.

## Architecture

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules with CSS Variables for theming
- **State Management**: React hooks and Context API
- **HTTP Client**: Axios with interceptors for API calls
- **Type Safety**: TypeScript throughout the application

### Directory Structure

```
src/
├── components/          # React components organized by feature
│   ├── layout/         # App layout components (Sidebar, Header, etc.)
│   ├── brand/          # Brand profile and asset extraction
│   ├── personas/       # Customer persona generation and management
│   ├── competitors/    # Competitor analysis
│   ├── inspiration/    # Template library
│   ├── generations/    # AI-generated content
│   ├── models/         # AI models and avatars
│   ├── settings/       # Application settings
│   └── common/         # Reusable components
├── services/           # API services and configuration
│   ├── api/            # Service modules for API calls
│   └── config/         # API configuration and axios setup
├── types/              # TypeScript type definitions
├── styles/             # Global styles and CSS variables
└── utils/              # Utility functions and constants
```

### Key Components

- **Layout System**: Modular layout with Sidebar navigation and dynamic routing
- **Brand Profile**: Brand asset extraction and management
- **Personas**: AI-powered customer persona generation
- **Competitor Analysis**: Track and analyze competitors
- **Inspiration Library**: Template and creative inspiration management
- **Generated Creatives**: AI-generated content tracking
- **AI Models**: Digital avatars and spokesperson management
- **Settings**: API key configuration and preferences

## Development

### Prerequisites
- Node.js 18+ and npm

### Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Type check with TypeScript

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_CLAUDE_MODEL=claude-3-opus-20240229
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_CORS_PROXY_URL=http://localhost:3001/proxy
VITE_BRAND_EXTRACTOR_API=http://localhost:3001/api/extract
VITE_ENV=development
```

## API Integration

### Service Layer
The application uses a service layer pattern with Axios for API calls:
- **brandService.ts** - Brand asset extraction and management
- **personaService.ts** - Persona generation using Claude API
- **apiConfig.ts** - Axios configuration with interceptors

### CORS Handling
- Development: Vite proxy configuration in `vite.config.ts`
- Production: Configure CORS on your API server or use a proxy service
- Fallback: Mock data for development without API

### Mock Mode
When `USE_MOCK_DATA` is true (no API configured), the app uses realistic mock data for all features.

## Styling

### CSS Variables
The application uses CSS custom properties for consistent theming:
- `--bg-primary`: Primary background (#0f0f0f)
- `--bg-secondary`: Secondary background (#1a1a1a)
- `--bg-tertiary`: Tertiary background (#2a2a2a)
- `--text-primary`: Primary text (#ffffff)
- `--text-secondary`: Secondary text (#a3a3a3)
- `--brand-red`: Brand color (#dc2626)

### Component Styles
Each component has its own CSS file for encapsulated styling following BEM-like conventions.

## Deployment

### Vercel
The project is configured for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Vercel
Set these in your Vercel project settings:
- `VITE_API_BASE_URL`
- `VITE_CLAUDE_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_CORS_PROXY_URL`
- `VITE_BRAND_EXTRACTOR_API`

## Type Safety

All data structures are strongly typed in `src/types/index.ts`:
- `BrandAsset` - Brand logos, colors, fonts
- `Persona` - Customer personas
- `Competitor` - Competitor information
- `Template` - Creative templates
- `Generation` - Generated content
- `AIModel` - AI models and avatars
- `ApiResponse<T>` - Generic API response wrapper

## Best Practices

### Component Guidelines
- Use functional components with TypeScript
- Implement proper error boundaries
- Add loading states for async operations
- Use semantic HTML elements
- Follow accessibility best practices

### API Calls
- Always use the service layer
- Handle errors gracefully with user feedback
- Implement retry logic for failed requests
- Use loading indicators during API calls
- Cache responses when appropriate

### State Management
- Use local state for component-specific data
- Use Context API for global application state
- Implement optimistic updates for better UX
- Persist user preferences in localStorage

## Features

The application provides:
- **Brand Asset Extraction**: Extract logos, colors, and fonts from websites
- **Customer Persona Generation**: AI-powered persona creation based on company profiles
- **Competitor Analysis**: Track and analyze competitor strategies
- **Creative Template Library**: Browse and use design templates
- **AI Content Generation**: Generate images, videos, and banners with AI
- **AI Model Management**: Create and manage digital avatars
- **Settings Management**: Configure API keys and preferences
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Runs the Express server on http://localhost:3000

### Setup
```bash
npm install
cp .env.example .env  # Configure environment variables
```

## Architecture

This is a Creative Wizard MVP - a dark-themed UI wizard for brand analysis and persona generation.

### Core Components
- **server.js**: Express server with two main API endpoints
  - `/api/brand/analyze` - Proxies to external GTM API or returns mock data
  - `/api/personas/generate` - Generates personas via Anthropic Claude API
- **public/index.html**: Single-page wizard UI with 3 steps using Tailwind CSS
- **public/wizard.js**: Frontend state management and API interactions

### Application Flow
1. **Step 1**: Brand analysis - User enters URL, system extracts brand info (name, colors, description)
2. **Step 2**: Persona generation - User provides research context, system generates 5 customer personas
3. **Step 3**: Review and export - Final JSON export for use in creative generation tools

### Environment Configuration
- `GTM_API_BASE`: Base URL for external brand analysis API (optional, falls back to mock)
- `ANTHROPIC_API_KEY`: Required for persona generation (optional, returns empty array if not set)
- `PORT`: Server port (defaults to 3000)

### Key Features
- Graceful fallbacks when APIs are unavailable
- Editable personas with JSON prompt interface
- Dark theme with lime green (#C8FF65) brand accent
- Progress tracking across wizard steps
- JSON export functionality

The application is designed to work offline with mock data when external APIs are unavailable.
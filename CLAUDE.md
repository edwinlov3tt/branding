# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a single-page HTML application (`index.html`) containing a complete branding and creative management platform. The application is self-contained with no external dependencies.

## Architecture

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Styling**: Custom CSS with CSS variables for theming (dark theme)
- **State Management**: Vanilla JavaScript with DOM manipulation
- **Data**: Sample/mock data embedded in JavaScript

### Key Components

- Navigation sidebar with 7 main sections (Brand Profile, Personas, Competitors, Inspiration, Generations, AI Models, Settings)
- Modal system for creating new generations and AI models
- Simulated API interactions with loading states and progress bars
- Responsive grid layouts and card-based UI components

### CSS Variables

The application uses CSS custom properties for consistent theming:
- `--bg-primary`: Primary background (#0f0f0f)
- `--bg-secondary`: Secondary background (#1a1a1a)  
- `--brand-red`: Brand color (#dc2626)
- `--text-primary`: Primary text color (#ffffff)

## Development

Since this is a single HTML file with no build process:
- Open `index.html` directly in a browser to view the application
- No installation, build, or serve commands required
- Changes to HTML, CSS, or JavaScript are immediately reflected on browser refresh

## Functionality

The application simulates a brand intelligence platform with features for:
- Brand asset extraction from websites
- Customer persona generation
- Competitor analysis
- Creative template library
- AI-generated content creation
- AI model/avatar management
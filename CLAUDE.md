# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT**: This project has a formal constitution at `.specify/memory/constitution.md` that defines core principles and governance. When in doubt, consult the constitution - it supersedes all other documentation.

## Project Overview

This is a React + TypeScript application built with Vite for high-performance development and production builds. The application provides a complete branding and creative intelligence platform with AI-powered features.

**Key Capabilities**:
- Brand asset extraction (colors, fonts, logos) from websites
- AI-powered brand profile generation (voice, tone, audience, writing guide)
- Customer persona generation using Claude/OpenAI
- Competitor analysis and ad inspiration library
- Campaign creation and creative generation

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 with TypeScript, Vite, React Router v6
- **Backend**: Node.js 18+ with Express, PostgreSQL
- **Deployment**: Railway (backend), Vercel (frontend)
- **External Services**: Cloudflare Workers (Brand Profiler), Foreplay API (ad search)
- **AI**: Claude API (Anthropic), OpenAI API
- **Styling**: CSS Modules with CSS Variables

### Directory Structure

```
branding/
├── src/                    # Frontend React application
│   ├── components/         # Feature-organized components
│   │   ├── brand/         # Brand profile, assets, extraction
│   │   ├── personas/      # Customer persona management
│   │   ├── competitors/   # Competitor analysis
│   │   ├── inspiration/   # Ad inspiration library
│   │   ├── onboard/       # Brand onboarding flow
│   │   ├── layout/        # App layout (Sidebar, Header)
│   │   └── common/        # Reusable components
│   ├── services/          # API service layer (MANDATORY)
│   │   ├── api/           # Service modules (brandService.ts, etc.)
│   │   └── config/        # Axios configuration
│   ├── types/             # TypeScript interfaces
│   ├── contexts/          # React Context providers
│   ├── styles/            # Global CSS and variables
│   └── utils/             # Generic utilities
├── lib/                   # Backend database and migrations
├── docs/                  # All documentation
│   └── API_TESTING_GUIDE.md  # Comprehensive API reference
├── scripts/               # Shell scripts and utilities
├── server.js              # Express backend API
└── .specify/              # Project constitution and templates
    └── memory/
        └── constitution.md  # Core principles and governance
```

## Core Principles (Summary)

**Full details in `.specify/memory/constitution.md`**

### 1. Type Safety First (NON-NEGOTIABLE)
- TypeScript MUST be used throughout
- The `any` type is **prohibited** without explicit documentation
- All API responses MUST have TypeScript interfaces in `src/types/`
- Service layer methods MUST have explicit return types
- Generic types (`ApiResponse<T>`) for reusable patterns

### 2. API-First Architecture
- **ALL** external API calls MUST go through service layer (`src/services/api/`)
- **NEVER** call axios/fetch directly from components
- Async polling pattern MANDATORY for operations >30 seconds
- Consistent error handling with user-friendly messages

### 3. User Experience Priority
- Every async operation MUST show loading state
- Every error MUST have user-friendly message
- Progress indicators for long-running jobs
- Never show raw error objects to users

### 4. Testing & Documentation
- All API endpoints documented in `docs/API_TESTING_GUIDE.md`
- Include request/response examples and curl commands
- Service methods designed for testability

### 5. Clean Code Organization
- Organize by feature/domain, NOT by technical layer
- Max 400 lines per file
- Co-locate related files
- Clear naming conventions

## Critical Patterns

### Async Polling Pattern (MANDATORY for operations >30s)

**Why**: Railway has a 30-second HTTP timeout. Long operations MUST use async polling to avoid timeouts.

**Implementation** (see `server.js:535-719` and `brandService.ts:26-118`):

**Backend**:
```javascript
// 1. POST endpoint returns jobId immediately
app.post('/api/long-operation', async (req, res) => {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Store job in Map/database
  jobs.set(jobId, { status: 'processing', progress: 0 });

  // Start background work (don't await)
  performWork(jobId).catch(error => {
    jobs.set(jobId, { status: 'failed', error: error.message });
  });

  // Return immediately
  return res.json({
    success: true,
    data: { jobId, statusUrl: `/api/status/${jobId}` }
  });
});

// 2. GET endpoint for polling
app.get('/api/status/:jobId', async (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (job.status === 'completed') {
    return res.json({ success: true, status: 'completed', data: job.result });
  } else if (job.status === 'failed') {
    return res.json({ success: false, status: 'failed', error: job.error });
  } else {
    return res.json({ success: true, status: 'processing', data: { progress: job.progress } });
  }
});

// 3. Background function
async function performWork(jobId) {
  // Do slow work with extended timeout
  const result = await externalAPI.call({ timeout: 120000 });
  jobs.set(jobId, { status: 'completed', result });

  // Auto-cleanup after 10 minutes
  setTimeout(() => jobs.delete(jobId), 10 * 60 * 1000);
}
```

**Frontend**:
```typescript
export const longOperation = async (params: any) => {
  // Start job
  const startResponse = await apiClient.post('/api/long-operation', params, {
    timeout: 10000 // Short timeout for starting
  });

  const { jobId } = startResponse.data.data;

  // Poll for completion
  const maxAttempts = 30; // 30 × 3s = 90s max
  const pollInterval = 3000;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;

    const statusResponse = await apiClient.get(`/api/status/${jobId}`, {
      timeout: 10000
    });

    if (statusResponse.data.status === 'completed') {
      return statusResponse.data.data;
    } else if (statusResponse.data.status === 'failed') {
      throw new Error(statusResponse.data.error);
    }

    // Still processing, continue polling
  }

  throw new Error('Operation timed out');
};
```

**Current Implementations**:
- Brand extraction: `POST /api/extract-brand` → `GET /api/extract-brand-status/:jobId`
- Brand profile generation: `POST /api/generate-brand-profile` → `GET /api/brand-profile-status/:jobId`

### Service Layer Pattern

**Location**: `src/services/api/`

**Rules**:
1. ALL API calls go through service layer
2. NO direct axios/fetch calls from components
3. Consistent error handling
4. User-friendly error messages

**Example Service Method**:
```typescript
// src/services/api/brandService.ts
export const extractBrandData = async (
  url: string,
  includeScreenshot: boolean = true
): Promise<BrandExtractResponse> => {
  try {
    // Start async job
    const startResponse = await apiClient.post('/api/extract-brand', {
      url,
      includeScreenshot
    }, { timeout: 10000 });

    const { jobId } = startResponse.data.data;

    // Poll for completion (see async pattern above)
    // ... polling logic ...

    return enhancedData;
  } catch (error: any) {
    // User-friendly error messages
    if (error.response?.status === 404) {
      throw new Error('Brand extraction endpoint not found.');
    }
    throw new Error(error.response?.data?.error || 'Failed to extract brand data.');
  }
};
```

### Type Safety Requirements

**All types defined in `src/types/index.ts`**

**Key Interfaces**:
```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Brand-related types
export interface BrandAsset { /* ... */ }
export interface BrandProfile { /* ... */ }
export interface BrandExtractResponse { /* ... */ }

// Feature types
export interface Persona { /* ... */ }
export interface Competitor { /* ... */ }
export interface Campaign { /* ... */ }
```

**Rules**:
- NO `any` type without documentation
- Service methods have explicit return types
- Component props use interfaces
- API responses typed with `ApiResponse<T>`

### Error Handling Standards

**Backend**:
```javascript
app.post('/api/endpoint', async (req, res) => {
  try {
    // ... operation
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error context:', error);
    res.status(500).json({
      success: false,
      error: 'User-friendly message here'
    });
  }
});
```

**Frontend**:
```typescript
const handleAction = async () => {
  setLoading(true);
  setError('');

  try {
    const result = await serviceMethod(params);
    // Success handling
  } catch (error: any) {
    console.error('Full error:', error); // Dev mode
    setError(error.message || 'Operation failed'); // User sees this
  } finally {
    setLoading(false);
  }
};
```

## Development Workflow

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL (via Railway)

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev          # Frontend (http://localhost:5173)
npm run server       # Backend (http://localhost:3001)
# OR
npm run dev:all      # Both simultaneously
```

### Available Scripts
- `npm run dev` - Vite dev server (frontend only)
- `npm run server` - Express API server (backend only)
- `npm run dev:all` - Run both frontend and backend
- `npm run build` - Production build
- `npm run lint` - TypeScript type checking (must pass before commit)
- `npm run db:migrate` - Run database migrations

### Before Committing
1. Run `npm run lint` - TypeScript must compile
2. Test functionality in browser - No console errors
3. Check for user-friendly error messages
4. Update `docs/API_TESTING_GUIDE.md` if API changes

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CLAUDE_API_KEY=sk-ant-...
VITE_CLAUDE_MODEL=claude-3-opus-20240229
VITE_OPENAI_API_KEY=sk-...
VITE_ENV=development
```

### Backend (Railway)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
FOREPLAY_API_KEY=...
PORT=3001
NODE_ENV=production
```

## API Reference

### Comprehensive Documentation
See `docs/API_TESTING_GUIDE.md` for:
- All 58 API endpoints
- Request/response examples
- curl commands for testing
- Error scenarios
- Jest test templates

### Key Endpoint Categories
1. **Brand Extraction** - Extract assets from websites (async)
2. **Brand Profile** - AI-generated profile, voice, tone (async)
3. **Brands CRUD** - Create, read, update, delete brands
4. **Products & Services** - Manage product offerings
5. **Competitors** - Track competitor data
6. **Target Audiences** - Persona management
7. **Campaigns** - Campaign creation and management
8. **Ad Inspirations** - Foreplay API integration
9. **AI Generation** - Content generation endpoints

## Key Features

### Brand Asset Extraction
**Route**: `/brands` (onboarding flow)
**Pattern**: Async polling (30-90 seconds)
**Output**: Colors, fonts, logos, screenshot

### Brand Profile Generation
**Route**: Step 3 of onboarding
**Pattern**: Async polling (60-100 seconds)
**Output**: Voice/tone, audience, writing guide, brand info
**API**: Cloudflare Worker at `brand-profiler.edwin-6f1.workers.dev`

### Editable Brand Profile Tabs
**Route**: `/brands/:slug/:shortId` → Brand Profile tab
**Features**:
- Edit/Save/Cancel functionality
- All profile fields editable
- Updates via `PUT /api/brand-profile`
- Automatic data reload after save

### Competitor Analysis
**Route**: `/competitors`
**Features**: CRUD operations, AI-powered analysis

### Ad Inspiration Library
**Route**: `/inspiration`
**Features**: Curated templates, Foreplay API search, save to brand

## Styling

### CSS Variables (Dark Theme)
```css
--bg-primary: #0f0f0f;
--bg-secondary: #1a1a1a;
--bg-tertiary: #2a2a2a;
--text-primary: #ffffff;
--text-secondary: #a3a3a3;
--text-tertiary: #666666;
--brand-red: #dc2626;
--border-color: #2a2a2a;
```

### Component Styling
- Each component has its own CSS file
- BEM-like naming conventions
- Co-located with component file
- Example: `BrandProfile.tsx` + `BrandProfile.css`

## Deployment

### Production Stack
- **Frontend**: Vercel (automatic deployments from main branch)
- **Backend**: Railway (automatic deployments from main branch)
- **Database**: PostgreSQL on Railway
- **Workers**: Cloudflare (separate deployments)

### Railway Constraints
- **HTTP Timeout**: 30 seconds (MUST use async polling for longer operations)
- **Memory**: 512MB-1GB
- **Auto-scale**: Enabled
- **Health Check**: `GET /health`

### Deployment Checklist
1. Ensure `npm run lint` passes
2. Test locally with production-like data
3. Verify environment variables in Railway/Vercel
4. Check Railway logs for errors after deployment
5. Test critical flows in production

## Common Tasks

### Adding a New Feature
1. **Review Constitution**: Check `.specify/memory/constitution.md` for relevant principles
2. **Plan**: Identify similar patterns in codebase
3. **Types**: Define TypeScript interfaces in `src/types/`
4. **Service Layer**: Create/update methods in `src/services/api/`
5. **Backend API**: Add endpoints in `server.js` (use async pattern if >30s)
6. **Frontend**: Build component with loading/error states
7. **Styling**: Add CSS following existing patterns
8. **Documentation**: Update `docs/API_TESTING_GUIDE.md` if backend changed
9. **Testing**: Manual testing + document test cases

### Adding a New API Endpoint
1. **Backend** (`server.js`):
   - Add endpoint with proper error handling
   - Use async pattern if operation >30 seconds
   - Return consistent format: `{ success: boolean, data?: any, error?: string }`

2. **Service Layer** (`src/services/api/`):
   - Create typed method
   - Handle errors with user-friendly messages
   - Implement polling if async endpoint

3. **Types** (`src/types/`):
   - Define request/response interfaces

4. **Documentation** (`docs/API_TESTING_GUIDE.md`):
   - Add endpoint with examples and curl command

### Troubleshooting Timeouts
**Symptom**: "timeout of 30000ms exceeded" errors

**Solution**: Implement async polling pattern (see Critical Patterns above)

**Quick Fix**:
1. Change endpoint to return `jobId` immediately
2. Add status polling endpoint
3. Update frontend to poll every 3-5 seconds
4. See `server.js:535-719` for reference implementation

## Resources

### Internal Documentation
- **Constitution**: `.specify/memory/constitution.md` - Core principles and governance
- **API Testing Guide**: `docs/API_TESTING_GUIDE.md` - Complete API reference
- **Deployment Guide**: `docs/RAILWAY_SETUP.md` - Railway configuration
- **Background Processing**: `docs/BACKGROUND_PROCESSING_GUIDE.md` - Async patterns

### External APIs
- **Brand Profiler**: https://brand-profiler.edwin-6f1.workers.dev
- **Brand Extractor**: https://gtm.edwinlovett.com/api/extract-brand
- **Foreplay API**: https://public.api.foreplay.co

### Key Files Reference
- `server.js` - Express backend with all API endpoints
- `src/services/api/brandService.ts` - Brand-related API calls
- `src/types/index.ts` - All TypeScript interfaces
- `src/components/brand/BrandProfile.tsx` - Main brand profile UI
- `src/components/onboard/BrandOnboarding.tsx` - Onboarding flow

## Anti-Patterns to Avoid

**❌ Don't**:
- Call axios/fetch directly from components
- Use `any` type without documentation
- Make synchronous calls to slow APIs
- Show raw error objects to users
- Skip loading states on async operations
- Hard-code API keys
- Ignore TypeScript errors

**✅ Do**:
- Use service layer for all API calls
- Define TypeScript interfaces for all data
- Use async polling for operations >30s
- Show user-friendly error messages
- Always provide loading/error states
- Use environment variables for config
- Fix TypeScript errors before committing

## Getting Help

### When Things Go Wrong
1. **Check Console**: Look for error messages with context
2. **Check Railway Logs**: `railway logs` or Railway dashboard
3. **Review Constitution**: `.specify/memory/constitution.md`
4. **Check API Guide**: `docs/API_TESTING_GUIDE.md`
5. **Test Endpoint**: Use curl commands from API guide

### Common Issues
- **Timeout Errors**: Use async polling pattern
- **CORS Errors**: Ensure backend proxy is configured
- **Type Errors**: Check `src/types/` for interface definitions
- **401 Errors**: Verify API keys in environment variables
- **500 Errors**: Check Railway logs for backend errors

---

**Last Updated**: 2025-11-10
**Constitution Version**: 1.0.0

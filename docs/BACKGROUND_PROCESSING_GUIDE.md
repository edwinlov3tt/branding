# Background Processing & API Integration Guide

## Problem: Timeout Issues with Long-Running AI Operations

AI operations can take 30-120 seconds, causing HTTP timeouts. This guide shows how to:
1. Use gtm.edwinlovett.com API endpoints effectively
2. Implement background job processing
3. Avoid timeout issues with async operations
4. Provide real-time progress updates to users

---

## Architecture Overview

```
Frontend → POST /api/jobs/start → Creates Job (returns job_id)
   ↓
   Poll GET /api/jobs/:id/status (every 2-3 seconds)
   ↓
Backend → Processes job in background
   ↓
   Updates job progress in database
   ↓
Frontend → Gets completion notification → Fetches results
```

---

## Using gtm.edwinlovett.com API Endpoints

### 1. Brand Intelligence: Use `/api/analyze-brand-enhanced` with SSE

**Why**: Supports Server-Sent Events for real-time progress updates

**Best Practice**:
```javascript
// Backend handles SSE streaming
const response = await axios.post(
  'https://gtm.edwinlovett.com/api/analyze-brand-enhanced',
  {
    url: brandUrl,
    maxPages: 15,
    includeScreenshots: false,
    includeScraping: true,
    includeImages: false
  },
  {
    timeout: 180000,  // 3 minutes
    responseType: 'stream'  // Handle SSE
  }
)

// Process SSE events
response.data.on('data', (chunk) => {
  const lines = chunk.toString().split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6))
      // Update job progress in database
      updateJobProgress(jobId, data.progress, data.step)
    }
  }
})
```

### 2. Basic Brand Extraction: Use `/api/extract-brand`

**When to use**: Quick brand identity extraction (logos, colors, fonts)

```javascript
const response = await axios.post(
  'https://gtm.edwinlovett.com/api/extract-brand',
  {
    url: brandUrl,
    includeScreenshot: true
  },
  { timeout: 60000 }  // 1 minute usually enough
)
```

### 3. Page Discovery: Use `/api/discover-brand-pages`

**When to use**: Find relevant brand pages before deep analysis

```javascript
const response = await axios.post(
  'https://gtm.edwinlovett.com/api/discover-brand-pages',
  {
    url: brandUrl,
    maxPages: 20,
    includeScraping: true
  },
  { timeout: 120000 }  // 2 minutes
)
```

---

## Database-Backed Job Queue

### Job Lifecycle

```
1. pending   → Job created, waiting to start
2. processing → Job is running
3. completed  → Job finished successfully
4. failed     → Job encountered error
```

### Job Table Structure

```sql
ai_jobs {
  id: UUID
  brand_id: UUID
  job_type: enum('brand_intelligence', 'competitor_analysis', ...)
  status: enum('pending', 'processing', 'completed', 'failed')
  input_data: JSONB  // {url, competitor_name, etc}
  result_data: JSONB  // Final results
  result_id: UUID  // ID of created resource
  progress: INTEGER  // 0-100
  current_step: TEXT
  error_message: TEXT
  created_at: TIMESTAMP
  completed_at: TIMESTAMP
}
```

---

## New Background Processing Endpoints

### 1. Start a Background Job

**POST `/api/jobs/start`**

**Request**:
```json
{
  "brand_id": "uuid",
  "job_type": "brand_intelligence",  // or competitor_analysis, etc
  "input_data": {
    "url": "https://example.com"
    // OR for competitor: "competitor_name": "Nike"
  }
}
```

**Response** (Immediate):
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "pending",
  "estimated_duration": 90  // seconds
}
```

### 2. Check Job Status (Polling)

**GET `/api/jobs/:jobId/status`**

**Response**:
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "processing",
    "progress": 45,  // 0-100
    "current_step": "Analyzing competitor ads with AI",
    "total_steps": 3,
    "started_at": "2025-10-08T...",
    "estimated_completion": "2025-10-08T..."  // calculated
  }
}
```

### 3. Get Job Results

**GET `/api/jobs/:jobId/result`**

**Response** (when completed):
```json
{
  "success": true,
  "status": "completed",
  "result_id": "uuid",  // e.g., competitor_analysis.id
  "result_data": {
    // Full analysis data
  },
  "completed_at": "2025-10-08T..."
}
```

### 4. List Jobs for Brand

**GET `/api/jobs?brand_id=uuid&status=processing`**

**Response**:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "uuid",
      "job_type": "competitor_analysis",
      "status": "processing",
      "progress": 30,
      "created_at": "..."
    }
  ]
}
```

---

## Frontend Integration Pattern

### React Hook for Background Jobs

```typescript
// hooks/useBackgroundJob.ts
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_step: string
  result_data?: any
  error_message?: string
}

export const useBackgroundJob = (jobId: string | null) => {
  const [job, setJob] = useState<Job | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!jobId) return

    const pollJob = async () => {
      try {
        const response = await axios.get(`/api/jobs/${jobId}/status`)
        const jobData = response.data.job

        setJob(jobData)

        // Stop polling if completed or failed
        if (jobData.status === 'completed' || jobData.status === 'failed') {
          setIsPolling(false)

          // Fetch full results if completed
          if (jobData.status === 'completed') {
            const resultResponse = await axios.get(`/api/jobs/${jobId}/result`)
            setJob(prev => ({ ...prev!, result_data: resultResponse.data.result_data }))
          }
        }
      } catch (error) {
        console.error('Job polling error:', error)
      }
    }

    // Poll every 2 seconds
    setIsPolling(true)
    const interval = setInterval(pollJob, 2000)

    // Initial poll
    pollJob()

    return () => clearInterval(interval)
  }, [jobId])

  return { job, isPolling }
}
```

### Component Usage Example

```typescript
// CompetitorAnalysisButton.tsx
import { useState } from 'react'
import { useBackgroundJob } from '@/hooks/useBackgroundJob'
import axios from 'axios'

const CompetitorAnalysisButton = ({ brandId, competitorName }) => {
  const [jobId, setJobId] = useState<string | null>(null)
  const { job, isPolling } = useBackgroundJob(jobId)

  const handleAnalyze = async () => {
    try {
      // Start background job
      const response = await axios.post('/api/jobs/start', {
        brand_id: brandId,
        job_type: 'competitor_analysis',
        input_data: {
          competitor_name: competitorName
        }
      })

      setJobId(response.data.job_id)
    } catch (error) {
      console.error('Failed to start analysis:', error)
    }
  }

  if (!job) {
    return (
      <button onClick={handleAnalyze} disabled={isPolling}>
        Analyze Competitor
      </button>
    )
  }

  if (job.status === 'processing') {
    return (
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${job.progress}%` }} />
        <p>{job.current_step}</p>
        <p>{job.progress}% complete</p>
      </div>
    )
  }

  if (job.status === 'completed') {
    return (
      <div>
        <p>✅ Analysis Complete!</p>
        <button onClick={() => navigateToResults(job.result_data.id)}>
          View Analysis
        </button>
      </div>
    )
  }

  if (job.status === 'failed') {
    return (
      <div>
        <p>❌ Analysis Failed</p>
        <p>{job.error_message}</p>
        <button onClick={handleAnalyze}>Retry</button>
      </div>
    )
  }

  return null
}
```

---

## Backend Job Processor Implementation

### Job Processing Function

```javascript
// Background job processor (runs async, doesn't block HTTP response)
async function processJob(jobId) {
  try {
    // Update status to processing
    await pool.query(
      `UPDATE ai_jobs
       SET status = 'processing',
           started_at = CURRENT_TIMESTAMP,
           progress = 0,
           current_step = 'Starting analysis'
       WHERE id = $1`,
      [jobId]
    )

    // Get job details
    const jobResult = await pool.query(
      'SELECT * FROM ai_jobs WHERE id = $1',
      [jobId]
    )
    const job = jobResult.rows[0]

    // Process based on job type
    switch (job.job_type) {
      case 'brand_intelligence':
        await processBrandIntelligence(job)
        break
      case 'competitor_analysis':
        await processCompetitorAnalysis(job)
        break
      case 'target_audiences':
        await processTargetAudiences(job)
        break
      // ... other job types
    }
  } catch (error) {
    // Mark job as failed
    await pool.query(
      `UPDATE ai_jobs
       SET status = 'failed',
           error_message = $1,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [error.message, jobId]
    )
  }
}

// Example: Process competitor analysis
async function processCompetitorAnalysis(job) {
  const { brand_id } = job
  const { competitor_name, facebook_page } = job.input_data

  // Step 1: Fetch ads from Foreplay (0-40%)
  await updateJobProgress(job.id, 10, 'Searching for competitor ads', 1, 3)

  const adsResponse = await axios.get(
    'https://public.api.foreplay.co/api/discovery/ads',
    {
      headers: { 'Authorization': process.env.FOREPLAY_API_KEY },
      params: {
        query: competitor_name,
        limit: 20,
        order: 'most_relevant',
        geo_location: 'US',
        languages: 'English'
      },
      timeout: 30000
    }
  )

  const ads = adsResponse.data?.data || []
  await updateJobProgress(job.id, 40, `Found ${ads.length} ads`, 1, 3)

  // Step 2: Analyze with AI (40-80%)
  await updateJobProgress(job.id, 50, 'Analyzing ads with AI', 2, 3)

  const claudeResponse = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Analyze these competitor ads: ${JSON.stringify(ads)}...`
      }]
    },
    {
      headers: {
        'x-api-key': process.env.VITE_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  )

  const analysis = JSON.parse(claudeResponse.data.content[0].text)
  await updateJobProgress(job.id, 80, 'Saving analysis', 3, 3)

  // Step 3: Save to database (80-100%)
  const result = await pool.query(
    `INSERT INTO competitor_analyses (...) VALUES (...) RETURNING *`,
    [/* analysis data */]
  )

  // Mark job as completed
  await pool.query(
    `UPDATE ai_jobs
     SET status = 'completed',
         progress = 100,
         current_step = 'Complete',
         result_id = $1,
         result_data = $2,
         completed_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [result.rows[0].id, JSON.stringify(result.rows[0]), job.id]
  )
}

// Helper function to update job progress
async function updateJobProgress(jobId, progress, currentStep, stepNum, totalSteps) {
  await pool.query(
    `UPDATE ai_jobs
     SET progress = $1,
         current_step = $2,
         total_steps = $3
     WHERE id = $4`,
    [progress, `Step ${stepNum}/${totalSteps}: ${currentStep}`, totalSteps, jobId]
  )
}
```

---

## Recommended Approach: Hybrid SSE + Polling

### For Brand Intelligence (Use SSE from gtm.edwinlovett.com)

```javascript
app.post('/api/jobs/start', async (req, res) => {
  const { brand_id, job_type, input_data } = req.body

  // Create job record
  const job = await pool.query(
    'INSERT INTO ai_jobs (brand_id, job_type, input_data, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [brand_id, job_type, JSON.stringify(input_data), 'pending']
  )

  const jobId = job.rows[0].id

  // Return job ID immediately
  res.json({
    success: true,
    job_id: jobId,
    status: 'pending',
    estimated_duration: getEstimatedDuration(job_type)
  })

  // Process in background (don't await)
  processJob(jobId).catch(err => console.error('Job processing error:', err))
})

// Process with SSE streaming from external API
async function processBrandIntelligence(job) {
  const { url } = job.input_data

  await updateJobProgress(job.id, 5, 'Analyzing website', 1, 2)

  // Use SSE-enabled endpoint
  const response = await axios.post(
    'https://gtm.edwinlovett.com/api/analyze-brand-enhanced',
    {
      url,
      maxPages: 15,
      includeScreenshots: false,
      includeScraping: true,
      includeImages: false
    },
    {
      timeout: 180000,
      responseType: 'stream'
    }
  )

  let brandAnalysis = null

  // Handle SSE events
  response.data.on('data', async (chunk) => {
    const lines = chunk.toString().split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6))

          // Update progress based on SSE events
          if (data.event === 'progress') {
            await updateJobProgress(
              job.id,
              Math.min(data.progress || 50, 90),
              data.message || 'Analyzing pages',
              1,
              2
            )
          } else if (data.event === 'complete') {
            brandAnalysis = data
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  })

  // Wait for stream to complete
  await new Promise((resolve, reject) => {
    response.data.on('end', resolve)
    response.data.on('error', reject)
  })

  if (!brandAnalysis) {
    throw new Error('No brand analysis data received')
  }

  // Process with Claude AI
  await updateJobProgress(job.id, 92, 'Extracting brand intelligence with AI', 2, 2)

  // ... rest of Claude processing ...

  // Save results and mark complete
  // ... (see previous implementation)
}
```

---

## Complete API Endpoint Reference

### From gtm.edwinlovett.com (External)

| Endpoint | Use Case | Timeout | SSE Support |
|----------|----------|---------|-------------|
| `/api/analyze-brand-enhanced` | **BEST for brand intelligence** | 180s | ✅ Yes |
| `/api/extract-brand` | Quick brand identity only | 60s | ❌ No |
| `/api/discover-brand-pages` | Find brand pages first | 120s | ❌ No |

### Your Backend (New Endpoints Needed)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/jobs/start` | POST | Start background job |
| `/api/jobs/:id/status` | GET | Poll job status |
| `/api/jobs/:id/result` | GET | Get completed results |
| `/api/jobs/:id/cancel` | POST | Cancel running job |
| `/api/jobs` | GET | List jobs for brand |

---

## Environment Variables Needed

```env
# Claude AI
VITE_CLAUDE_API_KEY=sk-ant-...

# Foreplay
FOREPLAY_API_KEY=your_key_here

# No additional config needed for gtm.edwinlovett.com
# (it's a public API)
```

---

## Summary: Avoiding Timeouts

### The Problem
- AI operations take 30-120 seconds
- HTTP requests timeout after 30-60 seconds
- Users see errors, lose progress

### The Solution
1. **Immediate Response**: Return job ID instantly (< 100ms)
2. **Background Processing**: Process job async in Node.js
3. **Progress Updates**: Store progress in database
4. **Frontend Polling**: Check status every 2-3 seconds
5. **SSE Streaming**: Use gtm.edwinlovett.com's SSE support for real-time updates
6. **Result Retrieval**: Fetch final results when complete

### Benefits
- ✅ No timeouts
- ✅ Real-time progress updates
- ✅ User can navigate away and come back
- ✅ Handles failures gracefully
- ✅ Can retry failed jobs
- ✅ Scales to multiple concurrent jobs

---

## Next Steps

1. **Run migration**: `add_ai_jobs.sql`
2. **Implement job endpoints**: POST /api/jobs/start, GET /api/jobs/:id/status
3. **Update AI endpoints**: Convert to background jobs
4. **Create frontend hook**: `useBackgroundJob`
5. **Update UI components**: Show progress bars instead of spinners

The database migration is ready. Want me to implement the complete backend job processing system now?
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_CLAUDE_API_KEY: string
  readonly VITE_CLAUDE_MODEL: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_CORS_PROXY_URL: string
  readonly VITE_BRAND_EXTRACTOR_API: string
  readonly VITE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
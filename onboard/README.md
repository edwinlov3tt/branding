# Creative Wizard (MVP)

Dark UI wizard:
1) Paste client URL → calls your brand analyze API (proxy-ready).
2) Generate 5 personas via your TSX-style prompt (server proxy to Anthropic).
3) Review + Export JSON for your creative generator.

## Run
```bash
npm install
cp .env.example .env
# set GTM_API_BASE=https://gtm.edwinlovett.com (or your actual route)
# set ANTHROPIC_API_KEY=... (optional)
npm run dev
# open http://localhost:3000
```

## Notes
- If no keys are set, Step 1 returns a harmless mock and Step 2 lets you hand-edit personas.
- Style matches your dark + lime look from the screenshots.

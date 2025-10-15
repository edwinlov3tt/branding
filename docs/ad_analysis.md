Awesome—this reads like it came from a lightweight ad-intelligence “summarizer” that ingests raw ad objects (headline, primary text, CTA, placements, media, locale, etc.), computes a few heuristics, and then asks an LLM to draft a crisp report.

Here’s a plug-and-play way to do the same: a clear **LLM prompt template**, an **input schema**, **heuristics** you can compute before the LLM call, and **example I/O** so you can wire it up quickly.

# 1) LLM Prompt (drop-in template)

Use this as your system+user content. It’s designed to be deterministic, short, and to the point.

```
SYSTEM:
You are a marketing analyst. Given a set of ads (JSON), produce a concise, executive-ready report with the sections:
- Core Messaging Strategy
- Campaign Structure
- Creative Approach
- Distribution Strategy
- Key Strategic Insights

RULES:
- Be specific and cite evidence via simple counts/percentages derived from the input.
- Prefer short bullets. No fluff. No speculation beyond the data.
- If a claim cannot be supported from the input, omit it.
- Keep each section ≤6 bullets.
- Use consistent marketing terminology (CTA, placements, creative type, etc.).
- Note language localization, geo hints, or templating placeholders if present (e.g., {{product.name}}).
- Mention A/B variation patterns when you see near-duplicate messages with small changes.
- Keep output in English.

USER:
You will receive two JSON blocks:

1) "signals": precomputed metrics about the batch (counts, percentages, detected patterns).
2) "ads": the raw ad objects (subset of fields).

Write the report using "signals" as your primary facts; use "ads" only to enrich/confirm.

JSON START
{{signals_json}}
---
{{ads_json}}
JSON END
```

# 2) Input schema (what you pass to the model)

Compute and pass a small **signals** object plus a compact **ads** array. Keep ads minimal; push heavy lifting into signals so the LLM just writes.

```json
{
  "signals": {
    "n_ads": 27,
    "objective_distribution": { "LEAD_GENERATION": 27 },
    "cta_counts": { "APPLY_NOW": 22, "LEARN_MORE": 5 },
    "creative_mix_pct": { "video": 59.3, "image": 40.7 },
    "headline_patterns": [
      { "pattern": "free website", "count": 18 },
      { "pattern": "#1 rated|five-star|5\\s*stars|trustpilot|clutch|g2", "count": 12 }
    ],
    "urgency_patterns": [
      { "pattern": "apply in \\d+ seconds|today|now", "count": 9 }
    ],
    "emojis_present_pct": 44.4,
    "languages": { "en": 23, "de": 3, "en-GB": 1 },
    "geo_hints": ["UK", "Germany"],
    "placements": {
      "facebook": 27, "instagram": 24, "audience_network": 18, "messenger": 14, "threads": 6
    },
    "template_tokens_detected": { "{{product.name}}": 7 },
    "trust_signals": { "ratings_mentions": 12, "platforms": ["TrustPilot","Clutch","G2"] },
    "cold_vs_warm_estimate": { "cold": 26, "warm": 1 },
    "near_duplicate_groups": 5,
    "notable_phrases": [
      "We'll build your website for FREE",
      "Get your free website today",
      "Apply in 90 seconds"
    ]
  },
  "ads": [
    {
      "id": "ad_001",
      "locale": "en-US",
      "objective": "LEAD_GENERATION",
      "cta": "APPLY_NOW",
      "headline": "We'll Build Your Website for FREE — Seriously",
      "primary_text": "5★ on TrustPilot & G2. Apply in 90 seconds.",
      "media_type": "video",
      "placements": ["facebook_feed","instagram_feed","messenger_inbox"]
    },
    {
      "id": "ad_009",
      "locale": "de-DE",
      "headline": "Wir bauen Ihre Website. Kostenlos.",
      "cta": "LEARN_MORE",
      "media_type": "image",
      "placements": ["instagram_stories","threads"]
    }
    // ...trimmed
  ]
}
```

# 3) Heuristics to compute before the LLM (simple rules you can code)

* **Creative mix**: `pct_video = count(media_type=="video")/n_ads * 100`; remainder is images (or “other” if you have carousels).
* **CTA counts**: count by exact string (normalize: uppercase, underscores).
* **Objective distribution**: count by objective.
* **Cold vs Warm audience (rough guess)**:
  Warm if primary_text or headline contains any of: `returning|back again|already a customer|because you viewed|in your cart|visited|welcome back|upgrade`. Everything else = cold.
* **Urgency**: regex like `apply in \d+ seconds|today|now|limited|ends|deadline`.
* **Trust signals**: regex for `#1 rated|5[\s\-]*stars|★★★★★|trustpilot|clutch|g2`.
* **Emoji usage**: detect any Unicode emoji or common stars `⭐`, rockets `🚀`, checks `✅`.
* **Language detection**: use locale if available; otherwise run a short language ID on headline+text.
* **Geo hints**: currency symbols (`£`, `€`), country names, city names, or locale tags.
* **Template tokens**: look for `{{...}}`.
* **Near-duplicate groups**: normalize (lowercase, strip emojis/punctuation, collapse whitespace), then cluster by minhash or cosine similarity >0.9.
* **Notable phrases**: top TF-IDF n-grams or just the top repeated headline n-grams.

# 4) Example: signals+ads → model output (what you’ll get back)

The prompt above will produce something very close to the example you shared, e.g.:

* Core Messaging Strategy → bullets about “Free Website Offer”, “Credibility Emphasis”, “Urgency & Simplicity”
* Campaign Structure → target audience (cold-heavy), objective (Lead gen), CTAs, creative mix
* Creative Approach → bold headlines, trust signals, emoji usage, consistency
* Distribution Strategy → multi-platform (FB/IG/AN/Messenger/Threads), internationalization, template tokens
* Key Insights → value-first, psych triggers, A/B testing, simplicity

# 5) Minimal code shape (pseudo)

```python
# 1) Scrape or ingest ads into raw_ads[]
# 2) Compute signals
signals = compute_signals(raw_ads)  # functions for each heuristic above
# 3) Truncate/normalize ads to {id, locale, objective, cta, headline, primary_text, media_type, placements}
ads_min = project_fields(raw_ads)
# 4) Call LLM with the prompt template + json dumps(signals) + json dumps(ads_min)
report = call_llm(system_prompt, user_prompt(signals, ads_min))
# 5) Store report + signals for auditing
```

# 6) Field mapping when scraping (FB/IG/TikTok/Google)

Try to normalize to these fields:

```
id, platform, placements[], locale, country_hints[],
objective, cta, media_type (video|image|carousel|other),
headline, primary_text, description, display_url,
engagement (likes/comments/shares if available),
created_at, last_seen_at
```

# 7) Detection regex pack (copy/paste)

* **Free offer**: `r"\bfree\b|\b£?0\b|\b€?0\b|\bfor\s+free\b"`
* **Ratings**: `r"#1\s*rated|5\s*stars|★★★★★|trustpilot|clutch|g2"`
* **Urgency**: `r"apply in \d+\s*seconds|today|now|limited|ends|deadline"`
* **Template tokens**: `r"\{\{[^}]+\}\}"`
* **Emoji**: quick test `any(c in text for c in "⭐🚀✅🔥✨💥")` or use an emoji lib.
* **Warm audience**: `r"returning|back( again)?|already a customer|because you viewed|in your cart|visited|welcome back|upgrade"`

# 8) Example “signals” calculator (concise Python sketch)

```python
from collections import Counter, defaultdict
import re

def pct(n, d): return round(100*n/d, 1) if d else 0

def compute_signals(ads):
    n = len(ads)
    obj = Counter(a.get("objective","").upper() for a in ads)
    cta = Counter(a.get("cta","").upper() for a in ads)
    media = Counter(a.get("media_type","").lower() for a in ads)
    video_pct = pct(media.get("video",0), n)
    image_pct = pct(media.get("image",0), n)

    def count_regex(rx):
        r = re.compile(rx, re.I)
        return sum(1 for a in ads if r.search(a.get("headline","")+" "+a.get("primary_text","")))

    signals = {
        "n_ads": n,
        "objective_distribution": dict(obj),
        "cta_counts": dict(cta),
        "creative_mix_pct": {"video": video_pct, "image": image_pct},
        "headline_patterns": [
            {"pattern":"free website", "count": count_regex(r"\bfree\b.*\bwebsite\b|\bwebsite\b.*\bfree\b")}
        ],
        "trust_signals": {
            "ratings_mentions": count_regex(r"#1\s*rated|5\s*stars|★★★★★|trustpilot|clutch|g2"),
            "platforms": ["TrustPilot","Clutch","G2"]
        },
        "urgency_patterns":[{"pattern":"apply in N seconds/today/now", "count": count_regex(r"apply in \d+\s*seconds|today|now")}],
        "emojis_present_pct": pct(sum(1 for a in ads if any(e in (a.get("headline","")+a.get("primary_text","")) for e in "⭐🚀✅")), n),
        "template_tokens_detected": {"{{product.name}}": count_regex(r"\{\{\s*product\.name\s*\}\}")},
        # Add language, geo, placements, duplicates as needed...
    }
    return signals
```

# 9) A/B grouping (simple, fast)

* Normalize text: lowercase → remove emojis → remove punctuation → collapse whitespace.
* Compute a hash (e.g., MinHash or SimHash).
* Cluster ads with Hamming distance under a threshold; `len(cluster) > 1` → A/B group.

# 10) Output style target (what “good” looks like)

Keep it to ~5 tight bullets per section, avoid marketing fluff, and ground claims in the `signals`. That’s exactly how the sample you posted reads.

---

If you want, tell me the platform(s) you plan to scrape (Meta Ad Library, TikTok Creative Center, Google Ads Transparency, etc.), and I’ll tailor parsers and normalization glue for each.

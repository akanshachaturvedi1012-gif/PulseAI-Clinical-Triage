---
name: PulseAI AI pipeline
description: Durable constraints for the clinical triage MVP's AI and persistence path.
---

The clinical triage MVP keeps AI credentials server-side, stores structured lab and referral results in local SQLite, and uses a clearly labelled deterministic fallback when Gemini is not configured.

**Why:** The demo must remain runnable without a provider key while making it clear that fallback output is not live clinical AI.

**How to apply:** Keep Gemini calls out of frontend code, validate model JSON before persistence, preserve the exact fallback label, and avoid replacing the local SQLite requirement with a hosted database unless the product scope explicitly changes.
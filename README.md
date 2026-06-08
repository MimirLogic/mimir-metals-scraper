# Mimir Metals — Mill Cert Scraper
**Built by Brian James Gaynor | Mimir Logic LLC**

AI-powered mill certificate reconciliation for cold heading manufacturers.
Upload mill certs, lab reports, and purchase orders — Gemini AI extracts
and reconciles the data, flags out-of-spec values, and generates
print-ready quality certificates.

## Live Demo
https://mimir-metals-scraper.netlify.app

## Tech Stack
- React 18 + Vite
- Google Gemini 2.0 Flash API (PDF multimodal extraction)
- CSS Modules
- Netlify (hosting)

## Local Development

```bash
npm install
cp .env.example .env
# Add your Gemini API key to .env
npm run dev
```

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect repo to Netlify
3. Add environment variable: `VITE_GEMINI_KEY = your-key`
4. Deploy — Netlify handles the rest

Build command: `npm run build`
Publish directory: `dist`

## Features
- **Intake Mode** — Drag & drop PDFs, AI extracts heat number, chemistry, mechanicals
- **Generate Mode** — Select heat, add customer info, generate print-ready cert
- **Heat Master** — Table view of all saved heats with pass/fail indicators
- **Spec Validation** — Auto-flags values outside SAE 1010 specification limits
- **Print Ready** — Browser print generates clean PDF output

## About
Part of the Mimir Logic manufacturing AI suite.
- SetPoint — Shop floor setup assistant
- Mill Cert Scraper — This app
- Vision Assist — Manufacturing defect detection

mimirlogic.netlify.app

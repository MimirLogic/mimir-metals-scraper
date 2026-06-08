// Mimir Metals — Gemini extraction service
// Uses Gemini 2.0 Flash (free tier) for PDF data extraction

const GEMINI_MODEL = 'gemini-2.0-flash'

function getApiKey(runtimeKey) {
  return runtimeKey || import.meta.env.VITE_GEMINI_KEY || window.__GEMINI_KEY__ || ''
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function detectDocType(file) {
  const name = file.name.toLowerCase()
  if (name.includes('lab') || name.includes('test-report')) return 'lab_report'
  if (name.includes('cert') || name.includes('mill')) return 'mill_cert'
  if (name.includes('po') || name.includes('purchase') || name.includes('order')) return 'purchase_order'
  return 'unknown'
}

export async function extractDocuments(files, runtimeKey) {
  const apiKey = getApiKey(runtimeKey)
  if (!apiKey) throw new Error('No Gemini API key. Add VITE_GEMINI_KEY to your .env file.')

  const parts = []

  for (const file of files) {
    const b64 = await fileToBase64(file)
    parts.push({
      inline_data: {
        mime_type: 'application/pdf',
        data: b64
      }
    })
  }

  parts.push({
    text: `You are an industrial materials expert specializing in steel mill certifications.
Analyze ALL uploaded documents and extract every piece of data you find.
Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

{
  "heatNumber": "string or null",
  "grade": "string or null",
  "millName": "string or null",
  "country": "string or null",
  "diameter": "string or null",
  "lotNumber": "string or null",
  "coilNumber": "string or null",
  "shipDate": "string or null",
  "chemistry": {
    "c": "string or null",
    "mn": "string or null",
    "si": "string or null",
    "p": "string or null",
    "s": "string or null",
    "cr": "string or null",
    "ni": "string or null",
    "mo": "string or null",
    "cu": "string or null",
    "v": "string or null",
    "nb": "string or null",
    "al": "string or null"
  },
  "mechanicals": {
    "tensile": "string or null",
    "yield": "string or null",
    "elongation": "string or null",
    "reduction": "string or null",
    "hardness": "string or null"
  },
  "orderInfo": {
    "customer": "string or null",
    "poNumber": "string or null",
    "invoiceNumber": "string or null",
    "partNumber": "string or null",
    "quantity": "string or null"
  },
  "docTypes": ["list of document types found: mill_cert, lab_report, purchase_order"],
  "warnings": ["list any missing required fields or data quality issues"]
}

Extract exact values as printed. Use null for missing fields. Check every page.`
  })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: 'application/json'
        }
      })
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `Gemini API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export function buildCertNumber() {
  const d = new Date()
  const date = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 900) + 100
  return `MM-${date}-${rand}`
}

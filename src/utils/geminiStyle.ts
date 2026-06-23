/**
 * Gemini API integration for AI Stylr natural-language style descriptions.
 * Uses the Gemini 2.0 Flash model — lightweight, fast, free-tier friendly.
 * Called browser-side using the VITE_GEMINI_API_KEY env variable.
 */

export interface GeminiStyleAdvice {
  headline: string;       // One bold line, e.g. "Warm Caramel Waves for a Heart Face"
  description: string;    // 2-3 sentence personalised paragraph
  colorReason: string;    // Why the suggested color suits this MST level
  styleReason: string;    // Why the suggested style suits this face shape
  careAdvice: string;     // One practical hair-care or salon tip
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateStyleAdvice(params: {
  faceShape: string;
  skinTone: string;
  monkLabel?: string;
  monkUndertone?: string;
  gender: 'male' | 'female';
  suggestedColor: string;
  suggestedStyle: string;
}): Promise<GeminiStyleAdvice | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const { faceShape, skinTone, monkLabel, monkUndertone, gender, suggestedColor, suggestedStyle } = params;

  const prompt = `You are a professional hair stylist and colour expert at a luxury salon in Bengaluru, India.

A ${gender} client has just had their face analyzed with the following results:
- Face Shape: ${faceShape}
- Skin Tone: ${skinTone}${monkLabel ? ` (${monkLabel} on the Monk Scale)` : ''}${monkUndertone ? ` with ${monkUndertone} undertones` : ''}
- AI Recommended Hair Colour: ${suggestedColor}
- AI Recommended Hair Style: ${suggestedStyle}

Write a SHORT, professional, warm, and encouraging style consultation for this client. Return ONLY a JSON object with exactly these keys (no markdown, no extra text):
{
  "headline": "A catchy one-line title for their recommended look (max 8 words)",
  "description": "2-3 sentences personalised to their face shape and skin tone explaining why this look will suit them beautifully. Mention ${monkLabel || skinTone} and ${faceShape} specifically.",
  "colorReason": "One sentence explaining why ${suggestedColor} complements their ${monkLabel || skinTone} skin tone and ${monkUndertone || ''} undertones.",
  "styleReason": "One sentence explaining why ${suggestedStyle} flatters a ${faceShape} face shape.",
  "careAdvice": "One practical tip for maintaining this look at home or at a salon."
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse JSON — Gemini returns valid JSON when responseMimeType is set
    const parsed = JSON.parse(text) as GeminiStyleAdvice;
    return parsed;
  } catch {
    return null;
  }
}

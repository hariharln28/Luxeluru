import type { StyleRecommendation } from '../types';

// ─── Face Shapes ────────────────────────────────────────────
const FACE_SHAPES = ['Oval', 'Round', 'Square', 'Heart', 'Oblong', 'Diamond'] as const;
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'] as const;

// ─── Gender-Specific Hair Color Maps ────────────────────────
const COLOR_MAP_FEMALE: Record<string, string[]> = {
  Fair: ['Honey Blonde', 'Rose Gold', 'Soft Auburn', 'Light Caramel'],
  Light: ['Ash Blonde', 'Warm Brown', 'Copper Highlights', 'Chestnut'],
  Medium: ['Caramel Balayage', 'Rich Chocolate', 'Burgundy', 'Golden Brown'],
  Olive: ['Espresso', 'Dark Auburn', 'Copper Red', 'Warm Black'],
  Tan: ['Deep Brown', 'Mahogany', 'Caramel Ombré', 'Warm Burgundy'],
  Deep: ['Jet Black', 'Deep Burgundy', 'Copper Brown', 'Platinum Highlights'],
};

const COLOR_MAP_MALE: Record<string, string[]> = {
  Fair: ['Dark Blonde', 'Light Brown', 'Sandy Brown', 'Frosted Tips'],
  Light: ['Medium Brown', 'Dark Ash Blonde', 'Chestnut', 'Copper Brown'],
  Medium: ['Dark Brown', 'Espresso', 'Warm Brown', 'Subtle Highlights'],
  Olive: ['Dark Brown', 'Black Brown', 'Warm Espresso', 'Dark Copper'],
  Tan: ['Deep Brown', 'Black', 'Mahogany', 'Dark Chocolate'],
  Deep: ['Jet Black', 'Blue Black', 'Dark Brown', 'Subtle Burgundy'],
};

// ─── Gender-Specific Hair Style Maps ────────────────────────
const STYLE_MAP_FEMALE: Record<string, string[]> = {
  Oval: ['Long Layers', 'Soft Waves', 'Side-Swept Bangs', 'Sleek Bob'],
  Round: ['Long Straight', 'Angular Bob', 'Side Part Layers', 'Lob with Volume'],
  Square: ['Soft Curls', 'Long Layers', 'Side-Swept Waves', 'Textured Lob'],
  Heart: ['Chin-Length Bob', 'Side Part Waves', 'Soft Bangs', 'Layered Pixie'],
  Oblong: ['Shoulder-Length Waves', 'Blunt Cut', 'Curtain Bangs', 'Volume Curls'],
  Diamond: ['Side-Swept Layers', 'Textured Bob', 'Soft Waves', 'Wispy Bangs'],
};

const STYLE_MAP_MALE: Record<string, string[]> = {
  Oval: ['Classic Taper', 'Textured Quiff', 'Side Part', 'Medium Length Waves'],
  Round: ['High Fade', 'Pompadour', 'Faux Hawk', 'Angular Fringe'],
  Square: ['Crew Cut', 'Buzz Cut', 'Short Textured', 'Slick Back'],
  Heart: ['Side Part', 'Textured Crop', 'Medium Fringe', 'Layered Top'],
  Oblong: ['Short Sides Long Top', 'Curtain Bangs', 'Textured Crop', 'Caesar Cut'],
  Diamond: ['Undercut', 'Side Swept', 'Textured Pompadour', 'Messy Fringe'],
};

// ─── All available colors/styles for custom override ────────
export const HAIR_COLOR_OPTIONS_FEMALE = [
  'Honey Blonde', 'Rose Gold', 'Soft Auburn', 'Light Caramel',
  'Ash Blonde', 'Warm Brown', 'Copper Highlights', 'Chestnut',
  'Caramel Balayage', 'Rich Chocolate', 'Burgundy', 'Golden Brown',
  'Espresso', 'Dark Auburn', 'Copper Red', 'Jet Black',
  'Deep Burgundy', 'Platinum', 'Mahogany', 'Strawberry Blonde',
];

export const HAIR_COLOR_OPTIONS_MALE = [
  'Dark Blonde', 'Light Brown', 'Sandy Brown', 'Frosted Tips',
  'Medium Brown', 'Dark Ash Blonde', 'Chestnut', 'Copper Brown',
  'Dark Brown', 'Espresso', 'Warm Brown', 'Subtle Highlights',
  'Black Brown', 'Jet Black', 'Blue Black', 'Mahogany',
  'Dark Chocolate', 'Platinum Buzz', 'Silver Fox', 'Natural Black',
];

export const HAIR_STYLE_OPTIONS_FEMALE = [
  'Long Layers', 'Soft Waves', 'Side-Swept Bangs', 'Sleek Bob',
  'Angular Bob', 'Lob with Volume', 'Soft Curls', 'Textured Lob',
  'Chin-Length Bob', 'Layered Pixie', 'Shoulder-Length Waves', 'Blunt Cut',
  'Curtain Bangs', 'Volume Curls', 'Fishtail Braid', 'Beach Waves',
  'Straight & Sleek', 'Messy Bun', 'Half Up Half Down', 'Shag Cut',
];

export const HAIR_STYLE_OPTIONS_MALE = [
  'Classic Taper', 'Textured Quiff', 'Side Part', 'Medium Length Waves',
  'High Fade', 'Pompadour', 'Faux Hawk', 'Angular Fringe',
  'Crew Cut', 'Buzz Cut', 'Short Textured', 'Slick Back',
  'Textured Crop', 'Medium Fringe', 'Layered Top', 'Caesar Cut',
  'Undercut', 'Man Bun', 'Messy Fringe', 'French Crop',
];

// ─── Hair color hex values for camera overlay ───────────────
export const HAIR_COLOR_HEX: Record<string, string> = {
  'Honey Blonde': '#d4a853',
  'Rose Gold': '#b76e79',
  'Soft Auburn': '#8b4513',
  'Light Caramel': '#c68e3f',
  'Ash Blonde': '#b5a68c',
  'Warm Brown': '#6b4226',
  'Copper Highlights': '#b87333',
  'Chestnut': '#633a1b',
  'Caramel Balayage': '#a67b3d',
  'Rich Chocolate': '#3c1f0e',
  'Burgundy': '#6c1d45',
  'Golden Brown': '#8b6914',
  'Espresso': '#2d1810',
  'Dark Auburn': '#5c2418',
  'Copper Red': '#b7410e',
  'Jet Black': '#0a0a0a',
  'Deep Burgundy': '#4a0e2e',
  'Platinum': '#e0d8c8',
  'Mahogany': '#4e1a0b',
  'Strawberry Blonde': '#c98a5e',
  'Dark Blonde': '#9e8c6c',
  'Light Brown': '#8b7355',
  'Sandy Brown': '#a08060',
  'Frosted Tips': '#c8b89a',
  'Medium Brown': '#5c4033',
  'Dark Ash Blonde': '#8a7d6b',
  'Copper Brown': '#7a4419',
  'Dark Brown': '#3b2414',
  'Warm Espresso': '#2c1a0e',
  'Subtle Highlights': '#8b7355',
  'Black Brown': '#1a0f0a',
  'Dark Copper': '#7a3b1e',
  'Deep Brown': '#2e1a0e',
  'Black': '#0d0d0d',
  'Dark Chocolate': '#2c1608',
  'Blue Black': '#0d0d1a',
  'Subtle Burgundy': '#5a1a35',
  'Platinum Buzz': '#d8d0c0',
  'Silver Fox': '#a8a8a8',
  'Natural Black': '#111111',
};

// ─── Color Classification ───────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function classifySkinTone(r: number, g: number, b: number): string {
  const [, , l] = rgbToHsl(r, g, b);
  if (l > 75) return 'Fair';
  if (l > 65) return 'Light';
  if (l > 55) return 'Medium';
  if (l > 42) return 'Olive';
  if (l > 30) return 'Tan';
  return 'Deep';
}

// ─── Face Shape from Landmarks ──────────────────────────────
function classifyFaceShapeFromLandmarks(landmarks: { x: number; y: number }[]): string {
  // MediaPipe Face Mesh key landmark indices:
  // Jaw: 234 (left), 454 (right)
  // Chin: 152
  // Forehead top: 10
  // Cheekbone: 93 (left), 323 (right)
  // Temples: 21 (left), 251 (right)

  const jawLeft = landmarks[234] || landmarks[0];
  const jawRight = landmarks[454] || landmarks[landmarks.length - 1];
  const chin = landmarks[152] || landmarks[Math.floor(landmarks.length / 2)];
  const forehead = landmarks[10] || landmarks[0];
  const cheekLeft = landmarks[93] || jawLeft;
  const cheekRight = landmarks[323] || jawRight;
  const templeLeft = landmarks[21] || jawLeft;
  const templeRight = landmarks[251] || jawRight;

  const jawWidth = Math.abs(jawRight.x - jawLeft.x);
  const faceHeight = Math.abs(chin.y - forehead.y);
  const cheekWidth = Math.abs(cheekRight.x - cheekLeft.x);
  const foreheadWidth = Math.abs(templeRight.x - templeLeft.x);

  const ratio = jawWidth / faceHeight;
  const cheekToJaw = cheekWidth / jawWidth;
  const foreheadToJaw = foreheadWidth / jawWidth;

  if (ratio > 0.9 && cheekToJaw > 0.95) return 'Round';
  if (ratio > 0.85 && foreheadToJaw > 0.95 && cheekToJaw > 0.95) return 'Square';
  if (foreheadToJaw > 1.1) return 'Heart';
  if (cheekToJaw > 1.1 && foreheadToJaw < 0.95) return 'Diamond';
  if (ratio < 0.65) return 'Oblong';
  return 'Oval';
}

// ─── Simple fallback face shape classification ──────────────
function classifyFaceShapeSimple(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 0.92) return 'Round';
  if (ratio > 0.82) return 'Square';
  if (ratio > 0.72) return 'Oval';
  if (ratio > 0.62) return 'Heart';
  return 'Oblong';
}

// ─── Main Analysis Function ─────────────────────────────────
export async function analyzeFaceFromVideo(
  video: HTMLVideoElement,
  gender: 'male' | 'female',
  faceLandmarks?: { x: number; y: number }[]
): Promise<StyleRecommendation> {
  const canvas = document.createElement('canvas');
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, w, h);

  let faceShape: string;

  if (faceLandmarks && faceLandmarks.length > 400) {
    // Use MediaPipe landmarks for precise face shape detection
    faceShape = classifyFaceShapeFromLandmarks(faceLandmarks);

    // Sample skin tone from cheek area using landmarks
    const cheekLeft = faceLandmarks[93] || faceLandmarks[50];
    const cheekRight = faceLandmarks[323] || faceLandmarks[280];
    const sampleX = Math.floor(((cheekLeft.x + cheekRight.x) / 2) * w);
    const sampleY = Math.floor(((cheekLeft.y + cheekRight.y) / 2) * h);
    const sampleSize = Math.floor(w * 0.08);

    const cheekData = ctx.getImageData(
      Math.max(0, sampleX - sampleSize / 2),
      Math.max(0, sampleY - sampleSize / 2),
      sampleSize,
      sampleSize
    ).data;

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < cheekData.length; i += 16) {
      rSum += cheekData[i];
      gSum += cheekData[i + 1];
      bSum += cheekData[i + 2];
      count++;
    }

    const skinTone = classifySkinTone(rSum / count, gSum / count, bSum / count);
    const colorMap = gender === 'male' ? COLOR_MAP_MALE : COLOR_MAP_FEMALE;
    const styleMap = gender === 'male' ? STYLE_MAP_MALE : STYLE_MAP_FEMALE;

    return {
      faceShape,
      skinTone,
      gender,
      suggestedHairColors: colorMap[skinTone] ?? colorMap.Medium,
      suggestedStyles: styleMap[faceShape] ?? styleMap.Oval,
    };
  }

  // Fallback: no landmarks available — use center-of-frame estimation
  const centerX = Math.floor(w * 0.35);
  const centerY = Math.floor(h * 0.25);
  const faceW = Math.floor(w * 0.3);
  const faceH = Math.floor(h * 0.45);

  const faceData = ctx.getImageData(centerX, centerY, faceW, faceH).data;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < faceData.length; i += 16) {
    rSum += faceData[i];
    gSum += faceData[i + 1];
    bSum += faceData[i + 2];
    count++;
  }

  const skinTone = classifySkinTone(rSum / count, gSum / count, bSum / count);
  faceShape = classifyFaceShapeSimple(faceW, faceH);

  const colorMap = gender === 'male' ? COLOR_MAP_MALE : COLOR_MAP_FEMALE;
  const styleMap = gender === 'male' ? STYLE_MAP_MALE : STYLE_MAP_FEMALE;

  return {
    faceShape,
    skinTone,
    gender,
    suggestedHairColors: colorMap[skinTone] ?? colorMap.Medium,
    suggestedStyles: styleMap[faceShape] ?? styleMap.Oval,
  };
}

export { FACE_SHAPES, SKIN_TONES };

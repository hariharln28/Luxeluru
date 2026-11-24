import type { StyleRecommendation } from '../types';

// ─── Face Shapes ────────────────────────────────────────────
const FACE_SHAPES = ['Oval', 'Round', 'Square', 'Heart', 'Oblong', 'Diamond'] as const;

// ─── Monk Skin Tone Scale (10-point, Google Open Standard) ──
export const MONK_SCALE = [
  { level: 1,  hex: '#f6ede4', label: 'MST-1',  name: 'Very Light',   undertone: 'Cool Pink'    },
  { level: 2,  hex: '#f3e7db', label: 'MST-2',  name: 'Light',        undertone: 'Neutral'       },
  { level: 3,  hex: '#f7ead0', label: 'MST-3',  name: 'Light Medium', undertone: 'Warm Golden'   },
  { level: 4,  hex: '#eadaba', label: 'MST-4',  name: 'Medium',       undertone: 'Warm Olive'    },
  { level: 5,  hex: '#d7bd96', label: 'MST-5',  name: 'Medium',       undertone: 'Warm Caramel'  },
  { level: 6,  hex: '#a07850', label: 'MST-6',  name: 'Medium Deep',  undertone: 'Warm Brown'    },
  { level: 7,  hex: '#825c43', label: 'MST-7',  name: 'Deep',         undertone: 'Warm Chestnut' },
  { level: 8,  hex: '#604134', label: 'MST-8',  name: 'Deep',         undertone: 'Cool Deep'     },
  { level: 9,  hex: '#3a312a', label: 'MST-9',  name: 'Very Deep',    undertone: 'Cool Ebony'    },
  { level: 10, hex: '#292420', label: 'MST-10', name: 'Richest',      undertone: 'Cool Darkest'  },
];

// ─── MST-keyed Color Maps ────────────────────────────────────
const MST_COLOR_MAP_FEMALE: Record<number, string[]> = {
  1:  ['Honey Blonde', 'Rose Gold', 'Platinum', 'Soft Auburn'],
  2:  ['Ash Blonde', 'Strawberry Blonde', 'Light Caramel', 'Copper Highlights'],
  3:  ['Warm Brown', 'Chestnut', 'Golden Brown', 'Caramel Balayage'],
  4:  ['Caramel Balayage', 'Rich Chocolate', 'Copper Red', 'Golden Brown'],
  5:  ['Burgundy', 'Mahogany', 'Rich Chocolate', 'Caramel Balayage'],
  6:  ['Dark Auburn', 'Espresso', 'Copper Red', 'Warm Black'],
  7:  ['Deep Burgundy', 'Mahogany', 'Dark Auburn', 'Jet Black'],
  8:  ['Jet Black', 'Deep Burgundy', 'Copper Brown', 'Espresso'],
  9:  ['Jet Black', 'Blue Black', 'Deep Burgundy', 'Mahogany'],
  10: ['Jet Black', 'Blue Black', 'Deep Burgundy', 'Platinum Highlights'],
};

const MST_COLOR_MAP_MALE: Record<number, string[]> = {
  1:  ['Dark Blonde', 'Sandy Brown', 'Frosted Tips', 'Light Brown'],
  2:  ['Medium Brown', 'Dark Ash Blonde', 'Chestnut', 'Sandy Brown'],
  3:  ['Chestnut', 'Copper Brown', 'Dark Ash Blonde', 'Warm Brown'],
  4:  ['Dark Brown', 'Warm Brown', 'Copper Brown', 'Subtle Highlights'],
  5:  ['Dark Brown', 'Espresso', 'Mahogany', 'Dark Chocolate'],
  6:  ['Espresso', 'Black Brown', 'Warm Espresso', 'Dark Copper'],
  7:  ['Jet Black', 'Dark Brown', 'Mahogany', 'Dark Chocolate'],
  8:  ['Jet Black', 'Blue Black', 'Dark Brown', 'Subtle Burgundy'],
  9:  ['Jet Black', 'Blue Black', 'Natural Black', 'Dark Brown'],
  10: ['Jet Black', 'Blue Black', 'Natural Black', 'Silver Fox'],
};

// ─── Gender-Specific Hair Style Maps ────────────────────────
const STYLE_MAP_FEMALE: Record<string, string[]> = {
  Oval:    ['Long Layers', 'Soft Waves', 'Side-Swept Bangs', 'Sleek Bob'],
  Round:   ['Long Straight', 'Angular Bob', 'Side Part Layers', 'Lob with Volume'],
  Square:  ['Soft Curls', 'Long Layers', 'Side-Swept Waves', 'Textured Lob'],
  Heart:   ['Chin-Length Bob', 'Side Part Waves', 'Soft Bangs', 'Layered Pixie'],
  Oblong:  ['Shoulder-Length Waves', 'Blunt Cut', 'Curtain Bangs', 'Volume Curls'],
  Diamond: ['Side-Swept Layers', 'Textured Bob', 'Soft Waves', 'Wispy Bangs'],
};

const STYLE_MAP_MALE: Record<string, string[]> = {
  Oval:    ['Classic Taper', 'Textured Quiff', 'Side Part', 'Medium Length Waves'],
  Round:   ['High Fade', 'Pompadour', 'Faux Hawk', 'Angular Fringe'],
  Square:  ['Crew Cut', 'Buzz Cut', 'Short Textured', 'Slick Back'],
  Heart:   ['Side Part', 'Textured Crop', 'Medium Fringe', 'Layered Top'],
  Oblong:  ['Short Sides Long Top', 'Curtain Bangs', 'Textured Crop', 'Caesar Cut'],
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
  'Warm Black': '#1a1208',
  'Platinum Highlights': '#ddd8cc',
};

// ─── CIE-LAB Color Math for Monk Scale matching ─────────────

/** Convert sRGB (0-255) to CIE-LAB [L, a, b] */
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Step 1: linearise sRGB
  const linearize = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  // Step 2: RGB → XYZ (D65 illuminant)
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
  const y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750) / 1.00000;
  const z = (lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041) / 1.08883;

  // Step 3: XYZ → LAB
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Hex string → {r,g,b} */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace('#', '');
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

/** Find the nearest Monk Scale level for an averaged skin RGB sample */
export function findMonkLevel(r: number, g: number, b: number): typeof MONK_SCALE[0] {
  const [L, a, bLab] = rgbToLab(r, g, b);
  let minDist = Infinity;
  let nearest = MONK_SCALE[0];
  for (const mst of MONK_SCALE) {
    const { r: mr, g: mg, b: mb } = hexToRgb(mst.hex);
    const [mL, ma, mbLab] = rgbToLab(mr, mg, mb);
    const dist = Math.sqrt((L - mL) ** 2 + (a - ma) ** 2 + (bLab - mbLab) ** 2);
    if (dist < minDist) { minDist = dist; nearest = mst; }
  }
  return nearest;
}

// ─── Face Shape from Landmarks ──────────────────────────────
function classifyFaceShapeFromLandmarks(landmarks: { x: number; y: number }[]): string {
  const jawLeft  = landmarks[234] || landmarks[0];
  const jawRight = landmarks[454] || landmarks[landmarks.length - 1];
  const chin     = landmarks[152] || landmarks[Math.floor(landmarks.length / 2)];
  const forehead = landmarks[10]  || landmarks[0];
  const cheekLeft   = landmarks[93]  || jawLeft;
  const cheekRight  = landmarks[323] || jawRight;
  const templeLeft  = landmarks[21]  || jawLeft;
  const templeRight = landmarks[251] || jawRight;

  const jawWidth      = Math.abs(jawRight.x - jawLeft.x);
  const faceHeight    = Math.abs(chin.y - forehead.y);
  const cheekWidth    = Math.abs(cheekRight.x - cheekLeft.x);
  const foreheadWidth = Math.abs(templeRight.x - templeLeft.x);

  const ratio          = jawWidth / faceHeight;
  const cheekToJaw     = cheekWidth / jawWidth;
  const foreheadToJaw  = foreheadWidth / jawWidth;

  if (ratio > 0.9 && cheekToJaw > 0.95) return 'Round';
  if (ratio > 0.85 && foreheadToJaw > 0.95 && cheekToJaw > 0.95) return 'Square';
  if (foreheadToJaw > 1.1) return 'Heart';
  if (cheekToJaw > 1.1 && foreheadToJaw < 0.95) return 'Diamond';
  if (ratio < 0.65) return 'Oblong';
  return 'Oval';
}

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
    faceShape = classifyFaceShapeFromLandmarks(faceLandmarks);

    // Sample from FOUR cheek landmarks for a more accurate skin average
    const samplePoints = [
      faceLandmarks[93],   // left cheek inner
      faceLandmarks[323],  // right cheek inner
      faceLandmarks[50],   // left cheek outer
      faceLandmarks[280],  // right cheek outer
    ].filter(Boolean);

    let rSum = 0, gSum = 0, bSum = 0, totalCount = 0;
    const sampleSize = Math.floor(w * 0.06);

    for (const pt of samplePoints) {
      const sx = Math.floor(pt.x * w);
      const sy = Math.floor(pt.y * h);
      const x0 = Math.max(0, sx - sampleSize / 2);
      const y0 = Math.max(0, sy - sampleSize / 2);
      const sw = Math.min(sampleSize, w - x0);
      const sh = Math.min(sampleSize, h - y0);
      if (sw <= 0 || sh <= 0) continue;
      const data = ctx.getImageData(x0, y0, sw, sh).data;
      for (let i = 0; i < data.length; i += 16) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        totalCount++;
      }
    }

    const avgR = totalCount > 0 ? rSum / totalCount : 180;
    const avgG = totalCount > 0 ? gSum / totalCount : 140;
    const avgB = totalCount > 0 ? bSum / totalCount : 110;

    // Monk Scale classification via CIE-LAB distance
    const monk = findMonkLevel(avgR, avgG, avgB);

    const colorMap = gender === 'male' ? MST_COLOR_MAP_MALE : MST_COLOR_MAP_FEMALE;
    const styleMap = gender === 'male' ? STYLE_MAP_MALE : STYLE_MAP_FEMALE;

    return {
      faceShape,
      skinTone: monk.name,
      monkLevel: monk.level,
      monkLabel: monk.label,
      monkUndertone: monk.undertone,
      gender,
      suggestedHairColors: colorMap[monk.level] ?? colorMap[5],
      suggestedStyles: styleMap[faceShape] ?? styleMap['Oval'],
    };
  }

  // Fallback: no landmarks — center-of-frame estimation
  const centerX = Math.floor(w * 0.35);
  const centerY = Math.floor(h * 0.25);
  const faceW   = Math.floor(w * 0.3);
  const faceH   = Math.floor(h * 0.45);

  const faceData = ctx.getImageData(centerX, centerY, faceW, faceH).data;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < faceData.length; i += 16) {
    rSum += faceData[i];
    gSum += faceData[i + 1];
    bSum += faceData[i + 2];
    count++;
  }

  const avgR = count > 0 ? rSum / count : 180;
  const avgG = count > 0 ? gSum / count : 140;
  const avgB = count > 0 ? bSum / count : 110;
  const monk = findMonkLevel(avgR, avgG, avgB);

  faceShape = classifyFaceShapeSimple(faceW, faceH);

  const colorMap = gender === 'male' ? MST_COLOR_MAP_MALE : MST_COLOR_MAP_FEMALE;
  const styleMap = gender === 'male' ? STYLE_MAP_MALE : STYLE_MAP_FEMALE;

  return {
    faceShape,
    skinTone: monk.name,
    monkLevel: monk.level,
    monkLabel: monk.label,
    monkUndertone: monk.undertone,
    gender,
    suggestedHairColors: colorMap[monk.level] ?? colorMap[5],
    suggestedStyles: styleMap[faceShape] ?? styleMap['Oval'],
  };
}

export { FACE_SHAPES };

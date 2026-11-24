import type { StyleRecommendation } from '../types';

const FACE_SHAPES = ['Oval', 'Round', 'Square', 'Heart', 'Oblong'] as const;
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'] as const;

const COLOR_MAP: Record<string, string[]> = {
  Fair: ['Honey Blonde', 'Soft Auburn', 'Light Caramel', 'Rose Gold'],
  Light: ['Warm Brown', 'Copper Highlights', 'Ash Blonde', 'Chestnut'],
  Medium: ['Rich Chocolate', 'Caramel Balayage', 'Burgundy', 'Golden Brown'],
  Olive: ['Espresso', 'Copper Red', 'Dark Auburn', 'Warm Black'],
  Tan: ['Deep Brown', 'Mahogany', 'Caramel Ombré', 'Warm Burgundy'],
  Deep: ['Jet Black', 'Deep Burgundy', 'Copper Brown', 'Platinum Highlights'],
};

const STYLE_MAP: Record<string, string[]> = {
  Oval: ['Long Layers', 'Soft Waves', 'Side-Swept Bangs', 'Bob Cut'],
  Round: ['Long Straight', 'Angular Bob', 'Side Part', 'Volume at Crown'],
  Square: ['Soft Curls', 'Long Layers', 'Side Swept', 'Textured Lob'],
  Heart: ['Chin-Length Bob', 'Side Part Waves', 'Soft Bangs', 'Layered Pixie'],
  Oblong: ['Shoulder-Length Waves', 'Blunt Cut', 'Curtain Bangs', 'Volume Curls'],
};

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

function classifyFaceShape(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 0.92) return 'Round';
  if (ratio > 0.82) return 'Square';
  if (ratio > 0.72) return 'Oval';
  if (ratio > 0.62) return 'Heart';
  return 'Oblong';
}

export async function analyzeFaceFromVideo(
  video: HTMLVideoElement
): Promise<StyleRecommendation> {
  const canvas = document.createElement('canvas');
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, w, h);

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
  const avgR = rSum / count;
  const avgG = gSum / count;
  const avgB = bSum / count;

  const skinTone = classifySkinTone(avgR, avgG, avgB);
  const faceShape = classifyFaceShape(faceW, faceH);

  const suggestedHairColors = COLOR_MAP[skinTone] ?? COLOR_MAP.Medium;
  const suggestedStyles = STYLE_MAP[faceShape] ?? STYLE_MAP.Oval;

  return {
    faceShape,
    skinTone,
    suggestedHairColors,
    suggestedStyles,
  };
}

export const HAIR_COLOR_OPTIONS = [
  'Honey Blonde', 'Warm Brown', 'Rich Chocolate', 'Copper Red',
  'Burgundy', 'Jet Black', 'Caramel Balayage', 'Platinum',
  'Rose Gold', 'Mahogany', 'Ash Blonde', 'Espresso',
];

export { FACE_SHAPES, SKIN_TONES };

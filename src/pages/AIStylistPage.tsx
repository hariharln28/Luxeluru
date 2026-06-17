import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { analyzeFaceFromVideo, HAIR_COLOR_OPTIONS } from '../utils/faceAnalysis';

export function AIStylistPage() {
  const { styleRecommendation, setStyleRecommendation } = useApp();
  const tr = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert('Camera access denied. Please enable camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  async function handleAnalyze() {
    if (!videoRef.current || !cameraOn) return;
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const result = await analyzeFaceFromVideo(videoRef.current);
    setStyleRecommendation(result);
    setAnalyzing(false);
  }

  function handleColorAdjust(color: string) {
    setCustomColor(color);
    if (styleRecommendation) {
      setStyleRecommendation({ ...styleRecommendation, userAdjustedColor: color });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('aiStylist')}</h1>
      <p className="mt-2 text-[#9a8fa8]">
        Turn on your camera — our AI analyzes face tone, shape & dimensions to recommend perfect styles
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="luxe-card overflow-hidden p-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#0f0d12]">
            {cameraOn ? (
              <video ref={videoRef} className="h-full w-full object-cover mirror" playsInline muted />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-[#9a8fa8]">
                <Camera className="h-16 w-16 opacity-40" />
                <p className="mt-4 text-sm">{tr('turnOnCamera')}</p>
              </div>
            )}
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Sparkles className="h-10 w-10 animate-pulse text-[#c9a962]" />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            {!cameraOn ? (
              <button onClick={startCamera} className="luxe-btn flex flex-1 items-center justify-center gap-2">
                <Camera className="h-5 w-5" /> {tr('turnOnCamera')}
              </button>
            ) : (
              <>
                <button onClick={handleAnalyze} disabled={analyzing} className="luxe-btn flex flex-1 items-center justify-center gap-2">
                  {analyzing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {tr('analyzeFace')}
                </button>
                <button onClick={stopCamera} className="luxe-btn-outline">Stop</button>
              </>
            )}
          </div>
        </div>

        <div>
          {styleRecommendation ? (
            <div className="luxe-card space-y-6 p-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#0f0d12]/60 p-4">
                  <p className="text-xs text-[#9a8fa8]">{tr('faceShape')}</p>
                  <p className="mt-1 font-display text-xl text-[#c9a962]">{styleRecommendation.faceShape}</p>
                </div>
                <div className="rounded-lg bg-[#0f0d12]/60 p-4">
                  <p className="text-xs text-[#9a8fa8]">{tr('skinTone')}</p>
                  <p className="mt-1 font-display text-xl text-[#c9a962]">{styleRecommendation.skinTone}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[#e8d5a3]">{tr('suggestedColors')}</p>
                <div className="flex flex-wrap gap-2">
                  {styleRecommendation.suggestedHairColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorAdjust(color)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        (customColor || styleRecommendation.suggestedHairColors[0]) === color
                          ? 'bg-[#c9a962] text-[#0f0d12]'
                          : 'border border-[#c9a962]/30 text-[#e8d5a3] hover:border-[#c9a962]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[#e8d5a3]">{tr('adjustColor')}</p>
                <select
                  value={customColor}
                  onChange={(e) => handleColorAdjust(e.target.value)}
                  className="luxe-input"
                >
                  <option value="">Select preferred colour...</option>
                  {HAIR_COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[#e8d5a3]">{tr('suggestedStyles')}</p>
                <ul className="space-y-2">
                  {styleRecommendation.suggestedStyles.map((style) => (
                    <li key={style} className="flex items-center gap-2 text-sm text-[#9a8fa8]">
                      <Sparkles className="h-4 w-4 text-[#c9a962]" /> {style}
                    </li>
                  ))}
                </ul>
              </div>

              <Link to="/salons?category=hair" className="luxe-btn block text-center">
                {tr('applySuggestion')}
              </Link>
            </div>
          ) : (
            <div className="luxe-card flex h-full min-h-[300px] items-center justify-center p-6">
              <p className="text-center text-[#9a8fa8]">
                Enable camera and tap analyze to get personalized style recommendations
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
}

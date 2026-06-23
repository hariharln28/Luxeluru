import { useRef, useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Sparkles, RefreshCw, User, AlertTriangle, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import {
  analyzeFaceFromVideo,
  HAIR_COLOR_OPTIONS_FEMALE,
  HAIR_COLOR_OPTIONS_MALE,
  HAIR_STYLE_OPTIONS_FEMALE,
  HAIR_STYLE_OPTIONS_MALE,
  HAIR_COLOR_HEX,
} from '../utils/faceAnalysis';

// Declare global FaceMesh from CDN
declare global {
  interface Window {
    FaceMesh: any;
  }
}

// Load MediaPipe FaceMesh from CDN
function loadFaceMeshScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FaceMesh) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load FaceMesh'));
    document.head.appendChild(script);
  });
}

export function AIStylistPage() {
  const { styleRecommendation, setStyleRecommendation, addToast } = useApp();
  const tr = useT();
  const navigate = useNavigate();

  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [customMessageText, setCustomMessageText] = useState<string>('');

  useEffect(() => {
    if (styleRecommendation) {
      setUploadedImage(styleRecommendation.customImageUrl || '');
      setCustomMessageText(styleRecommendation.customMessage || '');
    } else {
      setUploadedImage('');
      setCustomMessageText('');
    }
  }, [styleRecommendation]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      addToast('error', 'Image too large. Please upload an image under 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      if (styleRecommendation) {
        setStyleRecommendation({
          ...styleRecommendation,
          customImageUrl: base64String
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleMessageChange(msg: string) {
    setCustomMessageText(msg);
    if (styleRecommendation) {
      setStyleRecommendation({
        ...styleRecommendation,
        customMessage: msg
      });
    }
  }

  function handleRemoveImage() {
    setUploadedImage('');
    if (styleRecommendation) {
      setStyleRecommendation({
        ...styleRecommendation,
        customImageUrl: undefined
      });
    }
  }

  function handleSaveCustomPreference() {
    if (!uploadedImage && !customMessageText.trim()) {
      addToast('error', 'Please upload an image or write a custom message first.');
      return;
    }

    setStyleRecommendation({
      faceShape: 'Custom Upload',
      skinTone: 'Custom Upload',
      gender: gender,
      suggestedHairColors: [],
      suggestedStyles: [],
      customImageUrl: uploadedImage || undefined,
      customMessage: customMessageText || undefined
    });

    addToast('success', 'Custom preference saved! Redirecting to salons...');
    navigate('/salons?category=hair');
  }

  const customPreferenceMarkup = (
    <div className="border-t border-[#c9a962]/10 pt-4 space-y-4">
      <p className="text-sm font-medium text-[#e8d5a3]">Custom Preference Reference</p>
      
      {/* File Upload Dropzone */}
      <div className="space-y-2">
        <p className="text-xs text-[#9a8fa8]">Upload an image of your preferred style/color:</p>
        {uploadedImage ? (
          <div className="relative inline-block">
            <img src={uploadedImage} alt="Custom Preference" className="h-32 w-32 object-cover rounded-xl border border-[#c9a962]/30" />
            <button 
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              title="Remove Image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-[#c9a962]/30 rounded-xl p-6 bg-[#0f0d12]/40 text-center hover:border-[#c9a962]/60 transition">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
              id="custom-pref-file-upload" 
            />
            <label htmlFor="custom-pref-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-[#c9a962]/60" />
              <span className="text-xs text-[#c9a962]">Click to upload reference image</span>
              <span className="text-[10px] text-[#9a8fa8]/60">PNG, JPG, WEBP up to 20MB</span>
            </label>
          </div>
        )}
      </div>

      {/* Message textarea */}
      <div className="space-y-1">
        <label className="text-xs text-[#9a8fa8] block">Custom message or coloring instructions:</label>
        <textarea
          value={customMessageText}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="e.g. I want this specific haircut but with cherry red highlights..."
          className="luxe-input min-h-[80px] text-xs resize-none"
        />
      </div>
    </div>
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [customColor, setCustomColor] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const landmarksRef = useRef<{ x: number; y: number }[]>([]);
  const animFrameRef = useRef<number>(0);
  const runningRef = useRef(false);

  const colorOptions = gender === 'male' ? HAIR_COLOR_OPTIONS_MALE : HAIR_COLOR_OPTIONS_FEMALE;
  const styleOptions = gender === 'male' ? HAIR_STYLE_OPTIONS_MALE : HAIR_STYLE_OPTIONS_FEMALE;

  // Draw face mesh overlay + hair color preview on canvas
  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !runningRef.current) return;

    const ctx = canvas.getContext('2d')!;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    const landmarks = landmarksRef.current;
    if (landmarks.length > 400) {
      setFaceDetected(true);

      // Draw face mesh dots
      ctx.fillStyle = 'rgba(201, 169, 98, 0.25)';
      for (let i = 0; i < landmarks.length; i += 3) {
        const x = (1 - landmarks[i].x) * w;
        const y = landmarks[i].y * h;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw hair color tint preview
      const activeColor = customColor || styleRecommendation?.suggestedHairColors?.[0];
      if (activeColor) {
        const hex = HAIR_COLOR_HEX[activeColor];
        if (hex) {
          const forehead = landmarks[10];
          const templeL = landmarks[21];
          const templeR = landmarks[251];
          if (forehead && templeL && templeR) {
            const fx = (1 - forehead.x) * w;
            const fy = forehead.y * h;
            const tlx = (1 - templeL.x) * w;
            const trx = (1 - templeR.x) * w;
            const hairWidth = Math.abs(trx - tlx) * 1.5;
            const hairHeight = fy * 0.55;

            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = hex;
            ctx.beginPath();
            ctx.ellipse(fx, fy - hairHeight * 0.35, hairWidth / 2, hairHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    } else {
      setFaceDetected(false);
    }

    // Send frame to FaceMesh
    if (faceMeshRef.current && video.readyState >= 2) {
      faceMeshRef.current.send({ image: video }).catch(() => {});
    }

    animFrameRef.current = requestAnimationFrame(drawOverlay);
  }, [customColor, styleRecommendation]);

  const startCamera = useCallback(async () => {
    try {
      // Load FaceMesh from CDN
      await loadFaceMeshScript();

      const faceMesh = new window.FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          landmarksRef.current = results.multiFaceLandmarks[0].map((l: any) => ({
            x: l.x,
            y: l.y,
          }));
        } else {
          landmarksRef.current = [];
        }
      });
      await faceMesh.initialize();
      faceMeshRef.current = faceMesh;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      runningRef.current = true;
      setCameraOn(true);
    } catch (err) {
      console.error('Camera/FaceMesh error:', err);
      alert('Camera access denied or FaceMesh failed to load. Please enable camera permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (faceMeshRef.current) {
      try { faceMeshRef.current.close(); } catch {}
    }
    faceMeshRef.current = null;
    landmarksRef.current = [];
    setFaceDetected(false);
    setCameraOn(false);
  }, []);

  // Start rendering loop when camera turns on
  useEffect(() => {
    if (cameraOn && runningRef.current) {
      animFrameRef.current = requestAnimationFrame(drawOverlay);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraOn, drawOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleAnalyze() {
    if (!videoRef.current || !cameraOn) return;
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1800));
    const result = await analyzeFaceFromVideo(
      videoRef.current,
      gender,
      landmarksRef.current.length > 0 ? landmarksRef.current : undefined
    );
    setStyleRecommendation(result);
    setCustomColor('');
    setCustomStyle('');
    setAnalyzing(false);
  }

  function handleColorSelect(color: string) {
    setCustomColor(color);
    if (styleRecommendation) {
      setStyleRecommendation({ ...styleRecommendation, userAdjustedColor: color });
    }
  }

  function handleStyleSelect(style: string) {
    setCustomStyle(style);
    if (styleRecommendation) {
      setStyleRecommendation({ ...styleRecommendation, userAdjustedStyle: style });
    }
  }

  function handleGenderChange(g: 'male' | 'female') {
    setGender(g);
    setCustomColor('');
    setCustomStyle('');
    if (styleRecommendation && videoRef.current && cameraOn) {
      setStyleRecommendation(null);
    }
  }

  const activeColor = customColor || styleRecommendation?.userAdjustedColor || '';
  const activeStyle = customStyle || styleRecommendation?.userAdjustedStyle || '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl gold-gradient">{tr('aiStylist')}</h1>
          <p className="mt-2 text-sm text-[#9a8fa8]">
            Turn on your camera — AI analyzes face shape, skin tone &amp; recommends perfect styles
          </p>
        </div>

        {/* Gender Toggle */}
        <div className="flex rounded-xl border border-[#c9a962]/20 bg-[#1a1520] p-1 self-start">
          <button
            onClick={() => handleGenderChange('female')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              gender === 'female'
                ? 'bg-[#c9a962] text-[#0f0d12]'
                : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <User className="h-4 w-4" /> Female
          </button>
          <button
            onClick={() => handleGenderChange('male')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              gender === 'male'
                ? 'bg-[#c9a962] text-[#0f0d12]'
                : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <User className="h-4 w-4" /> Male
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Camera */}
        <div className="luxe-card overflow-hidden p-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#0f0d12]">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover opacity-0 pointer-events-none"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className={`h-full w-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
            />
            {!cameraOn && (
              <div className="flex h-full flex-col items-center justify-center text-[#9a8fa8]">
                <Camera className="h-16 w-16 opacity-40" />
                <p className="mt-4 text-sm">{tr('turnOnCamera')}</p>
                <p className="mt-1 text-xs text-[#9a8fa8]/60">Face mesh detection activates automatically</p>
              </div>
            )}
            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                <Sparkles className="h-10 w-10 animate-pulse text-[#c9a962]" />
                <p className="mt-3 text-sm text-[#c9a962]">Analyzing your face...</p>
              </div>
            )}
            {cameraOn && !analyzing && (
              <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
                faceDetected
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  faceDetected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'
                }`} />
                {faceDetected ? 'Face Detected' : 'No Face'}
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
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="luxe-btn flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {tr('analyzeFace')}
                </button>
                <button onClick={stopCamera} className="luxe-btn-outline px-4">Stop</button>
              </>
            )}
          </div>

          {cameraOn && activeColor && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#0f0d12]/60 px-3 py-2">
              <span
                className="h-4 w-4 rounded-full border border-white/20 flex-shrink-0"
                style={{ backgroundColor: HAIR_COLOR_HEX[activeColor] || '#888' }}
              />
              <span className="text-xs text-[#9a8fa8]">
                Previewing: <span className="text-[#e8d5a3]">{activeColor}</span>
              </span>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {styleRecommendation ? (
            <div className="luxe-card space-y-5 p-5 sm:p-6 animate-fade-in">
              {/* Detected Properties */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: tr('faceShape'), value: styleRecommendation.faceShape },
                  { label: tr('skinTone'), value: styleRecommendation.skinTone },
                  { label: 'Gender', value: styleRecommendation.gender },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-[#0f0d12]/60 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#9a8fa8]">{label}</p>
                    <p className="mt-1 font-display text-lg text-[#c9a962] capitalize">{value}</p>
                  </div>
                ))}
              </div>

              {/* AI Recommended Colors */}
              <div>
                <p className="mb-2 text-sm font-medium text-[#e8d5a3]">
                  <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                  AI Recommended Colors
                </p>
                <div className="flex flex-wrap gap-2">
                  {styleRecommendation.suggestedHairColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                        activeColor === color
                          ? 'bg-[#c9a962] text-[#0f0d12] font-semibold'
                          : 'border border-[#c9a962]/30 text-[#e8d5a3] hover:border-[#c9a962]'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-white/20"
                        style={{ backgroundColor: HAIR_COLOR_HEX[color] || '#888' }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Recommended Styles */}
              <div>
                <p className="mb-2 text-sm font-medium text-[#e8d5a3]">
                  <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                  AI Recommended Styles
                </p>
                <div className="flex flex-wrap gap-2">
                  {styleRecommendation.suggestedStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => handleStyleSelect(style)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        activeStyle === style
                          ? 'bg-[#c9a962] text-[#0f0d12] font-semibold'
                          : 'border border-[#c9a962]/30 text-[#e8d5a3] hover:border-[#c9a962]'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Override */}
              <div className="border-t border-[#c9a962]/10 pt-4">
                <p className="mb-3 text-sm font-medium text-[#e8d5a3]">Custom Override</p>
                <div className="mb-4">
                  <p className="mb-2 text-xs text-[#9a8fa8]">Choose any hair colour:</p>
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition ${
                          activeColor === color
                            ? 'bg-[#c9a962]/20 ring-1 ring-[#c9a962]'
                            : 'hover:bg-[#c9a962]/10'
                        }`}
                        title={color}
                      >
                        <span
                          className="h-6 w-6 rounded-full border border-white/20 transition group-hover:scale-110"
                          style={{ backgroundColor: HAIR_COLOR_HEX[color] || '#888' }}
                        />
                        <span className="text-[8px] leading-tight text-[#9a8fa8] text-center truncate w-full">
                          {color.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-[#9a8fa8]">Choose any hair style:</p>
                  <select
                    value={activeStyle}
                    onChange={(e) => handleStyleSelect(e.target.value)}
                    className="luxe-input text-sm"
                  >
                    <option value="">Select a style...</option>
                    {styleOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Selection */}
              {(activeColor || activeStyle) && (
                <div className="rounded-lg bg-gradient-to-r from-[#c9a962]/10 to-purple-500/10 border border-[#c9a962]/20 p-4">
                  <p className="text-xs text-[#9a8fa8] mb-2">Your Selection</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {activeColor && (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-white/20"
                          style={{ backgroundColor: HAIR_COLOR_HEX[activeColor] || '#888' }}
                        />
                        <span className="text-sm font-medium text-[#e8d5a3]">{activeColor}</span>
                      </div>
                    )}
                    {activeStyle && (
                      <span className="text-sm font-medium text-[#e8d5a3]">• {activeStyle}</span>
                    )}
                  </div>
                </div>
              )}

              {customPreferenceMarkup}

              <Link to="/salons?category=hair" className="luxe-btn block text-center mt-4">
                {tr('applySuggestion')}
              </Link>
            </div>
          ) : (
            <div className="luxe-card p-6 flex flex-col gap-6">
              <div className="text-center">
                <Sparkles className="mx-auto h-10 w-10 text-[#c9a962]/30 mb-2" />
                <p className="text-[#e8d5a3] font-medium">Ready to discover your look?</p>
                <p className="mt-2 text-xs text-[#9a8fa8] max-w-xs mx-auto">
                  Select your gender, enable camera, and tap <strong className="text-[#c9a962]">Analyze Face</strong> to
                  get personalized hair color and style recommendations.
                </p>
              </div>
              
              <div className="border-t border-[#c9a962]/10 pt-4 space-y-4">
                <p className="text-xs font-semibold text-[#c9a962]/80 uppercase tracking-wider text-center">— OR —</p>
                <p className="text-sm font-medium text-[#e8d5a3] text-center">Book with Custom Preference</p>
                
                {/* File Upload Dropzone */}
                <div className="space-y-2">
                  <p className="text-xs text-[#9a8fa8]">Upload preference image:</p>
                  {uploadedImage ? (
                    <div className="relative inline-block">
                      <img src={uploadedImage} alt="Custom Preference" className="h-32 w-32 object-cover rounded-xl border border-[#c9a962]/30" />
                      <button 
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        title="Remove Image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#c9a962]/30 rounded-xl p-5 bg-[#0f0d12]/40 text-center hover:border-[#c9a962]/60 transition">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        id="custom-pref-file-upload-direct" 
                      />
                      <label htmlFor="custom-pref-file-upload-direct" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-[#c9a962]/60" />
                        <span className="text-xs text-[#c9a962]">Click to upload style image</span>
                        <span className="text-[10px] text-[#9a8fa8]/60">PNG, JPG, WEBP up to 20MB</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Message textarea */}
                <div className="space-y-1">
                  <label className="text-xs text-[#9a8fa8] block">Custom style preference message:</label>
                  <textarea
                    value={customMessageText}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    placeholder="Describe your desired hair style or color..."
                    className="luxe-input min-h-[80px] text-xs resize-none"
                  />
                </div>
                
                <button
                  onClick={handleSaveCustomPreference}
                  className="luxe-btn w-full text-center"
                >
                  Book with Custom Preference
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-3.5 w-3.5 text-[#9a8fa8]/60 flex-shrink-0" />
        <p className="text-xs text-[#9a8fa8]/60">
          AI Stylr uses AI — results are suggestions and may not always be accurate.
        </p>
      </div>
    </div>
  );
}

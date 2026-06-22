import { useState, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaChallengeProps {
  onVerified: (valid: boolean) => void;
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I to avoid confusion

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function CaptchaChallenge({ onVerified }: CaptchaChallengeProps) {
  const [code, setCode] = useState(generateCode);
  const [input, setInput] = useState('');

  const refresh = useCallback(() => {
    setCode(generateCode());
    setInput('');
    onVerified(false);
  }, [onVerified]);

  useEffect(() => {
    if (input.trim() === '') {
      onVerified(false);
      return;
    }
    onVerified(input.trim().toUpperCase() === code);
  }, [input, code, onVerified]);

  // Render each character with random visual distortion
  const renderCode = () =>
    code.split('').map((char, i) => {
      const rotation = Math.floor(Math.random() * 25) - 12;
      const yOffset = Math.floor(Math.random() * 6) - 3;
      const colors = ['#e8d5a3', '#c9a962', '#d4b87a', '#bfa355', '#f0e6c8'];
      const color = colors[i % colors.length];
      return (
        <span
          key={`${char}-${i}`}
          className="inline-block font-bold select-none"
          style={{
            transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
            color,
            fontSize: '1.4rem',
            fontFamily: 'monospace',
            letterSpacing: '3px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {char}
        </span>
      );
    });

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider text-[#9a8fa8] font-semibold">
        Security Verification
      </label>
      <div className="flex items-center gap-3">
        {/* Code display with visual noise */}
        <div
          className="flex items-center justify-center gap-1 flex-shrink-0 rounded-lg border border-[#c9a962]/30 bg-[#0f0d12] px-4 py-2.5 min-w-[140px]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(201,169,98,0.04) 3px, rgba(201,169,98,0.04) 6px),' +
              'repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(100,80,120,0.03) 5px, rgba(100,80,120,0.03) 8px)',
          }}
        >
          {renderCode()}
        </div>

        {/* Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5))}
          placeholder="Type code"
          maxLength={5}
          className="w-24 rounded-lg border border-[#c9a962]/30 bg-[#0f0d12] px-3 py-2.5 text-center text-sm text-[#e8d5a3] placeholder-[#9a8fa8]/50 outline-none focus:border-[#c9a962] transition uppercase tracking-widest font-mono"
        />

        {/* Refresh */}
        <button
          type="button"
          onClick={refresh}
          className="flex-shrink-0 rounded-lg border border-[#c9a962]/20 bg-[#0f0d12] p-2.5 text-[#c9a962] hover:bg-[#c9a962]/10 transition"
          title="New code"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[10px] text-[#9a8fa8]">Enter the 5 characters shown above (case-insensitive)</p>
    </div>
  );
}

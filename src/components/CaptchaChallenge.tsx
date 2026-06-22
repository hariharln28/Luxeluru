import { useState, useCallback, useEffect } from 'react';

interface CaptchaChallengeProps {
  onVerified: (valid: boolean) => void;
}

function generateChallenge() {
  const ops = ['+', '−'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 15) + 1;
    b = Math.floor(Math.random() * 15) + 1;
    answer = a + b;
  } else {
    a = Math.floor(Math.random() * 15) + 5;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  }

  return { text: `${a} ${op} ${b} = ?`, answer };
}

export function CaptchaChallenge({ onVerified }: CaptchaChallengeProps) {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [input, setInput] = useState('');

  const refresh = useCallback(() => {
    const next = generateChallenge();
    setChallenge(next);
    setInput('');
    onVerified(false);
  }, [onVerified]);

  // Validate whenever input changes
  useEffect(() => {
    if (input.trim() === '') {
      onVerified(false);
      return;
    }
    const num = parseInt(input.trim(), 10);
    onVerified(!isNaN(num) && num === challenge.answer);
  }, [input, challenge.answer, onVerified]);

  return (
    <div className="flex items-center gap-3">
      {/* Math question display with slight visual noise */}
      <div
        className="flex-shrink-0 select-none rounded-lg border border-[#c9a962]/30 bg-[#0f0d12] px-4 py-2"
        style={{
          fontFamily: 'monospace',
          fontSize: '1.1rem',
          letterSpacing: '2px',
          transform: 'skewX(-2deg)',
          textShadow: '1px 1px 2px rgba(201,169,98,0.25)',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,169,98,0.03) 2px, rgba(201,169,98,0.03) 4px)',
        }}
      >
        <span className="text-[#e8d5a3] font-bold">{challenge.text}</span>
      </div>

      {/* Answer input */}
      <input
        type="text"
        inputMode="numeric"
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ''))}
        placeholder="?"
        maxLength={4}
        className="w-16 rounded-lg border border-[#c9a962]/30 bg-[#0f0d12] px-3 py-2 text-center text-sm text-[#e8d5a3] placeholder-[#9a8fa8]/50 outline-none focus:border-[#c9a962] transition"
      />

      {/* Refresh button */}
      <button
        type="button"
        onClick={refresh}
        className="flex-shrink-0 rounded-lg border border-[#c9a962]/20 bg-[#0f0d12] p-2 text-[#c9a962] hover:bg-[#c9a962]/10 transition"
        title="New question"
      >
        🔄
      </button>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Smartphone, X, Check, Loader2, Shield, QrCode } from 'lucide-react';

interface CheckoutModalProps {
  amount: number;
  salonName: string;
  paymentMethod?: 'card' | 'upi';
  onSuccess: () => void;
  onClose: () => void;
}

export function CheckoutModal({ amount, salonName, paymentMethod: initialPaymentMethod = 'card', onSuccess, onClose }: CheckoutModalProps) {
  const [tab, setTab] = useState<'card' | 'upi'>(initialPaymentMethod);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardProcessing, setCardProcessing] = useState(false);

  // UPI state
  const [upiId, setUpiId] = useState('');
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Success state
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Format card number with spaces
  function formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  // Format expiry MM/YY
  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  // Card payment handler
  async function handleCardPay() {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) return;
    setCardProcessing(true);
    // Simulate Stripe processing
    await new Promise((r) => setTimeout(r, 2000));
    setCardProcessing(false);
    setPaymentSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  }

  // UPI verify handler
  async function handleUpiVerify() {
    if (!upiId.includes('@')) return;
    setUpiVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setUpiVerifying(false);
    setUpiVerified(true);
    setShowQrModal(true);
    setCountdown(15);
  }

  // Start countdown when QR modal opens
  useEffect(() => {
    if (showQrModal && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-complete after countdown
            setShowQrModal(false);
            setPaymentSuccess(true);
            setTimeout(() => onSuccess(), 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showQrModal, onSuccess]);

  // Simulate scan success
  function handleScanSuccess() {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowQrModal(false);
    setPaymentSuccess(true);
    setTimeout(() => onSuccess(), 2000);
  }

  const gst = Math.round(amount * 0.18);
  const totalWithGst = amount + gst;

  // Payment Success Screen
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#1a1520] border border-[#c9a962]/20 p-8 text-center animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
            <Check className="h-10 w-10 text-emerald-400 animate-bounce" />
          </div>
          <h2 className="font-display text-2xl text-emerald-400 mb-2">Payment Successful!</h2>
          <p className="text-sm text-[#9a8fa8] mb-4">
            ₹{totalWithGst.toLocaleString('en-IN')} paid successfully
          </p>
          <div className="rounded-lg bg-[#0f0d12]/60 p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-[#9a8fa8]">Transaction ID</span>
              <span className="text-[#e8d5a3] font-mono">TXN{Date.now().toString().slice(-8)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9a8fa8]">Paid via</span>
              <span className="text-[#e8d5a3]">{tab === 'card' ? 'Stripe (Card)' : 'UPI'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9a8fa8]">Salon</span>
              <span className="text-[#e8d5a3]">{salonName}</span>
            </div>
          </div>
          <p className="text-xs text-emerald-400/70">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // UPI QR Modal
  if (showQrModal) {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (countdown / 15) * circumference;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#1a1520] border border-[#c9a962]/20 p-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[#c9a962]" />
              <h3 className="font-display text-lg text-[#e8d5a3]">Complete UPI Payment</h3>
            </div>
            <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setShowQrModal(false); }} className="p-2 -m-2 text-[#9a8fa8] hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* QR Code Placeholder */}
          <div className="relative mx-auto mb-5">
            <div className="mx-auto w-48 h-48 rounded-xl bg-white p-3 flex items-center justify-center relative">
              {/* Simulated QR Code Pattern */}
              <div className="w-full h-full relative">
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  {/* QR-like pattern */}
                  {Array.from({ length: 12 }, (_, row) =>
                    Array.from({ length: 12 }, (_, col) => {
                      const isCorner =
                        (row < 3 && col < 3) ||
                        (row < 3 && col > 8) ||
                        (row > 8 && col < 3);
                      const filled = isCorner || Math.random() > 0.45;
                      return filled ? (
                        <rect
                          key={`${row}-${col}`}
                          x={col * 13 + 2}
                          y={row * 13 + 2}
                          width="11"
                          height="11"
                          rx="1"
                          fill={isCorner ? '#1a1520' : '#333'}
                        />
                      ) : null;
                    })
                  )}
                  {/* Center logo */}
                  <rect x="55" y="55" width="50" height="50" rx="8" fill="#1a1520" />
                  <text x="80" y="85" textAnchor="middle" fill="#c9a962" fontSize="14" fontWeight="bold">
                    ₹
                  </text>
                </svg>
              </div>
            </div>

            {/* Countdown Ring */}
            <div className="absolute -bottom-3 -right-3">
              <svg width="50" height="50" className="transform -rotate-90">
                <circle cx="25" cy="25" r="20" stroke="#2a2030" strokeWidth="3" fill="#1a1520" />
                <circle
                  cx="25" cy="25" r="20"
                  stroke="#c9a962" strokeWidth="3" fill="none"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 - (countdown / 15) * 2 * Math.PI * 20}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <text x="25" y="26" textAnchor="middle" dominantBaseline="middle" fill="#c9a962" fontSize="12" fontWeight="bold"
                  transform="rotate(90 25 25)">
                  {countdown}
                </text>
              </svg>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg bg-[#0f0d12]/60 p-3 mb-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#9a8fa8]">Paying to</span>
              <span className="text-[#e8d5a3]">Luxeluru Platform</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9a8fa8]">UPI ID</span>
              <span className="text-[#e8d5a3] font-mono">{upiId}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#9a8fa8]">Amount</span>
              <span className="text-[#c9a962]">₹{totalWithGst.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-xs text-center text-[#9a8fa8] mb-4">
            Scan QR code with any UPI app or approve notification on your phone
          </p>

          {/* Payment Confirmation Button */}
          <button
            onClick={handleScanSuccess}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2"
            style={{ touchAction: 'manipulation', minHeight: 44 }}
          >
            <Check className="h-4 w-4" />
            I've Completed the Payment
          </button>

          <p className="text-[10px] text-center text-[#9a8fa8]/50 mt-3">
            Tap above after completing payment in your UPI app. Expires in {countdown}s.
          </p>
        </div>
      </div>
    );
  }

  // Main Checkout Modal
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1520] border border-[#c9a962]/20 overflow-y-auto max-h-[90dvh] animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#c9a962]/10 to-purple-500/10 border-b border-[#c9a962]/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-[#e8d5a3]">Appointment Payment</h2>
            <p className="text-xs text-[#9a8fa8] mt-0.5">{salonName} • Secured by Stripe</p>
          </div>
          <button onClick={onClose} className="text-[#9a8fa8] hover:text-white transition p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Amount Summary */}
          <div className="rounded-xl bg-[#0f0d12]/60 p-4 mb-6">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[#9a8fa8]">Services Total</span>
              <span className="text-[#e8d5a3]">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[#9a8fa8]">GST (18%)</span>
              <span className="text-[#e8d5a3]">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-[#c9a962]/10 mt-2 pt-2 flex justify-between text-base font-semibold">
              <span className="text-[#e8d5a3]">Total Payable</span>
              <span className="text-[#c9a962]">₹{totalWithGst.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex rounded-xl border border-[#c9a962]/20 bg-[#0f0d12]/40 p-1 mb-6">
            <button
              onClick={() => setTab('card')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === 'card' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Card
            </button>
            <button
              onClick={() => setTab('upi')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === 'upi' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
              }`}
            >
              <QrCode className="h-4 w-4" /> UPI
            </button>
          </div>

          {/* Card Form */}
          {tab === 'card' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs text-[#9a8fa8] mb-1.5">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="luxe-input text-sm pl-10 font-mono tracking-wider"
                    inputMode="numeric"
                    pattern="[0-9 ]*"
                    autoComplete="cc-number"
                    style={{ fontSize: '16px' }}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a8fa8]" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#9a8fa8] mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Name on card"
                  className="luxe-input text-sm"
                  autoComplete="cc-name"
                  autoCapitalize="words"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9a8fa8] mb-1.5">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="luxe-input text-base font-mono"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9a8fa8] mb-1.5">CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="luxe-input text-base font-mono"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <button
                onClick={handleCardPay}
                disabled={cardProcessing || !cardNumber || !cardExpiry || !cardCvc || !cardName}
                className={`w-full mt-2 rounded-xl py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  cardProcessing || !cardNumber || !cardExpiry || !cardCvc || !cardName
                    ? 'bg-[#c9a962]/30 text-[#c9a962]/50 cursor-not-allowed'
                    : 'bg-[#c9a962] text-[#0f0d12] hover:bg-[#d4b56b]'
                }`}
              >
                {cardProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing via Stripe...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Pay ₹{totalWithGst.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* UPI Form */}
          {tab === 'upi' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs text-[#9a8fa8] mb-1.5">Enter UPI ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setUpiVerified(false); }}
                    placeholder="username@upi"
                    className="luxe-input text-sm pl-10 font-mono"
                    disabled={upiVerified}
                    autoComplete="off"
                    spellCheck={false}
                    style={{ fontSize: '16px' }}
                  />
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a8fa8]" />
                  {upiVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-semibold">Verified</span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-[#9a8fa8]/60">
                  e.g., salon@okaxis, owner@paytm, name@ybl
                </p>
              </div>

              {!upiVerified ? (
                <button
                  onClick={handleUpiVerify}
                  disabled={upiVerifying || !upiId.includes('@')}
                  className={`w-full rounded-xl py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    upiVerifying || !upiId.includes('@')
                      ? 'bg-[#c9a962]/30 text-[#c9a962]/50 cursor-not-allowed'
                      : 'bg-[#c9a962] text-[#0f0d12] hover:bg-[#d4b56b]'
                  }`}
                >
                  {upiVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying UPI ID...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Verify & Pay ₹{totalWithGst.toLocaleString('en-IN')}
                    </>
                  )}
                </button>
              ) : (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-xs text-emerald-400">
                    ✓ UPI ID verified — Opening payment approval...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] text-[#9a8fa8]/50">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> SSL Encrypted
            </span>
            <span>•</span>
            <span>Powered by Stripe</span>
            <span>•</span>
            <span>PCI DSS Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

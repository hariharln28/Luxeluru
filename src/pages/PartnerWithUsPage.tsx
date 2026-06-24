import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, FileText, LogOut, Lock, Building, Search, CheckCircle, Clock, Eye, EyeOff, Loader2, KeyRound, Send, MessageSquare, XCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function PartnerWithUsPage() {
  const { salonRegister, salonExit, salons, addToast, sendDirectMessage, messages } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'register' | 'exit' | 'status'>(
    (tabParam as any) || 'register'
  );

  // Sync tab state to URL
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register state
  const [ownerName, setOwnerName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneOwner, setPhoneOwner] = useState('');
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [panCardOwner, setPanCardOwner] = useState('');
  const [panCardBusiness, setPanCardBusiness] = useState('');

  // Exit state
  const [exitSalonId, setExitSalonId] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [exitPassword, setExitPassword] = useState('');

  // Derived state for exit
  const currentSalon = salons.find(s => s.id === exitSalonId);

  // Status check state
  const [statusSearch, setStatusSearch] = useState('');
  const [statusResult, setStatusResult] = useState<any | null>(null);

  // Set password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSetting, setPasswordSetting] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);


  // Exit dispute reply state
  const [exitReplyMsg, setExitReplyMsg] = useState('');
  const [exitReplySending, setExitReplySending] = useState(false);


  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!ownerName || !salonName || !address || !email || !phone || !phoneOwner) {
      setError('Please fill in all contact and business details.');
      return;
    }

    if (!panCardOwner && !panCardBusiness) {
      setError('Please provide at least one PAN card — either Owner PAN or Business PAN.');
      return;
    }

    if (!tradeLicenseFile) {
      setError('Please upload a copy of your Trade License (PDF, PNG, or JPEG).');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the terms and conditions to proceed.');
      return;
    }

    // Convert trade license file to base64
    let tradeLicenseUrl = tradeLicenseFile.name;
    try {
      const reader = new FileReader();
      tradeLicenseUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(tradeLicenseFile);
      });
    } catch {
      // fallback to filename
    }

    // Auto generate ID and return it
    const generatedId = await salonRegister({
      ownerName,
      name: salonName,
      address,
      email,
      phone,
      phoneOwner,
      panCardOwner,
      panCardBusiness,
      tradeLicenseUrl,
    });

    setSuccessMsg(
      `Thank you for registering with Luxeluru! Your application has been received and is pending approval from the platform. We will verify your trade license and details within 5 business days.

      Use your registered business email (${email}) to check your application status anytime under the "Check Status" tab. Your unique Salon ID will be auto-generated after admin approval.`
    );
    addToast('success', 'Application submitted successfully!');

    // Reset register fields
    setOwnerName('');
    setSalonName('');
    setAddress('');
    setEmail('');
    setPhone('');
    setPhoneOwner('');
    setTradeLicenseFile(null);
    setTermsAccepted(false);
    setPanCardOwner('');
    setPanCardBusiness('');
  }

  async function handleExitSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!exitSalonId || !exitReason || !exitPassword) {
      setError('All fields are required to process a salon exit request.');
      return;
    }

    const targetSalon = salons.find((s) => s.id === exitSalonId);
    if (!targetSalon || targetSalon.password !== exitPassword) {
      setError('Invalid Salon ID or password.');
      return;
    }

    if (targetSalon.exitRequestStatus === 'pending') {
      setError('Your exit request is already pending approval by the Admin.');
      return;
    }

    if ((targetSalon.commissionDue || 0) > 0) {
      setError(`You have outstanding commission dues of ₹${targetSalon.commissionDue}. You must pay all dues before you can request to exit the platform.`);
      return;
    }

    const success = await salonExit(exitSalonId, exitReason);
    if (success) {
      setSuccessMsg(`Your exit request for Salon "${targetSalon.name}" (${exitSalonId}) has been sent to the Admin for approval.`);
      setExitSalonId('');
      setExitReason('');
      setExitPassword('');
    } else {
      setError('Failed to request exit. Please check details or try again later.');
    }
  }



  function handleStatusCheck(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatusResult(null);

    if (!statusSearch.trim()) {
      setError('Please enter your registered business email to check status.');
      return;
    }

    if (!statusSearch.includes('@')) {
      setError('Please enter a valid email address (e.g. salon@example.com).');
      return;
    }

    const found = salons.find(
      (s) => s.email.toLowerCase().trim() === statusSearch.toLowerCase().trim()
    );

    if (!found) {
      setError('No registered salon application found with that email address.');
      return;
    }

    setStatusResult(found);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl sm:text-5xl font-bold gold-gradient">Luxeluru — Partner with us</h1>
        <p className="mt-3 text-lg text-[#9a8fa8]">Register your salon with Luxeluru.</p>
      </div>

      <div className="flex justify-center mb-8 border-b border-[#c9a962]/20">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-6 pb-px">
          <button
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 pb-4 text-xs sm:text-base font-semibold border-b-2 transition ${
              activeTab === 'register' ? 'border-[#c9a962] text-[#e8d5a3]' : 'border-transparent text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <Building className="h-5 w-5" />
            Register Salon
          </button>
          <button
            onClick={() => { setActiveTab('status'); setError(''); setSuccessMsg(''); setStatusResult(null); setStatusSearch(''); }}
            className={`flex items-center gap-2 pb-4 text-xs sm:text-base font-semibold border-b-2 transition ${
              activeTab === 'status' ? 'border-[#c9a962] text-[#e8d5a3]' : 'border-transparent text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <Search className="h-5 w-5" />
            Check Status
          </button>
          <button
            onClick={() => { setActiveTab('exit'); setError(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 pb-4 text-xs sm:text-base font-semibold border-b-2 transition ${
              activeTab === 'exit' ? 'border-[#c9a962] text-[#e8d5a3]' : 'border-transparent text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <LogOut className="h-5 w-5" />
            Exit Platform
          </button>

        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-4 text-sm text-green-300 flex flex-col gap-2 whitespace-pre-line">
          <p className="font-semibold text-green-200">Request Processed Successfully</p>
          <p>{successMsg}</p>
        </div>
      )}

      {activeTab === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="luxe-card space-y-6 p-6 sm:p-8 animate-fade-in">
          <div className="border-b border-[#c9a962]/10 pb-4">
            <h3 className="font-display text-2xl text-[#e8d5a3]">Apply for Partnership</h3>
            <p className="text-xs text-[#9a8fa8] mt-1">Our administration team will review your application within 5 business days.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon Owner Full Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="luxe-input"
                placeholder="Owner's Name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon Brand Name</label>
              <input
                type="text"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="luxe-input"
                placeholder="Salon Name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="luxe-input"
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Owner Mobile Number</label>
              <input
                type="tel"
                value={phoneOwner}
                onChange={(e) => setPhoneOwner(e.target.value)}
                className="luxe-input"
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon Business Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="luxe-input"
                placeholder="contact@salonbrand.com"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Complete Address of the Salon</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="luxe-input min-h-[80px]"
                placeholder="Building, Street, Landmark, Bengaluru, Karnataka, PIN"
                required
              />
            </div>
            <div>
              <label className="luxe-label">Owner PAN Card Number <span className="text-[#9a8fa8] font-normal text-[11px]">(optional if Business PAN provided)</span></label>
              <input type="text" value={panCardOwner} onChange={(e) => setPanCardOwner(e.target.value.toUpperCase())} className="luxe-input" placeholder="e.g. ABCDE1234F" maxLength={10} />
            </div>
            <div>
              <label className="luxe-label">Business PAN Card Number <span className="text-[#9a8fa8] font-normal text-[11px]">(optional if Owner PAN provided)</span></label>
              <input type="text" value={panCardBusiness} onChange={(e) => setPanCardBusiness(e.target.value.toUpperCase())} className="luxe-input" placeholder="e.g. AABCU9603R" maxLength={10} />
              <p className="text-[11px] text-[#9a8fa8] mt-1.5">At least one PAN card is required — Owner PAN or Business PAN.</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">Upload Trade License Photo / PDF</label>
            <div className="relative flex flex-col items-center justify-center border border-dashed border-[#c9a962]/30 rounded-lg p-6 bg-[#0f0d12]/40 hover:bg-[#0f0d12]/80 transition">
              <FileText className="h-10 w-10 text-[#c9a962] mb-2" />
              <span className="text-sm font-medium text-[#e8d5a3]">
                {tradeLicenseFile ? tradeLicenseFile.name : 'Choose a file or drag here'}
              </span>
              <span className="text-xs text-[#9a8fa8] mt-1">Accepts PDF, PNG, JPEG. Max size 5MB.</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setTradeLicenseFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#c9a962]/20 bg-[#1a1520]/80 p-4">
            <h4 className="flex items-center gap-2 font-display text-lg text-amber-300 mb-2">
              <Shield className="h-5 w-5" /> Terms of Association
            </h4>
            <div className="space-y-2 text-xs text-[#9a8fa8] leading-relaxed">
              <p>
                <strong>1. Salon Commission & Penalty:</strong> Salons are required to pay a 3% service charge to the platform on all completed appointments.
              </p>
              <p>
                <strong>2. Billing & Updates:</strong> Dues accumulate as the salon updates appointment status. All bookings are cross-referenced with customer data to prevent discrepancies.
              </p>
              <p>
                <strong>3. Deadlines & Enforcement:</strong> The deadline to pay is the end of the month, followed by a hard 5-day grace period. Failure to clear dues by the 5th of the next month will result in automatic platform deactivation until the balance is cleared. Reactivation is instant upon payment.
              </p>
              <p>
                <strong>4. Post-Service Logs:</strong> Salons must update payment mode (cash/upi) and customer package changes immediately after each service is completed.
              </p>
              <p>
                <strong>5. Cancellation &amp; Refund Policy:</strong> Luxeluru enforces a tiered refund policy for online payments. Salons must honour customer cancellations per the following schedule — <strong className="text-[#e8d5a3]">100% refund</strong> (3+ days before appointment) · <strong className="text-[#e8d5a3]">70% refund</strong> (2 days before) · <strong className="text-[#e8d5a3]">50% refund</strong> (1 day before) · <strong className="text-[#e8d5a3]">30% refund</strong> (same day). No refunds are issued for Pay-at-Salon bookings. Refunds are processed by the platform and the balance amount after refund goes to the platform.
              </p>
            </div>
            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#c9a962]/30 bg-transparent text-[#c9a962]"
              />
              <span className="text-sm text-[#e8d5a3] select-none">
                I accept the terms and conditions outlined above.
              </span>
            </label>
          </div>

          <button type="submit" className="luxe-btn w-full">
            Submit Registration Details
          </button>
        </form>
      )}

      {activeTab === 'status' && (
        <div className="luxe-card p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="border-b border-[#c9a962]/10 pb-4">
            <h3 className="font-display text-2xl text-[#e8d5a3]">Check Onboarding Status</h3>
            <p className="text-xs text-[#9a8fa8] mt-1">Track the review status of your salon registration on the platform.</p>
          </div>

          <form onSubmit={handleStatusCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                className="luxe-input"
                placeholder="Enter your registered business email (e.g. salon@example.com)"
                required
              />
            </div>
            <button type="submit" className="luxe-btn px-6 flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Check Status
            </button>
          </form>

          {statusResult && (
            <div className="rounded-xl border border-[#c9a962]/20 bg-[#1a1520]/80 p-5 space-y-4 animate-fade-in">
              <div className="flex justify-between items-start border-b border-[#c9a962]/10 pb-3">
                <div>
                  <h4 className="font-display text-xl text-[#e8d5a3] font-bold">{statusResult.name}</h4>
                  {statusResult.registrationStatus === 'approved' ? (
                    <p className="text-xs text-[#9a8fa8] mt-0.5">Salon Code: <span className="font-mono font-semibold text-[#c9a962]">{statusResult.id}</span></p>
                  ) : (
                    <p className="text-xs text-[#9a8fa8] mt-0.5">Salon ID: <span className="text-amber-300 italic">Assigned after approval</span></p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  statusResult.registrationStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                  statusResult.registrationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {statusResult.registrationStatus === 'approved' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {statusResult.registrationStatus === 'approved' ? 'APPROVED & ACTIVE' :
                   statusResult.registrationStatus === 'rejected' ? 'REJECTED / EXITED' :
                   'PENDING APPROVAL'}
                </span>
              </div>

              <div className="text-sm text-[#9a8fa8] space-y-2">
                <p><strong>Owner Name:</strong> {statusResult.ownerName}</p>
                <p><strong>Business Email:</strong> {statusResult.email}</p>
                <p><strong>Location:</strong> {statusResult.address}</p>

                {/* ── REGISTRATION STATUS SECTION ── */}
                {statusResult.registrationStatus === 'pending' && !statusResult.exitRequestStatus && (
                  <div className="mt-4 p-4 bg-amber-500/10 rounded-lg text-amber-200 text-xs leading-relaxed border border-amber-500/20">
                    <strong>⏳ Under Review:</strong> Your salon registration details and Trade License are currently being verified by the administrator. Approval generally takes up to 5 business days. Your unique Salon ID will be auto-generated once your application is approved. Check back using your email.
                  </div>
                )}

                {statusResult.registrationStatus === 'approved' && !statusResult.exitRequestStatus && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg text-green-200 text-xs leading-relaxed border border-green-500/20 space-y-3">
                    <p><strong>✅ Approved:</strong> Your application has been approved and activated! You are now live on the Luxeluru platform.</p>
                    <p className="pt-1">You can log in to the Salon Partner Portal from the Sign In page using the details below:</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-[#e8d5a3]">
                      <li><strong>Salon Name:</strong> {statusResult.name}</li>
                      <li><strong>Salon ID:</strong> {statusResult.id}</li>
                      <li><strong>Salon Email:</strong> {statusResult.email}</li>
                      <li><strong>Default Password:</strong> <span className="font-mono bg-[#0f0d12] px-1.5 py-0.5 rounded text-[#c9a962]">SALON@123</span></li>
                    </ul>

                    {/* Set Custom Password */}
                    <div className="mt-4 pt-3 border-t border-green-500/20">
                      {passwordSet ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-semibold">Password updated successfully! Use your new password to sign in.</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <KeyRound className="h-4 w-4 text-[#c9a962]" />
                            <span className="text-sm font-semibold text-[#e8d5a3]">Set Custom Password</span>
                          </div>
                          <p className="text-[#9a8fa8] mb-3">Replace the default password with your own secure password (minimum 8 characters).</p>

                          {passwordError && (
                            <p className="text-red-400 text-xs mb-2">{passwordError}</p>
                          )}

                          <div className="space-y-2">
                            <div className="relative">
                              <input
                                type={showNewPass ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                                className="luxe-input text-sm pr-10"
                                placeholder="New password (min 8 characters)"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8] hover:text-[#e8d5a3] transition"
                              >
                                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                              className="luxe-input text-sm"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              disabled={passwordSetting}
                              onClick={async () => {
                                setPasswordError('');
                                if (newPassword.length < 8) {
                                  setPasswordError('Password must be at least 8 characters.');
                                  return;
                                }
                                if (newPassword !== confirmPassword) {
                                  setPasswordError('Passwords do not match.');
                                  return;
                                }
                                setPasswordSetting(true);
                                try {
                                  const res = await api.setSalonPassword(statusResult.email, statusResult.id, newPassword);
                                  if (res.success) {
                                    setPasswordSet(true);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    addToast('success', 'Salon password updated successfully!');
                                  }
                                } catch (err: any) {
                                  setPasswordError(err?.message || 'Failed to set password. Please try again.');
                                }
                                setPasswordSetting(false);
                              }}
                              className={`w-full rounded-lg py-2.5 text-xs font-semibold transition flex items-center justify-center gap-2 ${
                                passwordSetting ? 'bg-[#c9a962]/30 text-[#c9a962]/50 cursor-not-allowed' : 'bg-[#c9a962] text-[#0f0d12] hover:bg-[#d4b56b]'
                              }`}
                            >
                              {passwordSetting ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...</>
                              ) : (
                                <><Lock className="h-3.5 w-3.5" /> Set Password</>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {statusResult.registrationStatus === 'rejected' && !statusResult.exitRequestStatus && (
                  <div className="mt-4 p-4 bg-red-500/10 rounded-lg text-red-200 text-xs leading-relaxed border border-red-500/20">
                    <strong>❌ Application Inactive:</strong> This application has been rejected or the salon has opted to exit the platform.
                    {statusResult.exitReason && (
                      <p className="mt-2"><strong>Deregistration Reason:</strong> {statusResult.exitReason}</p>
                    )}
                  </div>
                )}

                {/* ── EXIT REQUEST STATUS SECTION ── */}
                {statusResult.exitRequestStatus === 'pending' && (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-amber-500/10 rounded-xl text-amber-200 text-xs leading-relaxed border border-amber-500/20">
                      <strong>⏳ Exit Request Pending:</strong> Your exit request has been submitted and is awaiting admin review. You will see the decision here once it's processed.
                    </div>
                    {/* Show exit dispute messages from admin */}
                    {(() => {
                      const disputeMsgs = messages.filter(m => m.salonId === statusResult.id && m.context === 'exit-dispute');
                      if (disputeMsgs.length === 0) return null;
                      return (
                        <div className="rounded-xl border border-amber-500/20 bg-[#130f18]/60 p-4">
                          <p className="text-xs font-semibold text-[#e8d5a3] mb-3 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-[#c9a962]" /> Messages from Admin
                          </p>
                          <div className="space-y-2">
                            {disputeMsgs.map(m => (
                              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                                  m.sender === 'admin' ? 'bg-[#221c28] border border-amber-500/20 text-amber-200' : 'bg-[#c9a962] text-[#0f0d12]'
                                }`}>
                                  {m.decryptedContent || m.encryptedContent}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {statusResult.exitRequestStatus === 'rejected' && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-red-500/10 rounded-xl text-red-200 text-sm leading-relaxed border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <strong className="text-red-300">Exit Request Not Approved</strong>
                      </div>
                      {statusResult.exitRejectReason ? (
                        <div className="mt-2 p-3 bg-[#0f0d12]/60 rounded-lg border border-red-500/15">
                          <p className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wide mb-1">Admin's Reason:</p>
                          <p className="text-red-200 text-xs">{statusResult.exitRejectReason}</p>
                        </div>
                      ) : (
                        <p className="text-xs mt-1 text-red-300/70">No specific reason provided.</p>
                      )}
                    </div>

                    {/* Reply to admin about exit rejection */}
                    <div className="rounded-xl border border-[#c9a962]/20 bg-[#130f18]/60 p-4 space-y-3">
                      <p className="text-xs font-semibold text-[#e8d5a3] flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-[#c9a962]" /> Reply to Admin
                        <span className="ml-auto text-[9px] bg-[#c9a962]/10 text-[#9a8fa8] px-2 py-0.5 rounded-full">🔒 Encrypted</span>
                      </p>

                      {/* Existing exit dispute messages */}
                      {(() => {
                        const disputeMsgs = messages.filter(m => m.salonId === statusResult.id && m.context === 'exit-dispute');
                        if (disputeMsgs.length === 0) return null;
                        return (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {disputeMsgs.map(m => (
                              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                  m.sender === 'admin' ? 'bg-[#221c28] border border-[#c9a962]/15 text-[#e8d5a3]' : 'bg-[#c9a962] text-[#0f0d12]'
                                }`}>
                                  {m.decryptedContent || m.encryptedContent}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!exitReplyMsg.trim()) return;
                          setExitReplySending(true);
                          const ok = await sendDirectMessage(statusResult.id, exitReplyMsg.trim(), 'salon', 'exit-dispute');
                          if (ok) {
                            setExitReplyMsg('');
                            addToast('success', 'Reply sent to admin.');
                          } else {
                            addToast('error', 'Failed to send reply. Please try again.');
                          }
                          setExitReplySending(false);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          value={exitReplyMsg}
                          onChange={(e) => setExitReplyMsg(e.target.value)}
                          placeholder="Type your response to admin..."
                          className="luxe-input flex-1 text-sm"
                          style={{ fontSize: 16 }}
                          disabled={exitReplySending}
                        />
                        <button
                          type="submit"
                          disabled={!exitReplyMsg.trim() || exitReplySending}
                          className="luxe-btn px-4 disabled:opacity-50 flex items-center gap-1.5"
                          style={{ touchAction: 'manipulation', minHeight: 44 }}
                        >
                          {exitReplySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </form>
                    </div>

                    {/* Helpful info */}
                    <div className="p-3 bg-[#c9a962]/5 rounded-lg border border-[#c9a962]/15 text-xs text-[#9a8fa8]">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#c9a962] inline mr-1" />
                      You may still log in to your Salon Dashboard to continue operations, or contact admin for clarification.
                    </div>
                  </div>
                )}

                {statusResult.exitRequestStatus === 'approved' && (
                  <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl text-emerald-200 text-sm leading-relaxed border border-emerald-500/20">
                    <CheckCircle className="h-5 w-5 inline mr-2 text-emerald-400" />
                    <strong>Exit Approved:</strong> Your exit request has been approved by admin. Your salon has been deactivated from the platform. Thank you for being a Luxeluru partner.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exit' && (
        <form onSubmit={handleExitSubmit} className="luxe-card space-y-6 p-6 sm:p-8 animate-fade-in">
          <div className="border-b border-[#c9a962]/10 pb-4">
            <h3 className="font-display text-2xl text-[#e8d5a3]">Salon Exit Form</h3>
            <p className="text-xs text-[#9a8fa8] mt-1">Submit this form if you wish to remove your salon listing from the platform.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Your Salon ID</label>
              <input
                type="text"
                value={exitSalonId}
                onChange={(e) => setExitSalonId(e.target.value)}
                className="luxe-input"
                placeholder="e.g. LLANU569"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon Password</label>
              <input
                type="password"
                value={exitPassword}
                onChange={(e) => setExitPassword(e.target.value)}
                className="luxe-input"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Reason for Leaving (Compulsory)</label>
              <textarea
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="luxe-input min-h-[120px]"
                placeholder="Please state your reason for exiting the website..."
                required
              />
            </div>
          </div>

          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-300">
            <strong>WARNING:</strong> Exiting the platform is permanent. Your salon will be hidden from search listings, and active user bookings will be terminated.
          </div>

          {currentSalon?.exitRequestStatus === 'pending' && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-400 font-semibold text-center">
              Your exit request is pending approval by the Admin.
            </div>
          )}

          {(currentSalon?.commissionDue || 0) > 0 && currentSalon?.exitRequestStatus !== 'pending' && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-semibold text-center">
              You have outstanding commission dues of ₹{currentSalon!.commissionDue}. You must pay all dues before you can request to exit the platform.
            </div>
          )}

          <button 
            type="submit" 
            className="luxe-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSalon?.exitRequestStatus === 'pending' || (currentSalon?.commissionDue || 0) > 0}
          >
            Submit Exit Request & Deactivate
          </button>
        </form>
      )}


    </div>
  );
}

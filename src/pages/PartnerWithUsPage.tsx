import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, FileText, LogOut, Lock, Building, Search, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PartnerWithUsPage() {
  const { salonRegister, salonExit, adminLogin, salons, addToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'register' | 'exit' | 'admin' | 'status'>(
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

  // Exit state
  const [exitSalonId, setExitSalonId] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [exitPassword, setExitPassword] = useState('');

  // Admin state
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Status check state
  const [statusSearch, setStatusSearch] = useState('');
  const [statusResult, setStatusResult] = useState<any | null>(null);

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!ownerName || !salonName || !address || !email || !phone || !phoneOwner) {
      setError('Please fill in all contact and business details.');
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

    // Auto generate ID and return it
    const generatedId = await salonRegister({
      ownerName,
      name: salonName,
      address,
      email,
      phone,
      phoneOwner,
      tradeLicenseUrl: tradeLicenseFile.name,
    });

    setSuccessMsg(
      `Thank you for registering with Luxeluru! Your application has been received and is pending approval from the platform. We will verify your trade license and details within 5 days.

      YOUR AUTO-GENERATED SALON ID IS: ${generatedId}

      IMPORTANT: Please save this Salon ID. You will need it to search your application status and log in once approved!`
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

    const success = await salonExit(exitSalonId, exitReason);
    if (success) {
      addToast('success', 'Salon exited successfully.');
      setSuccessMsg(`Salon "${targetSalon.name}" (${exitSalonId}) has been successfully deactivated and removed from the Luxeluru platform.`);
      setExitSalonId('');
      setExitReason('');
      setExitPassword('');
    } else {
      setError('Failed to exit salon. Please check details.');
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!adminUser || !adminPass) {
      setError('Please enter both Admin username and password.');
      return;
    }

    const success = await adminLogin(adminUser, adminPass);
    if (success) {
      navigate('/admin-dashboard');
    } else {
      setError('Invalid Administrator Username or Password.');
    }
  }

  function handleStatusCheck(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatusResult(null);

    if (!statusSearch.trim()) {
      setError('Please enter your Salon Email or Salon ID to search.');
      return;
    }

    const found = salons.find(
      (s) =>
        s.id.toLowerCase().trim() === statusSearch.toLowerCase().trim() ||
        s.email.toLowerCase().trim() === statusSearch.toLowerCase().trim()
    );

    if (!found) {
      setError('No registered salon application found matching that ID or Email.');
      return;
    }

    setStatusResult(found);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl sm:text-5xl font-bold gold-gradient">Partner with Luxeluru</h1>
        <p className="mt-3 text-lg text-[#9a8fa8]">Grow your luxury salon brand or manage your existing association.</p>
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
          <button
            onClick={() => { setActiveTab('admin'); setError(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 pb-4 text-xs sm:text-base font-semibold border-b-2 transition ${
              activeTab === 'admin' ? 'border-[#c9a962] text-[#e8d5a3]' : 'border-transparent text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <Lock className="h-5 w-5" />
            Admin Login
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
                <strong>1. Salon Commission & Penalty:</strong> Salons are required to pay a 5% service charge to the platform on all completed appointments.
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
                placeholder="Enter Salon ID (e.g. LLANU569) or Registered Business Email"
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
                  <p className="text-xs text-[#9a8fa8] mt-0.5">Salon Code: <span className="font-mono font-semibold text-[#c9a962]">{statusResult.id}</span></p>
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
                
                {statusResult.registrationStatus === 'pending' && (
                  <div className="mt-4 p-4 bg-amber-500/10 rounded-lg text-amber-200 text-xs leading-relaxed border border-amber-500/20">
                    <strong>⏳ Under Review:</strong> Your salon registration details and Trade License are currently being verified by the administrator. Approval generally takes up to 5 business days. Please save your Salon ID (<span className="font-mono text-[#c9a962]">{statusResult.id}</span>) to log in once approval is complete.
                  </div>
                )}

                {statusResult.registrationStatus === 'approved' && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg text-green-200 text-xs leading-relaxed border border-green-500/20 space-y-2">
                    <p><strong>✅ Approved:</strong> Your application has been approved and activated! You are now live on the Luxeluru platform.</p>
                    <p className="pt-2">You can log in to the Salon Partner Portal from the Sign In page using the details below:</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-[#e8d5a3]">
                      <li><strong>Salon Name:</strong> {statusResult.name}</li>
                      <li><strong>Salon ID:</strong> {statusResult.id}</li>
                      <li><strong>Salon Email:</strong> {statusResult.email}</li>
                      <li><strong>Default Password:</strong> <span className="font-mono bg-[#0f0d12] px-1.5 py-0.5 rounded text-[#c9a962]">SALON@123</span></li>
                    </ul>
                  </div>
                )}

                {statusResult.registrationStatus === 'rejected' && (
                  <div className="mt-4 p-4 bg-red-500/10 rounded-lg text-red-200 text-xs leading-relaxed border border-red-500/20">
                    <strong>❌ Application Inactive:</strong> This application has been rejected or the salon has opted to exit the platform.
                    {statusResult.exitReason && (
                      <p className="mt-2"><strong>Deregistration Reason:</strong> {statusResult.exitReason}</p>
                    )}
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

          <button type="submit" className="luxe-btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10 w-full">
            Submit Exit Request & Deactivate
          </button>
        </form>
      )}

      {activeTab === 'admin' && (
        <form onSubmit={handleAdminSubmit} className="luxe-card space-y-6 p-6 sm:p-8 max-w-md mx-auto animate-fade-in">
          <div className="border-b border-[#c9a962]/10 pb-4 text-center">
            <Lock className="h-8 w-8 text-[#c9a962] mx-auto mb-2" />
            <h3 className="font-display text-2xl text-[#e8d5a3]">Admin Portal Login</h3>
            <p className="text-xs text-[#9a8fa8] mt-1">Authorized personnel only.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Username</label>
              <input
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="luxe-input"
                placeholder=""
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[#9a8fa8]">Password</label>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="luxe-input"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="luxe-btn w-full">
            Log In as Admin
          </button>
        </form>
      )}
    </div>
  );
}

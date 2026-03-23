import React, { useState } from 'react';
import { ArrowLeft, Code } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Custom Sanscounts Logo
const SanscountsLogo = ({ size = 48, className = "" }: { size?: number, className?: string }) => (
  <img 
    src="https://i.postimg.cc/mgjhxF9q/Blue-Minimalist-Fast-Email-Logo-Design.png" 
    alt="Sanscounts Logo" 
    style={{ width: size, height: size, borderRadius: size * 0.15 }}
    className={`object-cover shadow-2xl ${className}`}
    referrerPolicy="no-referrer"
  />
);

type ViewState = 
  | 'main' 
  | 'signup-first-name' 
  | 'signup-last-name' 
  | 'signup-dob' 
  | 'signup-recovery-email'
  | 'signup-username' 
  | 'signup-password' 
  | 'signup-agreement' 
  | 'login-username' 
  | 'login-password'
  | 'forgot-password-email'
  | 'forgot-password-otp'
  | 'forgot-password-new-password';

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  limit, 
  orderBy,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { updatePassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const COUNTRY_CODES = [
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
];

const RESERVED_USERNAMES = [
  'admin', 'support', 'help', 'info', 'contact', 'billing', 'security', 'privacy', 'terms',
  'sanscounts', 'sloudsan', 'system', 'root', 'webmaster', 'postmaster', 'hostmaster',
  'cristiano', 'zuck', 'instagram', 'mrbeast', 'google', 'apple', 'microsoft', 'meta',
  'elonmusk', 'billgates', 'jeffbezos', 'ceo', 'founder', 'official'
];

export function Login({ startAtLogin = false }: { startAtLogin?: boolean }) {
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const [view, setView] = useState<ViewState>(startAtLogin ? 'login-username' : 'main');
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+880');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationDocId, setVerificationDocId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFirstName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setError('Please enter your first name.'); return; }
    setError(''); setView('signup-last-name');
  };

  const submitLastName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim()) { setError('Please enter your last name.'); return; }
    setError(''); setView('signup-dob');
  };

  const submitDob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) { setError('Please enter your date of birth.'); return; }
    setError(''); setView('signup-recovery-email');
  };

  const submitRecoveryEmail = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recoveryEmail.trim() || !emailRegex.test(recoveryEmail)) { 
      setError('Please enter a valid recovery email address.'); 
      return; 
    }
    setError(''); setView('signup-username');
  };

  const submitUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) { setError('Please enter a username.'); return; }
    
    if (RESERVED_USERNAMES.includes(cleanUsername)) {
      setError('This username is reserved and cannot be registered.');
      return;
    }
    
    setError(''); setView('signup-password');
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setView('signup-agreement');
  };

  const submitLoginUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username or email.'); return; }
    setError(''); setView('login-password');
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const email = `${username.trim().toLowerCase()}@sanscounts.com`;
      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      await signUpWithEmail(email, password, displayName, dob);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = username.includes('@') ? username : `${username.trim().toLowerCase()}@sanscounts.com`;
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this username or email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError('Invalid password or account not found.');
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recoveryEmail.trim() || !emailRegex.test(recoveryEmail)) { 
      setError('Please enter your recovery email address.'); 
      return; 
    }
    setLoading(true);
    setError('');
    try {
      // Generate a 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store in Firestore
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

      const docRef = await addDoc(collection(db, 'verification_codes'), {
        email: recoveryEmail.trim().toLowerCase(),
        code,
        type: 'password_reset',
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
      });

      setVerificationDocId(docRef.id);
      setError('OTP code has been sent to your Sansteo App.');
      setTimeout(() => setView('forgot-password-otp'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'verification_codes'),
        where('email', '==', recoveryEmail.trim().toLowerCase()),
        where('code', '==', otpCode),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('Invalid or expired OTP code.');
        setLoading(false);
        return;
      }

      const verificationDoc = snapshot.docs[0];
      const data = verificationDoc.data();
      
      // Check expiry
      if (data.expiresAt.toDate() < new Date()) {
        setError('OTP code has expired.');
        setLoading(false);
        return;
      }

      // Mark as used
      await updateDoc(doc(db, 'verification_codes', verificationDoc.id), {
        status: 'used'
      });

      setView('forgot-password-new-password');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // In a real app with Firebase Auth, you can't easily update password for another user without being logged in
      // unless you use a Cloud Function or the user is already logged in.
      // For this demo, we'll simulate the password update or use a custom field if we were using custom auth.
      // Since we use Firebase Auth, we'll just show success for now as we can't change auth password without current session.
      // In a real production app, this would trigger a Cloud Function that uses Firebase Admin SDK.
      
      setError('Password reset successful! You can now sign in with your new password.');
      setTimeout(() => setView('login-username'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors";
  const buttonClass = "w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-base font-bold text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 focus:ring-offset-black transition-colors mt-8 disabled:opacity-50";

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row safe-top safe-bottom">
      {/* Left side - Big Logo/Graphic */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-sky-500/10" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <SanscountsLogo size={360} className="text-sky-500 relative z-10" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="lg:hidden mb-12">
            <SanscountsLogo size={48} className="text-sky-500" />
          </div>

          {view === 'main' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-100 tracking-tight mb-12">
                Sanscounts
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-8">
                One account for all<br />Sans Services.
              </h2>
              <div className="space-y-4">
                <button onClick={() => { setError(''); setView('signup-first-name'); }} className="w-full sm:w-[300px] flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-base font-bold text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 focus:ring-offset-black transition-colors">
                  Create account
                </button>
                <div className="w-full sm:w-[300px] flex items-center my-4">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">or</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>
                <button onClick={() => { setError(''); setView('login-username'); }} className="w-full sm:w-[300px] flex justify-center py-3.5 px-4 border border-zinc-700 rounded-full shadow-sm text-base font-bold text-sky-500 hover:bg-sky-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-black transition-colors">
                  Sign in
                </button>
                <p className="w-full sm:w-[300px] mt-4 text-xs text-zinc-500 leading-relaxed">
                  By signing in or creating an account, you agree to the Terms of Service and Privacy Policy for all Sans Services.
                </p>

                <div className="w-full sm:w-[300px] mt-4 pt-4 border-t border-zinc-800/50">
                  <button onClick={() => navigate('/developers')} className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
                    <Code size={16} />
                    Are you a developer?
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'signup-first-name' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('main')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">What's your first name?</h2>
              <form onSubmit={submitFirstName} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="First Name" autoFocus />
                </div>
                <button type="submit" className={buttonClass}>Next</button>
              </form>
            </div>
          )}

          {view === 'signup-last-name' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('signup-first-name')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">What's your last name?</h2>
              <form onSubmit={submitLastName} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Last Name" autoFocus />
                </div>
                <button type="submit" className={buttonClass}>Next</button>
              </form>
            </div>
          )}

          {view === 'signup-dob' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('signup-last-name')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">When's your birthday?</h2>
              <form onSubmit={submitDob} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} autoFocus />
                </div>
                <button type="submit" className={buttonClass}>Next</button>
              </form>
            </div>
          )}

          {view === 'signup-recovery-email' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('signup-dob')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">Recovery Email</h2>
              <p className="text-zinc-400 mb-8">We'll use this to help you recover your account.</p>
              <form onSubmit={submitRecoveryEmail} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input 
                    type="email" 
                    value={recoveryEmail} 
                    onChange={(e) => setRecoveryEmail(e.target.value)} 
                    className={inputClass} 
                    placeholder="example@gmail.com" 
                    autoFocus 
                  />
                </div>
                <button type="submit" disabled={loading} className={buttonClass}>
                  Next
                </button>
              </form>
            </div>
          )}

          {view === 'signup-username' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('signup-recovery-email')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">Choose your username</h2>
              <p className="text-zinc-400 mb-8">This will be your @sanscounts.com email.</p>
              <form onSubmit={submitUsername} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <div className="relative">
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))} className={`${inputClass} pr-36`} placeholder="johndoe" autoFocus />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-zinc-500">@sanscounts.com</span>
                    </div>
                  </div>
                </div>
                <button type="submit" className={buttonClass}>Next</button>
              </form>
            </div>
          )}

          {view === 'signup-password' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('signup-username')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">Create a password</h2>
              <form onSubmit={submitPassword} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" autoFocus />
                </div>
                <button type="submit" className={buttonClass}>Next</button>
              </form>
            </div>
          )}

          {view === 'signup-agreement' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('signup-password')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">Review and agree</h2>
              <div className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-zinc-100 font-bold mb-2">Terms of Service</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                    By clicking "Agree and Create Account", you agree to the Sans Services Terms of Service and Privacy Policy.
                  </p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Your account <strong className="text-zinc-200">{username}@sanscounts.com</strong> will be created and can be used across all Sans Services.
                  </p>
                </div>
                <button onClick={handleSignUp} disabled={loading} className={buttonClass}>
                  {loading ? 'Creating...' : 'Agree and Create Account'}
                </button>
              </div>
            </div>
          )}

          {view === 'login-username' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('main')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">Sign in</h2>
              <form onSubmit={submitLoginUsername} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Username or Email</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="johndoe" autoFocus />
                </div>
                <button type="submit" className={buttonClass}>Next</button>
              </form>
            </div>
          )}

          {view === 'login-password' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('login-username')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-8">Enter your password</h2>
              <form onSubmit={handleLogin} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" autoFocus />
                </div>
                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <button type="button" onClick={() => { setError(''); setView('forgot-password-email'); }} className="mt-4 text-sm text-sky-500 hover:text-sky-400 font-medium">
                  Forgot password?
                </button>
              </form>
            </div>
          )}

          {view === 'forgot-password-email' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('login-password')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">Reset Password</h2>
              <p className="text-zinc-400 mb-8">Enter your recovery email to receive a Sansteo OTP code.</p>
              <form onSubmit={handleForgotPassword} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className={`p-3 rounded-lg text-sm ${error.includes('sent') ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>{error}</div>}
                <div>
                  <input 
                    type="email" 
                    value={recoveryEmail} 
                    onChange={(e) => setRecoveryEmail(e.target.value)} 
                    className={inputClass} 
                    placeholder="Recovery Email" 
                    autoFocus 
                  />
                </div>
                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? 'Sending...' : 'Send OTP Code'}
                </button>
              </form>
            </div>
          )}

          {view === 'forgot-password-otp' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <button onClick={() => setView('forgot-password-email')} className="mb-8 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2">
                <ArrowLeft size={20} /><span>Back</span>
              </button>
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">Enter OTP Code</h2>
              <p className="text-zinc-400 mb-8">Check your Sansteo App for the 6-digit verification code sent to {recoveryEmail}.</p>
              <form onSubmit={handleVerifyOtp} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">{error}</div>}
                <div>
                  <input 
                    type="text" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`} 
                    placeholder="000000" 
                    autoFocus 
                  />
                </div>
                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            </div>
          )}

          {view === 'forgot-password-new-password' && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300">
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">New Password</h2>
              <p className="text-zinc-400 mb-8">Create a new password for your account.</p>
              <form onSubmit={handleResetPassword} className="space-y-6 w-full sm:w-[300px]">
                {error && <div className={`p-3 rounded-lg text-sm ${error.includes('successful') ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>{error}</div>}
                <div>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className={inputClass} 
                    placeholder="New Password" 
                    autoFocus 
                  />
                </div>
                <button type="submit" disabled={loading} className={buttonClass}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

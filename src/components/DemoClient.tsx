import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, LogOut, ArrowRight, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DemoClient() {
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testApp, setTestApp] = useState('sansncar');
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log("DemoClient: handleLogin triggered");
    alert("Sign in with Sanscounts button clicked! Opening popup...");
    setError(null);
    setLoading(true);
    
    const clientId = `${testApp}-client-id`;
    const redirectUri = encodeURIComponent(`${window.location.origin}/demo-client`);
    
    // Open the Sanscounts authorization popup
    const authUrl = `/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    console.log("DemoClient: Opening popup with URL:", authUrl);
    const popup = window.open(authUrl, 'SanscountsLogin', 'width=500,height=700');

    if (!popup) {
      console.error("DemoClient: Popup blocked");
      setError("পপআপ ব্লক করা হয়েছে! দয়া করে ব্রাউজারের পপআপ অ্যালাউ করুন।");
      setLoading(false);
      return;
    }

    const messageListener = (event: MessageEvent) => {
      console.log("DemoClient: Received message event:", event.data);
      if (event.data?.type === 'SANSCOUNTS_AUTH_SUCCESS') {
        console.log("DemoClient: Auth success received, payload:", event.data.payload);
        window.removeEventListener('message', messageListener);
        setUserData(event.data.payload);
        setLoading(false);
      }
    };

    window.addEventListener('message', messageListener);

    // Handle popup closed by user manually
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        console.log("DemoClient: Popup closed by user");
        clearInterval(checkPopup);
        setLoading(false);
        window.removeEventListener('message', messageListener);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Demo Client</span>
          <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">Testing</span>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
        >
          Back to Sanscounts <ArrowRight size={16} />
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {!userData ? (
            <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Test Integration</h1>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                Verify that Sanscounts Auth is working properly before going paid.
              </p>

              {/* App Selector */}
              <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-left">
                <label className="block text-sm font-bold text-zinc-700 mb-3">Select App to Test:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['sansncar', 'sansnsea', 'sansmap'].map(app => (
                    <button
                      key={app}
                      onClick={() => setTestApp(app)}
                      className={`py-2 px-2 rounded-xl text-sm font-bold transition-colors ${
                        testApp === app 
                          ? 'bg-emerald-500 text-white shadow-md' 
                          : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {app.replace('sans', 'Sans ')}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-zinc-100 rounded-xl flex items-center gap-2">
                  <Code size={16} className="text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Client ID</span>
                    <span className="font-mono text-sm text-zinc-800">{testApp}-client-id</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-black hover:bg-zinc-800 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <div className="w-6 h-6 bg-sky-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs font-black">S</span>
                    </div>
                    Sign in with Sanscounts
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                  <UserIcon className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900">Login Successful!</h2>
                <p className="text-emerald-600 font-medium mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck size={18} /> Authenticated via Sanscounts
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 mb-8 space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</label>
                  <p className="font-medium text-zinc-900">{userData.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                  <p className="font-medium text-zinc-900">{userData.email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sanscounts ID</label>
                  <p className="font-mono text-sm text-zinc-600 break-all">{userData.userId}</p>
                </div>
              </div>

              <button
                onClick={() => setUserData(null)}
                className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-3.5 px-6 rounded-xl font-bold transition-colors"
              >
                <LogOut size={18} />
                Sign Out & Test Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

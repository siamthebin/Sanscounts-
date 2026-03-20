import React, { useState } from 'react';
import { Code, Key, CreditCard, CheckCircle2, ArrowLeft, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function DeveloperPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/?startAtLogin=true');
      return;
    }
    
    setLoading(true);
    // In a real implementation, this would call your backend to create a Stripe Checkout session
    // For now, we'll simulate the loading state and show an alert
    setTimeout(() => {
      setLoading(false);
      alert("Stripe Payment Integration Required: To actually charge $2.99, you need to add your Stripe Secret Key to the environment variables. Once added, this button will redirect developers to the Stripe Checkout page.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-sky-500/30">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="https://i.postimg.cc/mgjhxF9q/Blue-Minimalist-Fast-Email-Logo-Design.png" 
              alt="Sanscounts Logo" 
              className="w-8 h-8 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-xl tracking-tight">Sanscounts <span className="text-sky-500">Developers</span></span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Add <span className="text-sky-500">Sign in with Sanscounts</span><br />to your app.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Secure, fast, and seamless authentication for your users. Get your API keys instantly and integrate with just a few lines of code.
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          
          {/* Code Example */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-800">
              <Terminal size={18} className="text-zinc-500" />
              <span className="text-sm font-mono text-zinc-400">integration.js</span>
            </div>
            <pre className="text-sm font-mono text-zinc-300 overflow-x-auto">
              <code>
<span className="text-sky-400">const</span> authUrl = <span className="text-emerald-400">`https://sanscounts.sansloud.com/oauth/authorize?client_id=YOUR_CLIENT_ID`</span>;{'\n\n'}
<span className="text-zinc-500">// Open the Sanscounts login popup</span>{'\n'}
<span className="text-sky-400">const</span> popup = window.<span className="text-yellow-200">open</span>(authUrl, <span className="text-emerald-400">'Login'</span>);{'\n\n'}
<span className="text-zinc-500">// Listen for the success message</span>{'\n'}
window.<span className="text-yellow-200">addEventListener</span>(<span className="text-emerald-400">'message'</span>, (event) {`=>`} {'{\n'}
{'  '}<span className="text-sky-400">if</span> (event.data.type === <span className="text-emerald-400">'SANSCOUNTS_AUTH_SUCCESS'</span>) {'{\n'}
{'    '}<span className="text-sky-400">const</span> user = event.data.payload;{'\n'}
{'    '}console.<span className="text-yellow-200">log</span>(<span className="text-emerald-400">"Logged in as:"</span>, user.name);{'\n'}
{'  }\n'}
{'}'});
              </code>
            </pre>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600"></div>
            
            <h2 className="text-2xl font-bold mb-2">Developer License</h2>
            <p className="text-zinc-400 mb-6">Everything you need to integrate Sanscounts Auth into your production applications.</p>
            
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-5xl font-extrabold">$2.99</span>
              <span className="text-zinc-500 font-medium">/ per app</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-sky-500 shrink-0" />
                <span className="text-zinc-300">1 Production Client ID & Secret</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-sky-500 shrink-0" />
                <span className="text-zinc-300">Unlimited user authentications</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-sky-500 shrink-0" />
                <span className="text-zinc-300">Access to user email & basic profile</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-sky-500 shrink-0" />
                <span className="text-zinc-300">Developer Dashboard access</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-sky-500 shrink-0" />
                <span className="text-zinc-300">Domain verification & custom branding</span>
              </li>
            </ul>

            <button 
              onClick={() => {
                if (!user) {
                  navigate('/?startAtLogin=true');
                } else {
                  navigate('/developers/dashboard');
                }
              }}
              className="w-full py-4 px-6 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {user ? 'Go to Developer Dashboard' : 'Sign in to Get Started'}
            </button>
            <p className="text-center text-xs text-zinc-500 mt-4">Secured by Stripe</p>
          </div>

        </div>
      </div>
    </div>
  );
}

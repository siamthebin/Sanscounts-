import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Key, Globe, Copy, CheckCircle2, CreditCard, Shield, Trash2, X, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

interface DeveloperApp {
  id: string;
  appName: string;
  appUrl: string;
  clientId: string;
  clientSecret: string;
  createdAt: any;
}

export function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  
  // New App Form State
  const [newAppName, setNewAppName] = useState('');
  const [newAppUrl, setNewAppUrl] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'apps' | 'domains'>('apps');
  const [domains, setDomains] = useState<{id: string, domain: string, status: string}[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<{id: string, domain: string} | null>(null);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);

  const isOwner = user?.email?.toLowerCase() === 'sanscounts@sanscounts.com' || user?.email?.toLowerCase() === 'sloudsan@gmail.com';

  useEffect(() => {
    if (!user) {
      navigate('/?startAtLogin=true');
      return;
    }
    fetchApps();
    fetchDomains();
  }, [user, navigate]);

  const fetchDomains = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'developer_domains'), where('developerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedDomains: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedDomains.push({ id: doc.id, ...doc.data() });
      });
      setDomains(fetchedDomains);
    } catch (err) {
      console.error("Error fetching domains:", err);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDomain.trim()) return;
    
    setIsAddingDomain(true);
    try {
      const domainData = {
        developerId: user.uid,
        domain: newDomain.trim().toLowerCase(),
        status: 'pending',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'developer_domains'), domainData);
      setDomains([...domains, { id: docRef.id, ...domainData } as any]);
      setNewDomain('');
    } catch (err) {
      console.error("Error adding domain:", err);
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = (domain: {id: string, domain: string}) => {
    setVerifyingDomain(domain);
  };

  const confirmVerification = async () => {
    if (!verifyingDomain) return;
    // In a real app, this would trigger a background check
    alert("Verification request submitted! Our system will check your DNS records. This usually takes 24-48 hours.");
    setVerifyingDomain(null);
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!window.confirm("Are you sure you want to remove this domain?")) return;
    try {
      await deleteDoc(doc(db, 'developer_domains', domainId));
      setDomains(domains.filter(d => d.id !== domainId));
    } catch (err) {
      console.error("Error deleting domain:", err);
    }
  };

  const fetchApps = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'developer_apps'), where('developerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedApps: DeveloperApp[] = [];
      querySnapshot.forEach((doc) => {
        fetchedApps.push({ id: doc.id, ...doc.data() } as DeveloperApp);
      });
      setApps(fetchedApps);
    } catch (err) {
      console.error("Error fetching apps:", err);
      // If permission denied or collection doesn't exist, we just show empty list
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newAppName.trim() || !newAppUrl.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsProcessingPayment(true);

    // Simulate Stripe Checkout / Payment Processing
    setTimeout(async () => {
      try {
        // Generate credentials
        const randomString = Math.random().toString(36).substring(2, 15);
        const clientId = `${newAppName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${randomString}-client-id`;
        const clientSecret = `sec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        const newApp = {
          developerId: user.uid,
          appName: newAppName,
          appUrl: newAppUrl,
          clientId,
          clientSecret,
          createdAt: serverTimestamp(),
          paymentStatus: 'paid_2.99'
        };

        const docRef = await addDoc(collection(db, 'developer_apps'), newApp);
        
        setApps([...apps, { id: docRef.id, ...newApp }]);
        setShowNewAppModal(false);
        setNewAppName('');
        setNewAppUrl('');
      } catch (err) {
        console.error("Error creating app:", err);
        setError('Failed to create app. Please check your permissions or try again later.');
      } finally {
        setIsProcessingPayment(false);
      }
    }, 2000);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm("Are you sure you want to delete this app? This will break authentication for all users of this app. This action cannot be undone.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'developer_apps', appId));
      setApps(apps.filter(app => app.id !== appId));
    } catch (err) {
      console.error("Error deleting app:", err);
      alert("Failed to delete app.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-sky-500/30">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/developers')}>
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-black font-bold">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">Developer <span className="text-sky-500">Dashboard</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Logged in as</p>
              <p className="text-sm font-bold text-zinc-200">{user?.email}</p>
            </div>
            <button 
              onClick={() => navigate('/developers')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Portal
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Developer Dashboard</h1>
            <p className="text-zinc-400">Manage your applications, API keys, and verified domains.</p>
          </div>
          
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
            <button 
              onClick={() => setActiveTab('apps')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'apps' ? 'bg-sky-500 text-black shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Applications
            </button>
            <button 
              onClick={() => setActiveTab('domains')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'domains' ? 'bg-sky-500 text-black shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Domains
            </button>
          </div>
        </div>

        {isOwner && (
          <div className="mb-12 bg-gradient-to-r from-sky-500/10 to-blue-600/10 border border-sky-500/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-sky-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Owner View</div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-black shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Go Live: sanscounts.sansloud.com</h2>
                <p className="text-zinc-400 mb-6 max-w-2xl">
                  Follow these steps to deploy your Sanscounts instance to your custom domain and make it accessible to the world.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <h3 className="font-bold text-sm">DNS Configuration</h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Go to your domain provider (Cloudflare/GoDaddy) and point <code className="text-sky-400">sanscounts.sansloud.com</code> to this App's IP or CNAME.
                    </p>
                  </div>
                  
                  <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <h3 className="font-bold text-sm">Environment Setup</h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      In AI Studio Settings, set <code className="text-sky-400">APP_URL</code> to <code className="text-white">https://sanscounts.sansloud.com</code>.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <h3 className="font-bold text-sm">Domain Verification</h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Add <code className="text-sky-400">sansloud.com</code> in the Domains tab below and complete the TXT record verification.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <h3 className="font-bold text-sm">Deploy & Share</h3>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Click the "Share" button in AI Studio and select "Deploy to Cloud Run" to finalize the live deployment.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')}
                  className="text-sm font-bold text-sky-500 hover:text-sky-400 transition-colors flex items-center gap-2"
                >
                  View Deployment Documentation <ArrowLeft size={14} className="rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apps' ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Your Applications</h2>
              <button
                onClick={() => setShowNewAppModal(true)}
                className="py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Register New App
              </button>
            </div>

            {apps.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-zinc-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">No applications yet</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-6">
                  Register your first application to get your Client ID and Secret. Each application registration costs a one-time fee of $2.99.
                </p>
                <button
                  onClick={() => setShowNewAppModal(true)}
                  className="py-2.5 px-6 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Register App ($2.99)
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {apps.map((app) => (
                  <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{app.appName}</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Globe size={14} />
                          {app.appUrl}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteApp(app.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete App"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Client ID</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-sky-400 font-mono">
                            {app.clientId}
                          </code>
                          <button 
                            onClick={() => handleCopy(app.clientId, `client-${app.id}`)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300"
                          >
                            {copiedId === `client-${app.id}` ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Client Secret</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono">
                            {app.clientSecret}
                          </code>
                          <button 
                            onClick={() => handleCopy(app.clientSecret, `secret-${app.id}`)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300"
                          >
                            {copiedId === `secret-${app.id}` ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Verified Domains</h2>
              <form onSubmit={handleAddDomain} className="flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={isAddingDomain}
                  className="py-2 px-4 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isAddingDomain ? 'Adding...' : 'Add Domain'}
                </button>
              </form>
            </div>

            {/* Special Panel for sanscounts.sansloud.com */}
            {isOwner && (
              <div className="mb-8 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Live Domain Setup</div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Connect sanscounts.sansloud.com</h3>
                    <p className="text-zinc-400 mb-6 max-w-2xl leading-relaxed">
                      To make your app live on your custom domain, you need to configure your DNS settings at your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy).
                    </p>
                    
                    <div className="bg-black/50 border border-zinc-800 rounded-2xl p-6 mb-6">
                      <h4 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Step 1: Add DNS Record</h4>
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Name / Host</div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Value / Target</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                        <div className="text-sm font-mono text-emerald-400">CNAME</div>
                        <div className="text-sm font-mono text-zinc-300">sanscounts</div>
                        <div className="text-sm font-mono text-zinc-400 break-all">ghs.googlehosted.com</div>
                      </div>
                      <p className="text-xs text-zinc-500 mt-3">
                        * Note: If you deploy via Cloud Run, the target value might be different. Follow the Cloud Run Custom Domains guide.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          alert("To complete the connection, please ensure you have added the CNAME record in your domain registrar's DNS settings. DNS propagation may take up to 24 hours.");
                        }}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
                      >
                        Verify DNS Connection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {domains.length === 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-12 text-center">
                <Globe className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No domains added</h2>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Add your domains to verify ownership and enable custom branding for your OAuth screens.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${domain.status === 'verified' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
                      <div>
                        <h3 className="font-bold text-lg">{domain.domain}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{domain.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {domain.status !== 'verified' && (
                        <button 
                          onClick={() => handleVerifyDomain(domain)}
                          className="text-xs font-bold py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                        >
                          Verify Ownership
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteDomain(domain.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Verification Modal */}
      {verifyingDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Verify Domain Ownership</h2>
              <button onClick={() => setVerifyingDomain(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <p className="text-zinc-400 mb-6">
                To verify that you own <span className="text-white font-bold">{verifyingDomain.domain}</span>, please choose <strong className="text-sky-400">ONE</strong> of the following methods to prove ownership.
              </p>

              <div className="space-y-8">
                {/* Option 1: TXT Record */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-sky-500"></div>
                  <h3 className="text-lg font-bold text-white mb-2">Option 1: Add a TXT Record (Recommended)</h3>
                  <p className="text-sm text-zinc-400 mb-4">Add this TXT record to your domain's DNS settings.</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Host / Name</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Value</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                    <div className="text-sm font-mono text-sky-400">TXT</div>
                    <div className="text-sm font-mono text-zinc-300">@ <span className="text-zinc-600 text-xs">(or leave blank)</span></div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <code className="text-xs font-mono text-zinc-400 truncate">sanscounts-verify={verifyingDomain.id}</code>
                      <button 
                        onClick={() => handleCopy(`sanscounts-verify=${verifyingDomain.id}`, 'txt-record')}
                        className="shrink-0 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                      >
                        {copiedId === 'txt-record' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option 2: CNAME Record */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h3 className="text-lg font-bold text-white mb-2">Option 2: Add a CNAME Record</h3>
                  <p className="text-sm text-zinc-400 mb-4">Alternatively, add this CNAME record to your DNS settings.</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Host / Name</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Value / Target</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                    <div className="text-sm font-mono text-emerald-400">CNAME</div>
                    <div className="text-sm font-mono text-zinc-300 truncate">sanscounts-verify</div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <code className="text-xs font-mono text-zinc-400 truncate">verify.sanscounts.com</code>
                      <button 
                        onClick={() => handleCopy('verify.sanscounts.com', 'cname-record')}
                        className="shrink-0 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                      >
                        {copiedId === 'cname-record' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option 3: HTML Meta Tag */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <h3 className="text-lg font-bold text-white mb-2">Option 3: HTML Meta Tag</h3>
                  <p className="text-sm text-zinc-400 mb-4">Add this meta tag to the <code className="text-zinc-300 bg-zinc-800 px-1 rounded">&lt;head&gt;</code> section of your website's home page.</p>
                  
                  <div className="flex items-center gap-2 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                    <code className="text-xs font-mono text-zinc-400 truncate flex-1">
                      &lt;meta name="sanscounts-verification" content="{verifyingDomain.id}" /&gt;
                    </code>
                    <button 
                      onClick={() => handleCopy(`<meta name="sanscounts-verification" content="${verifyingDomain.id}" />`, 'meta-tag')}
                      className="shrink-0 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                    >
                      {copiedId === 'meta-tag' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <AlertOctagon size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    DNS changes can take up to 24-48 hours to propagate globally. Once you've completed ONE of the methods above, click the button below to notify our system.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button
                  onClick={() => setVerifyingDomain(null)}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={confirmVerification}
                  className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors"
                >
                  I've completed verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New App Modal */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold">Register New Application</h2>
              <p className="text-sm text-zinc-400 mt-1">Get your API keys to integrate Sanscounts Auth.</p>
            </div>
            
            <form onSubmit={handleCreateApp} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Application Name</label>
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Sansncar"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Application URL (Redirect URI)</label>
                <input
                  type="url"
                  value={newAppUrl}
                  onChange={(e) => setNewAppUrl(e.target.value)}
                  placeholder="https://your-app.com"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  required
                />
                <p className="text-xs text-zinc-500 mt-2">This is where users will be redirected after successful login.</p>
              </div>

              <div className="bg-black/50 border border-sky-500/20 rounded-xl p-4 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-zinc-300">Registration Fee</span>
                  <span className="text-lg font-bold text-white">$2.99</span>
                </div>
                <p className="text-xs text-zinc-500">One-time payment per application. Includes unlimited authentications.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isProcessingPayment ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay $2.99
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

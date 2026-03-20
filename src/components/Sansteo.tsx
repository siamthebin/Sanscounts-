import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export function Sansteo() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const userEmail = user.email.toLowerCase();
    const q = query(
      collection(db, 'verification_codes'),
      where('email', '==', userEmail),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCodes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCodes(newCodes);
      setLoading(false);
    }, (error) => {
      console.error("Sansteo OTP Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isExpired = (expiresAt: any) => {
    if (!expiresAt) return true;
    const expiry = expiresAt instanceof Timestamp ? expiresAt.toDate() : new Date(expiresAt);
    return expiry < new Date();
  };

  return (
    <div className="flex-1 bg-black p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="text-black" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Sansteo OTP</h1>
            <p className="text-zinc-500">Real-time security verification codes</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="text-sky-500 animate-spin" size={32} />
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
              <Shield className="text-zinc-700 mx-auto mb-4" size={48} />
              <h3 className="text-zinc-100 font-bold text-lg mb-2">No active codes</h3>
              <p className="text-zinc-500">When you request a verification code from Sanscounts, it will appear here in real-time.</p>
            </div>
          ) : (
            codes.map((code) => {
              const expired = isExpired(code.expiresAt);
              const used = code.status === 'used';
              
              return (
                <div 
                  key={code.id} 
                  className={`bg-zinc-900 border ${expired || used ? 'border-zinc-800 opacity-60' : 'border-sky-500/30 shadow-lg shadow-sky-500/5'} rounded-2xl p-6 transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded">
                          {code.type.replace('_', ' ')}
                        </span>
                        {used && (
                          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                            <CheckCircle size={10} /> Used
                          </span>
                        )}
                        {expired && !used && (
                          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                            <AlertCircle size={10} /> Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">For: {code.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                        <Clock size={12} />
                        <span>Generated at {formatTime(code.createdAt)}</span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        Expires at {formatTime(code.expiresAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 rounded-xl p-4 border border-zinc-800">
                    <div className="text-4xl font-mono font-bold tracking-[0.3em] text-zinc-100">
                      {code.code}
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(code.code)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-bold rounded-lg transition-colors"
                      disabled={expired || used}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12 p-6 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
          <h3 className="text-sky-500 font-bold mb-2 flex items-center gap-2">
            <Shield size={18} />
            How it works
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Sansteo OTP is an internal verification system for Sanscounts. Instead of waiting for an email or SMS, 
            security codes are delivered directly to your Sansteo dashboard. This is faster, more secure, and completely free.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export function Authorize() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const state = searchParams.get('state');

  const [clientName, setClientName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      console.log("Authorize: fetchClient triggered for clientId:", clientId);
      if (!clientId || !redirectUri || responseType !== 'code') {
        console.error("Authorize: Invalid parameters:", { clientId, redirectUri, responseType });
        setError('Invalid authorization request. Missing or invalid parameters.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/oauth/client?client_id=${clientId}`);
        if (!res.ok) {
          console.error("Authorize: Client fetch failed with status:", res.status);
          throw new Error('Client not found');
        }
        const data = await res.json();
        console.log("Authorize: Client fetched successfully:", data.name);
        setClientName(data.name);
      } catch (err) {
        console.error("Authorize: Error fetching client:", err);
        setError('Invalid or unregistered client application.');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId, redirectUri, responseType]);

  // If the user is not logged in, show the login screen.
  // Once they log in, they will see this consent screen.
  if (!user) {
    return <Login startAtLogin={true} />;
  }

  const handleAllow = async () => {
    console.log("Authorize: handleAllow triggered");
    setAuthorizing(true);
    try {
      console.log("Authorize: Requesting authorization code for user:", user.uid);
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          user_id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Authorize: API error:", errorData);
        throw new Error('Failed to generate authorization code');
      }

      const data = await res.json();
      console.log("Authorize: Received auth code:", data.code);
      
      // Easy Mode: If opened in a popup, send data directly via postMessage and close
      if (window.opener) {
        console.log("Authorize: Sending postMessage to opener");
        window.opener.postMessage({
          type: 'SANSCOUNTS_AUTH_SUCCESS',
          payload: {
            userId: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            code: data.code
          }
        }, '*'); // Sends data back to the app that opened the popup
        window.close();
        return;
      }

      // Fallback: Redirect back to the third-party app with the code
      console.log("Authorize: Redirecting to:", redirectUri);
      const redirectUrl = new URL(redirectUri!);
      redirectUrl.searchParams.append('code', data.code);
      if (state) {
        redirectUrl.searchParams.append('state', state);
      }
      
      window.location.href = redirectUrl.toString();
    } catch (err) {
      console.error("Authorize: Error in handleAllow:", err);
      setError('An error occurred during authorization.');
      setAuthorizing(false);
    }
  };

  const handleDeny = () => {
    console.log("Authorize: handleDeny triggered");
    if (redirectUri) {
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.append('error', 'access_denied');
      if (state) {
        redirectUrl.searchParams.append('state', state);
      }
      window.location.href = redirectUrl.toString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Authorization Error</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="https://i.postimg.cc/mgjhxF9q/Blue-Minimalist-Fast-Email-Logo-Design.png" 
              alt="Sanscounts Logo" 
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-zinc-800"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            Select an Sanscount
          </h2>
          <p className="text-zinc-400">
            to continue to <strong className="text-zinc-200">{clientName}</strong>
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {/* Account Card (Clickable) */}
          <button 
            onClick={handleAllow}
            disabled={authorizing}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden shrink-0 group-hover:ring-2 ring-sky-500 transition-all">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-zinc-400 font-medium text-lg">{user.email?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-zinc-100 font-medium truncate">{user.displayName || 'User'}</p>
              <p className="text-sm text-zinc-500 truncate">{user.email}</p>
            </div>
          </button>

          {/* Use another Sanscount */}
          <button 
            onClick={() => {
              // Sign out so they can log in with another Sanscount
              import('../services/firebase').then(({ auth }) => auth.signOut());
            }}
            disabled={authorizing}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:bg-zinc-800/50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-zinc-300 font-medium">Use another Sanscount</p>
            </div>
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-500 leading-relaxed">
            To continue, Sanscounts will share your name, email address, and profile picture with {clientName}. Before using this app, you can review {clientName}'s <a href="#" className="text-sky-500 hover:underline">privacy policy</a> and <a href="#" className="text-sky-500 hover:underline">terms of service</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

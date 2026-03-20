import React, { useState } from 'react';
import { X, User, Calendar, Mail, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, userData, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [dob, setDob] = useState(userData?.dob || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateUserProfile({ displayName, dob, photoURL });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 in Firestore
        setError('Image size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sanscountsEmail = user?.email ? `${user.email.split('@')[0]}@sanscounts.com` : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <img 
              src="https://i.postimg.cc/mgjhxF9q/Blue-Minimalist-Fast-Email-Logo-Design.png" 
              alt="Sanscounts" 
              className="w-6 h-6 rounded-md"
            />
            Sanscounts Account
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-sky-500/50" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-3xl font-bold border-2 border-sky-500/50">
                  {displayName.charAt(0) || 'U'}
                </div>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={24} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
            {isEditing && (
              <div className="mt-4 w-full space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1 ml-1 uppercase tracking-wider">Upload or Paste URL</label>
                  <input 
                    type="text" 
                    value={photoURL} 
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 text-center">Tip: Click the camera icon above to upload from your device.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <User size={18} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Account Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                ) : (
                  <p className="text-zinc-100 font-medium">{displayName || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <Mail size={18} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Sanscounts Email</label>
                <p className="text-zinc-100 font-medium">{sanscountsEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                <Calendar size={18} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Date of Birth</label>
                {isEditing ? (
                  <input 
                    type="date" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                ) : (
                  <p className="text-zinc-100 font-medium">{dob || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {error && <p className="mt-6 text-sm text-red-500 text-center">{error}</p>}

          <div className="mt-10">
            {isEditing ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 px-4 rounded-full border border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-full bg-sky-500 text-black font-bold hover:bg-sky-400 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-4 rounded-full bg-zinc-100 text-black font-bold hover:bg-white transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

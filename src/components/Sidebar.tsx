import React, { useState, useRef, useEffect } from 'react';
import { Inbox, Send, File, Trash2, AlertOctagon, Plus, Mail, LogOut, MoreHorizontal, ExternalLink, Star, UserCircle, Code, Shield } from 'lucide-react';
import { Folder, Email } from '../types';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ProfileModal } from './ProfileModal';

interface SidebarProps {
  currentFolder: Folder;
  setCurrentFolder: (folder: Folder) => void;
  onCompose: () => void;
  emails: Email[];
  userEmail: string | null | undefined;
}

export function Sidebar({ currentFolder, setCurrentFolder, onCompose, emails, userEmail }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const sanscountsEmail = user?.email ? `${user.email.split('@')[0]}@sanscounts.com` : '';

  const folders: { id: Folder; label: string; icon: React.ElementType }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'sansteo', label: 'Sansteo OTP', icon: Shield },
  ];

  const unreadCounts = folders.reduce((acc, folder) => {
    acc[folder.id] = emails.filter(e => {
      if (e.deletedBy?.includes(userEmail || '')) return folder.id === 'trash' && !e.read && e.recipientEmail === userEmail;
      if (folder.id === 'trash') return false;
      if (folder.id === 'inbox') return e.recipientEmail === userEmail && !e.read;
      if (folder.id === 'sent') return false; // Usually don't show unread for sent
      if (folder.id === 'starred') return e.starredBy?.includes(userEmail || '') && !e.read && e.recipientEmail === userEmail;
      return false;
    }).length;
    return acc;
  }, {} as Record<Folder, number>);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-20 lg:w-64 bg-black border-r border-zinc-800 flex flex-col h-full flex-shrink-0 transition-all duration-300 relative safe-top safe-bottom">
      <div 
        onClick={() => setIsProfileModalOpen(true)}
        className="p-4 flex items-center justify-center lg:justify-start gap-3 cursor-pointer hover:bg-zinc-900/50 transition-colors"
      >
        <img 
          src="https://i.postimg.cc/mgjhxF9q/Blue-Minimalist-Fast-Email-Logo-Design.png" 
          alt="Sanscounts Logo" 
          className="w-8 h-8 rounded-lg object-cover"
          referrerPolicy="no-referrer"
        />
        <span className="font-semibold text-lg tracking-tight hidden lg:block">Sanscounts</span>
      </div>
      
      <div className="px-2 lg:px-4 pb-4">
        <button
          onClick={onCompose}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2.5 px-0 lg:px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span className="hidden lg:block">Compose</span>
        </button>
      </div>

      <nav className="flex-1 px-2 lg:px-3 space-y-1 overflow-y-auto">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = currentFolder === folder.id;
          const unreadCount = unreadCounts[folder.id];

          return (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className={cn(
                "w-full flex items-center justify-center lg:justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sky-500/10 text-sky-400" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
              title={folder.label}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? "text-sky-600" : "text-zinc-400"} />
                <span className="hidden lg:block">{folder.label}</span>
              </div>
              {unreadCount > 0 && (
                <span className={cn(
                  "text-xs py-0.5 px-2 rounded-full hidden lg:block",
                  isActive ? "bg-sky-500/20 text-sky-300" : "bg-zinc-800 text-zinc-300"
                )}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="mt-8 pt-4 border-t border-zinc-800 space-y-2">
          {userEmail && (userEmail.toLowerCase() === 'sanscounts@sanscounts.com' || userEmail.toLowerCase() === 'sloudsan@gmail.com') && (
            <button
              onClick={() => navigate('/developers')}
              className="w-full flex items-center justify-center lg:justify-between px-3 py-2 rounded-lg text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
              title="Developer Portal"
            >
              <div className="flex items-center gap-3">
                <Code size={18} className="text-sky-500" />
                <span className="hidden lg:block">Developer Portal</span>
              </div>
            </button>
          )}
          <button
            onClick={() => navigate('/demo-client')}
            className="w-full flex items-center justify-center lg:justify-between px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Test OAuth Demo"
          >
            <div className="flex items-center gap-3">
              <ExternalLink size={18} className="text-emerald-500" />
              <span className="hidden lg:block">Test OAuth Demo</span>
            </div>
          </button>
        </div>
      </nav>
      
      <div className="p-3 border-t border-zinc-800 relative" ref={menuRef}>
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-semibold flex-shrink-0">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-zinc-100 truncate">{user?.displayName || 'User'}</span>
                <span className="text-xs text-zinc-500 truncate">{sanscountsEmail}</span>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <button 
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-3 rounded-xl"
              >
                <UserCircle size={16} className="text-sky-500" />
                Sanscounts Account
              </button>
              <button 
                onClick={signOut}
                className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-3 rounded-xl"
              >
                <LogOut size={16} className="text-red-500" />
                Log out @{user?.email?.split('@')[0]}
              </button>
            </div>
          </div>
        )}

        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />

        <button 
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-zinc-900 rounded-full transition-colors group"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-semibold flex-shrink-0">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-col hidden lg:flex items-start overflow-hidden">
              <span className="text-sm font-bold text-zinc-100 truncate w-full text-left">{user?.displayName || 'User'}</span>
              <span className="text-xs text-zinc-500 truncate w-full text-left">{sanscountsEmail}</span>
            </div>
          </div>
          <MoreHorizontal size={18} className="text-zinc-500 hidden lg:block group-hover:text-zinc-300 transition-colors" />
        </button>
      </div>
    </div>
  );
}

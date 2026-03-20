import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Star, Trash2, Reply, MoreVertical, Archive, MailOpen, Mail, Sparkles } from 'lucide-react';
import { Email } from '../types';
import { cn } from '../utils';
import { summarizeEmail } from '../services/ai';

interface EmailDetailProps {
  email: Email;
  onClose: () => void;
  onToggleRead: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onReply: () => void;
  userEmail: string;
  currentFolder: string;
}

export function EmailDetail({ email, onClose, onToggleRead, onToggleStar, onDelete, onRestore, onReply, userEmail, currentFolder }: EmailDetailProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    const result = await summarizeEmail(email.body);
    setSummary(result);
    setIsSummarizing(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-black h-full overflow-hidden">
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-full transition-colors lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 lg:border-none lg:pl-0">
            {currentFolder === 'trash' && onRestore ? (
              <button
                onClick={onRestore}
                className="p-2 text-zinc-400 hover:bg-zinc-900 hover:text-sky-500 rounded-full transition-colors"
                title="Restore"
              >
                <Archive size={18} />
              </button>
            ) : null}
            <button
              onClick={onDelete}
              className="p-2 text-zinc-400 hover:bg-zinc-900 hover:text-red-500 rounded-full transition-colors"
              title={currentFolder === 'trash' ? "Delete Permanently" : "Delete"}
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onToggleRead}
              className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-full transition-colors"
              title={email.read ? "Mark as unread" : "Mark as read"}
            >
              {email.read ? <Mail size={18} /> : <MailOpen size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onReply}
            className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-full transition-colors"
            title="Reply"
          >
            <Reply size={18} />
          </button>
          <button
            onClick={onToggleStar}
            className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-full transition-colors"
            title="Star"
          >
            <Star size={18} className={cn(email.starredBy.includes(userEmail) && "fill-yellow-400 text-yellow-400")} />
          </button>
          <button className="p-2 text-zinc-400 hover:bg-zinc-900 rounded-full transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-2xl font-semibold text-zinc-100 leading-tight">
              {email.subject}
            </h1>
          </div>

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-lg font-semibold">
                {email.senderName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100">{email.senderName}</span>
                  <span className="text-sm text-zinc-400">&lt;{email.senderEmail}&gt;</span>
                </div>
                <div className="text-sm text-zinc-400">
                  to {email.recipientEmail}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-zinc-500 whitespace-nowrap">
                {format(email.createdAt?.toDate ? email.createdAt.toDate() : new Date(), 'MMM d, yyyy, h:mm a')}
              </div>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} />
                {isSummarizing ? 'Summarizing...' : 'Summarize'}
              </button>
            </div>
          </div>

          {summary && (
            <div className="mb-8 p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl relative">
              <div className="absolute -top-3 left-4 bg-black px-2 text-xs font-semibold text-sky-400 flex items-center gap-1">
                <Sparkles size={12} />
                AI Summary
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            {email.body.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-zinc-300 leading-relaxed min-h-[1rem]">
                {paragraph}
              </p>
            ))}
          </div>
          
          <div className="mt-12 pt-6 border-t border-zinc-800 flex gap-3">
            <button
              onClick={onReply}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Reply size={16} />
              Reply
            </button>
            <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { format } from 'date-fns';
import { Star, Search } from 'lucide-react';
import { Email, Folder } from '../types';
import { cn } from '../utils';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  onToggleStar: (id: string) => void;
  currentFolder: Folder;
  userEmail: string | null | undefined;
}

export function EmailList({ emails, selectedEmailId, onSelectEmail, onToggleStar, currentFolder, userEmail }: EmailListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmails = emails.filter((email) => {
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.senderName.toLowerCase().includes(query) ||
      email.senderEmail.toLowerCase().includes(query) ||
      email.recipientEmail.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  });

  return (
    <div className={cn(
      "w-full lg:w-96 bg-black border-r border-zinc-800 flex-col h-full flex-shrink-0",
      selectedEmailId ? "hidden lg:flex" : "flex"
    )}>
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-semibold capitalize mb-4 text-zinc-100">{currentFolder}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow placeholder:text-zinc-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            {searchQuery ? 'No emails match your search.' : 'No emails in this folder.'}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filteredEmails.map((email) => {
              const isSelected = selectedEmailId === email.id;
              const isUnread = !email.read && email.recipientEmail === userEmail;
              const isStarred = email.starredBy?.includes(userEmail || '');
              const date = email.createdAt?.toDate ? email.createdAt.toDate() : new Date();
              
              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email.id)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors group relative",
                    isSelected ? "bg-sky-500/10" : "hover:bg-zinc-900/50",
                    isUnread && !isSelected && "bg-zinc-950"
                  )}
                >
                  {isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-r-full" />
                  )}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={cn(
                        "text-sm truncate",
                        isUnread ? "font-semibold text-zinc-100" : "font-medium text-zinc-400"
                      )}>
                        {currentFolder === 'sent' ? email.recipientEmail : email.senderName}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs whitespace-nowrap",
                      isUnread ? "font-medium text-sky-400" : "text-zinc-500"
                    )}>
                      {format(date, 'MMM d')}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate mb-1",
                        isUnread ? "font-medium text-zinc-100" : "text-zinc-300"
                      )}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-zinc-500 truncate line-clamp-1">
                        {email.body}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(email.id);
                      }}
                      className="mt-1 flex-shrink-0 text-zinc-400 hover:text-yellow-400 transition-colors"
                    >
                      <Star
                        size={16}
                        className={cn(isStarred && "fill-yellow-400 text-yellow-400")}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

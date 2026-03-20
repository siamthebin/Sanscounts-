import { useState } from 'react';
import { X, Paperclip, Image as ImageIcon, Link, Send, Sparkles } from 'lucide-react';
import { Email } from '../types';
import { generateReply } from '../services/ai';

interface ComposeModalProps {
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => void;
  replyTo?: Email | null;
}

export function ComposeModal({ onClose, onSend, replyTo }: ComposeModalProps) {
  const [to, setTo] = useState(replyTo ? replyTo.senderEmail : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = () => {
    if (!to || !subject || !body) return;

    onSend(to, subject, body);
  };

  const handleGenerateReply = async () => {
    if (!replyTo) return;
    setIsGenerating(true);
    const reply = await generateReply(replyTo.body);
    setBody(reply);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      <div className="w-full max-w-lg bg-zinc-950 rounded-xl shadow-2xl border border-zinc-800 flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="bg-black text-zinc-100 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium text-sm">New Message</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex flex-col p-4 gap-4 flex-1">
          <div className="border-b border-zinc-800 pb-2">
            <input
              type="email"
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full text-sm outline-none bg-transparent placeholder:text-zinc-500 text-zinc-100"
            />
          </div>
          <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm font-medium outline-none bg-transparent placeholder:text-zinc-500 text-zinc-100"
            />
            {replyTo && (
              <button
                onClick={handleGenerateReply}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Sparkles size={14} />
                {isGenerating ? 'Generating...' : 'AI Reply'}
              </button>
            )}
          </div>
          
          <textarea
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full flex-1 min-h-[200px] text-sm outline-none bg-transparent resize-none placeholder:text-zinc-500 text-zinc-300"
          />
        </div>
        
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
              <Paperclip size={18} />
            </button>
            <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
              <ImageIcon size={18} />
            </button>
            <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
              <Link size={18} />
            </button>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!to || !subject || !body}
            className="bg-sky-500 hover:bg-sky-400 disabled:bg-sky-900 disabled:text-sky-400 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            Send
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

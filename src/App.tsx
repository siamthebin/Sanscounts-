import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Email, Folder } from './types';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { ComposeModal } from './components/ComposeModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Authorize } from './components/Authorize';
import { DemoClient } from './components/DemoClient';
import { DeveloperPortal } from './components/DeveloperPortal';
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { Sansteo } from './components/Sansteo';
import { useEmails } from './hooks/useEmails';

function MailApp() {
  const { user } = useAuth();
  const { emails, loading, sendEmail, markAsRead, toggleStar, moveToTrash, restoreFromTrash, deletePermanently } = useEmails(user?.email?.toLowerCase());
  const [currentFolder, setCurrentFolder] = useState<Folder>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);

  // Send welcome instructions email to owner if not already present
  useEffect(() => {
    const checkAndSendWelcome = async () => {
      const userEmail = user?.email?.toLowerCase();
      if (!loading && (userEmail === 'sanscounts@sanscounts.com' || userEmail === 'sloudsan@gmail.com')) {
        // Check if welcome email already exists to avoid duplicates
        const welcomeExists = emails.some(e => e.subject === '🚀 Go Live Instructions: sanscounts.sansloud.com');
        if (!welcomeExists) {
          try {
            await sendEmail(
              userEmail!,
              '🚀 Go Live Instructions: sanscounts.sansloud.com',
              `Hello,\n\nHere are the steps to make your application live on the internet at sanscounts.sansloud.com:\n\n1. DNS Configuration: Point sanscounts.sansloud.com to this app's IP/CNAME in your domain provider settings.\n2. Environment Setup: In AI Studio Settings, set APP_URL to https://sanscounts.sansloud.com.\n3. Domain Verification: Add sansloud.com in the Developer Dashboard and verify the TXT record.\n4. Deploy: Click "Share" -> "Deploy to Cloud Run" in AI Studio.\n\nYou can also find these steps in your Developer Dashboard.\n\nBest regards,\nSanscounts System`,
              'Sanscounts System'
            );
            console.log("Welcome email sent successfully.");
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        }
      }
    };
    checkAndSendWelcome();
  }, [user, emails, loading, sendEmail]);

  if (!user) {
    return <Login />;
  }

  const filteredEmails = emails.filter((email) => {
    const userEmail = user.email?.toLowerCase() || '';
    if (email.deletedBy?.includes(userEmail)) {
      return currentFolder === 'trash';
    }
    if (currentFolder === 'trash') return false;
    
    if (currentFolder === 'inbox') {
      return email.recipientEmail === userEmail;
    }
    if (currentFolder === 'sent') {
      return email.senderEmail === userEmail;
    }
    if (currentFolder === 'starred') {
      return email.starredBy?.includes(userEmail);
    }
    return false;
  });

  const selectedEmail = emails.find((email) => email.id === selectedEmailId);

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    await sendEmail(to, subject, body, user.displayName || user.email?.split('@')[0] || 'User');
    setIsComposeOpen(false);
    setReplyToEmail(null);
  };

  const handleCompose = () => {
    setReplyToEmail(null);
    setIsComposeOpen(true);
  };

  const handleReply = () => {
    if (selectedEmail) {
      setReplyToEmail(selectedEmail);
      setIsComposeOpen(true);
    }
  };

  const handleToggleRead = async (id: string) => {
    const email = emails.find(e => e.id === id);
    const userEmail = user.email?.toLowerCase() || '';
    if (email && !email.read && email.recipientEmail === userEmail) {
      await markAsRead(id);
    }
  };

  const handleToggleStar = async (id: string) => {
    const email = emails.find(e => e.id === id);
    if (email) {
      const userEmail = user.email?.toLowerCase() || '';
      const isStarred = email.starredBy?.includes(userEmail);
      await toggleStar(id, isStarred);
    }
  };

  const handleDelete = async (id: string) => {
    if (currentFolder === 'trash') {
      await deletePermanently(id);
    } else {
      await moveToTrash(id);
    }
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  const handleRestore = async (id: string) => {
    await restoreFromTrash(id);
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans overflow-hidden safe-top safe-bottom">
      <Sidebar
        currentFolder={currentFolder}
        setCurrentFolder={(folder) => {
          setCurrentFolder(folder);
          setSelectedEmailId(null);
        }}
        onCompose={handleCompose}
        emails={emails}
        userEmail={user.email}
      />
      <div className="flex flex-1 overflow-hidden">
        {currentFolder === 'sansteo' ? (
          <Sansteo />
        ) : (
          <>
            <EmailList
              emails={filteredEmails}
              selectedEmailId={selectedEmailId}
              onSelectEmail={(id) => {
                setSelectedEmailId(id);
                handleToggleRead(id);
              }}
              onToggleStar={handleToggleStar}
              currentFolder={currentFolder}
              userEmail={user.email}
            />
            {selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmailId(null)}
                onToggleRead={() => handleToggleRead(selectedEmail.id)}
                onToggleStar={() => handleToggleStar(selectedEmail.id)}
                onDelete={() => handleDelete(selectedEmail.id)}
                onRestore={() => handleRestore(selectedEmail.id)}
                onReply={handleReply}
                userEmail={user.email}
                currentFolder={currentFolder}
              />
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center bg-black border-l border-zinc-800">
                <div className="text-center text-zinc-500">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-zinc-100">No message selected</p>
                  <p className="text-sm mt-1">Select an email from the list to read it</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {isComposeOpen && (
        <ComposeModal
          onClose={() => {
            setIsComposeOpen(false);
            setReplyToEmail(null);
          }}
          onSend={handleSendEmail}
          replyTo={replyToEmail}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MailApp />} />
          <Route path="/oauth/authorize" element={<Authorize />} />
          <Route path="/demo-client" element={<DemoClient />} />
          <Route path="/developers" element={<DeveloperPortal />} />
          <Route path="/developers/dashboard" element={<DeveloperDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

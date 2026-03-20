export type Folder = 'inbox' | 'sent' | 'trash' | 'starred' | 'sansteo';

export interface Email {
  id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  createdAt: any; // Firestore Timestamp
  read: boolean;
  starredBy: string[];
  deletedBy: string[];
}

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Email, Folder } from '../types';

export function useEmails(userEmail: string | null | undefined) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setEmails([]);
      setLoading(false);
      return;
    }

    // We need to listen to emails where the user is either the sender or recipient
    // Firestore doesn't support OR queries easily with orderBy across different fields,
    // so we can listen to both and merge, or just use an 'in' query if we had a participants array.
    // For simplicity, let's just listen to all emails where recipientEmail == userEmail OR senderEmail == userEmail
    // Wait, Firestore supports 'or' queries now!
    
    // Actually, let's just create two queries and merge them, or use the new 'or' query if available.
    // To be safe with older Firebase SDKs, we'll do two listeners and merge.
    
    const inboxQuery = query(
      collection(db, 'emails'),
      where('recipientEmail', '==', userEmail)
    );
    
    const sentQuery = query(
      collection(db, 'emails'),
      where('senderEmail', '==', userEmail)
    );

    const unsubscribeInbox = onSnapshot(inboxQuery, (snapshot) => {
      const inboxDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Email));
      
      // Merge with sent docs (we'll keep them in state and merge on render, or merge here)
      // To keep it simple, let's just use a single state and update it.
      // A better way is to use a map to deduplicate.
      setEmails(prev => {
        const map = new Map(prev.map(e => [e.id, e]));
        inboxDocs.forEach(e => map.set(e.id, e));
        return Array.from(map.values()).sort((a: Email, b: Email) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emails');
    });

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      const sentDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Email));
      
      setEmails(prev => {
        const map = new Map(prev.map(e => [e.id, e]));
        sentDocs.forEach(e => map.set(e.id, e));
        return Array.from(map.values()).sort((a: Email, b: Email) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emails');
    });

    return () => {
      unsubscribeInbox();
      unsubscribeSent();
    };
  }, [userEmail]);

  const sendEmail = async (recipientEmail: string, subject: string, body: string, senderName: string) => {
    if (!userEmail) return;
    try {
      await addDoc(collection(db, 'emails'), {
        senderEmail: userEmail.toLowerCase(),
        senderName,
        recipientEmail: recipientEmail.toLowerCase(),
        subject,
        body,
        createdAt: serverTimestamp(),
        read: false,
        starredBy: [],
        deletedBy: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'emails');
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        read: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `emails/${emailId}`);
    }
  };

  const toggleStar = async (emailId: string, isStarred: boolean) => {
    if (!userEmail) return;
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        starredBy: isStarred ? arrayRemove(userEmail) : arrayUnion(userEmail)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `emails/${emailId}`);
    }
  };

  const moveToTrash = async (emailId: string) => {
    if (!userEmail) return;
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        deletedBy: arrayUnion(userEmail)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `emails/${emailId}`);
    }
  };

  const restoreFromTrash = async (emailId: string) => {
    if (!userEmail) return;
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        deletedBy: arrayRemove(userEmail)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `emails/${emailId}`);
    }
  };

  const deletePermanently = async (emailId: string) => {
    if (!userEmail) return;
    try {
      await deleteDoc(doc(db, 'emails', emailId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `emails/${emailId}`);
    }
  };

  return { emails, loading, sendEmail, markAsRead, toggleStar, moveToTrash, restoreFromTrash, deletePermanently };
}

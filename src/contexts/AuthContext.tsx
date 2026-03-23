import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, logout, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, handleFirestoreError, OperationType } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userData: any;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string, dob?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string; dob?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email: string, password: string, displayName: string, dob?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Store extra data in Firestore
    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName,
        email,
        dob: dob || '',
        createdAt: new Date().toISOString(),
        role: 'user'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userCredential.user.uid}`);
    }

    setUser({ ...userCredential.user, displayName } as User);
    setUserData({ displayName, email, dob: dob || '' });
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await logout();
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string; dob?: string }) => {
    if (!user) return;

    const updates: any = {};
    if (data.displayName) updates.displayName = data.displayName;
    if (data.photoURL) updates.photoURL = data.photoURL;

    if (Object.keys(updates).length > 0) {
      await updateProfile(user, updates);
    }

    if (data.dob || data.displayName || data.photoURL) {
      const firestoreUpdates: any = {};
      if (data.dob) firestoreUpdates.dob = data.dob;
      if (data.displayName) firestoreUpdates.displayName = data.displayName;
      if (data.photoURL) firestoreUpdates.photoURL = data.photoURL;
      
      try {
        await updateDoc(doc(db, 'users', user.uid), firestoreUpdates);
        setUserData((prev: any) => ({ ...prev, ...firestoreUpdates }));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }

    setUser({ ...auth.currentUser } as User);
  };

  return (
    <AuthContext.Provider value={{ user, loading, userData, signOut, signUpWithEmail, signInWithEmail, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

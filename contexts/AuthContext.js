import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth functions
  const signin = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: email,
      displayName: displayName,
      isPremium: false,
      aiCreditsUsed: 0,
      favoritesCount: 0,
      createdAt: new Date().toISOString()
    });
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  // Check user subscription status
  const checkPremiumStatus = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.isPremium || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  };

  // Update user's AI credits
  const updateAICredits = async (userId, increment = 1) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newCreditsUsed = (userData.aiCreditsUsed || 0) + increment;
        await setDoc(doc(db, 'users', userId), {
          ...userData,
          aiCreditsUsed: newCreditsUsed
        }, { merge: true });
        return newCreditsUsed;
      }
    } catch (error) {
      console.error('Error updating AI credits:', error);
    }
  };

  // Check if user can use AI features
  const canUseAI = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isPremium) return true;
        
        // Free users get 2 AI generations per week
        const aiCreditsUsed = userData.aiCreditsUsed || 0;
        const accountCreated = new Date(userData.createdAt);
        const weeksSinceCreation = Math.floor((Date.now() - accountCreated.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const allowedCredits = (weeksSinceCreation + 1) * 2;
        
        return aiCreditsUsed < allowedCredits;
      }
      return false;
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user profile
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signin,
    signup,
    logout,
    checkPremiumStatus,
    updateAICredits,
    canUseAI
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

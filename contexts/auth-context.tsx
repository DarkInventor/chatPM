"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/lib/auth';
import { firestoreService, UserProfile } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createProfileWithName: (user: User, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const profile = await firestoreService.getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  const createProfileWithName = async (user: User, name: string) => {
    const result = await firestoreService.createUserProfile(user, name);
    if (result.success) {
      const profile = await firestoreService.getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid, firebaseUser?.email);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // First, try to get existing profile
        let profile = await firestoreService.getUserProfile(firebaseUser.uid);
        
        // If no profile exists, try to create one
        if (!profile) {
          console.log("No profile found, creating one...");
          const createResult = await firestoreService.createUserProfile(firebaseUser);
          
          if (createResult.success) {
            // Fetch the newly created profile
            profile = await firestoreService.getUserProfile(firebaseUser.uid);
            console.log("Profile created and fetched:", profile);
          } else {
            console.error("Failed to create profile:", createResult.error);
          }
        }
        
        setUserProfile(profile);
        
        // Check for pending invitation after successful sign-in
        const pendingInvitation = localStorage.getItem('pendingInvitation');
        if (pendingInvitation && typeof window !== 'undefined') {
          localStorage.removeItem('pendingInvitation');
          // Redirect to invitation page
          window.location.href = `/invite/${pendingInvitation}`;
          return; // Don't set loading to false yet, as we're redirecting
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    logout,
    refreshProfile,
    createProfileWithName
  };

  return (
    <AuthContext.Provider value={value}>
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
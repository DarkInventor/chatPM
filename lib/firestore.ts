import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
}

export const firestoreService = {
  // Check if user profile exists by email
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const profilesRef = collection(db, "profiles");
      const q = query(profilesRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  },

  // Get user profile by UID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, "profiles", uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return profileSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  // Create new user profile (more robust version)
  async createUserProfile(user: User, displayName?: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
    try {
      console.log("Creating profile for user:", user.uid, user.email);
      
      if (!user.email) {
        console.error("User has no email address");
        return { success: false, error: "User must have an email address" };
      }

      // Check if profile already exists by UID
      const existingProfile = await this.getUserProfile(user.uid);
      if (existingProfile) {
        console.log("Profile already exists for user:", user.uid);
        return { success: true, isNewUser: false };
      }

      // For social logins, we need to be more flexible with email checking
      // since the same email might be used across different providers
      const profilesRef = collection(db, "profiles");
      const emailQuery = query(profilesRef, where("email", "==", user.email));
      const emailQuerySnapshot = await getDocs(emailQuery);
      
      // If email exists with different UID, this could be a different auth provider for same user
      if (!emailQuerySnapshot.empty) {
        const existingDoc = emailQuerySnapshot.docs[0];
        if (existingDoc.id !== user.uid) {
          console.log("Email exists with different UID. Provider linking might be needed.");
          // For social logins, we'll allow this and create a new profile
          // In production, you might want to implement account linking
        }
      }

      // Create profile data with better fallbacks
      const profileData: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log("Creating profile with data:", profileData);
      const profileRef = doc(db, "profiles", user.uid);
      
      // Use setDoc with merge to handle any race conditions
      await setDoc(profileRef, profileData, { merge: true });
      
      console.log("Profile created successfully for user:", user.uid);
      return { success: true, isNewUser: true };
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      console.error("Error details:", error.code, error.message);
      
      // Check if it's a permission error
      if (error.code === 'permission-denied') {
        return { success: false, error: "Permission denied. Please check Firestore security rules." };
      }
      
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      const profileRef = doc(db, "profiles", uid);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      return { success: false, error: error.message };
    }
  }
};
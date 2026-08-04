import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBuT7e7OZ-5rMZCWu-w6L8h-qm07LKJoo8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "datebuddy-56fc0.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "datebuddy-56fc0",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "datebuddy-56fc0.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "573389040963",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:573389040963:web:e6833ae66cd77e490b93f6"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Helper to set up reCAPTCHA verifier for phone auth
export function setupRecaptcha(containerId: string = 'recaptcha-container') {
  if (typeof window === 'undefined') return null;
  
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber.
        console.log('✅ Firebase Invisible reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.warn('⚠️ Firebase reCAPTCHA expired');
      }
    });
  }
  return (window as any).recaptchaVerifier;
}

// Request OTP code via Firebase Phone Auth
export async function sendFirebaseOTP(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<ConfirmationResult | null> {
  try {
    const verifier = setupRecaptcha(containerId);
    if (!verifier) throw new Error('reCAPTCHA verifier not initialized');
    
    // Format phone number to E.164 standard (e.g. +919876543210)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    (window as any).confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending Firebase OTP:', error);
    throw error;
  }
}

// Verify Firebase OTP code
export async function verifyFirebaseOTP(otpCode: string): Promise<any> {
  try {
    const confirmationResult: ConfirmationResult = (window as any).confirmationResult;
    if (!confirmationResult) {
      throw new Error('No pending OTP request found. Please request a new OTP.');
    }
    const userCredential = await confirmationResult.confirm(otpCode);
    const idToken = await userCredential.user.getIdToken();
    return {
      user: userCredential.user,
      idToken,
      phoneNumber: userCredential.user.phoneNumber
    };
  } catch (error: any) {
    console.error('Error verifying Firebase OTP:', error);
    throw error;
  }
}

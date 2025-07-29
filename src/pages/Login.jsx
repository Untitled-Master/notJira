import React, { useState, useEffect } from 'react';
import { CheckSquare, AlertCircle, LogOut, Loader2, ArrowRight, Rocket } from 'lucide-react';

// (Firebase configuration and initialization logic remains the same)
const firebaseConfig = {
    apiKey: "AIzaSyC-VEZBhela7pKdJjRhTwpGiLPsnefDkzU",
    authDomain: "rasail-43c5b.firebaseapp.com",
    databaseURL: "https://rasail-43c5b-default-rtdb.firebaseio.com",
    projectId: "rasail-43c5b",
    storageBucket: "rasail-43c5b.firebasestorage.app",
    messagingSenderId: "633516803448",
    appId: "1:633516803448:web:8b08b984902605bd44f48d",
    measurementId: "G-H2Z89PZBQP"
  };
  
  // Initialize Firebase
  let app, auth, googleProvider;
  
  const initializeFirebase = async () => {
    try {
      // Import Firebase modules
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      return { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw new Error('Failed to initialize Firebase');
    }
  };

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(true); // Assume ready to prevent initial flicker
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Initialize Firebase on component mount
  useEffect(() => {
    const setupFirebase = async () => {
      try {
        const services = await initializeFirebase();
        setFirebaseServices(services);
        setFirebaseReady(true);
        
        const unsubscribe = services.onAuthStateChanged(services.auth, (user) => {
          setUser(user);
          if (user) {
            setShowWelcome(true);
          }
          setIsLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        setError('Failed to initialize authentication system');
        setFirebaseReady(false);
      }
    };
    
    setupFirebase();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!firebaseReady || !firebaseServices) {
      setError('Authentication system not ready. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await firebaseServices.signInWithPopup(firebaseServices.auth, googleProvider);
      const user = result.user;
      
      const { getDatabase, ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
      const userRef = ref(getDatabase(), `users/${user.uid}`);
      
      await set(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

    } catch (error) {
      console.error('Sign-in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') errorMessage = 'Sign-in was cancelled.';
      if (error.code === 'auth/popup-blocked') errorMessage = 'Please allow popups and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!firebaseServices) return;
    await firebaseServices.signOut(firebaseServices.auth);
    setUser(null);
    setShowWelcome(false);
  };

  // Loading state
  if (!firebaseServices) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-center">
        <div>
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-white mt-4">Initializing Secure Session</h2>
          <p className="text-slate-400">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (user && showWelcome) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
        <div className="relative w-full max-w-md">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
            
            <div className="text-center mb-8 relative z-10">
              <Rocket className="w-12 h-12 text-white bg-blue-600 p-3 rounded-xl mb-4 mx-auto" />
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
              <p className="text-slate-400">Ready to streamline your workflow?</p>
            </div>

            <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 mb-6 border border-slate-700/50 relative z-10">
              <div className="flex items-center gap-4">
                <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border-2 border-blue-500" />
                <div>
                  <h3 className="text-white font-semibold">{user.displayName}</h3>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6 relative z-10 flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">Authentication successful!</p>
            </div>

            <div className="space-y-3 relative z-10">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleSignOut}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-3xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-slate-800/60 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Left Column: Image and Branding */}
          <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600/20 to-slate-800/10">
            <Rocket className="w-16 h-16 text-blue-400 mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Manage Your Projects in Hyperdrive
            </h1>
            <p className="text-slate-300 text-lg">
              notJira provides a streamlined, fast, and intuitive platform to track your tickets and accelerate your team's workflow.
            </p>
            <div className="mt-8">
                {/* === ADD YOUR IMAGE HERE === */}
                <img 
                    src="https://i.pinimg.com/736x/ce/32/eb/ce32eb08514d9ba1d41639d15cd07c0b.jpg" 
                    alt="Project management illustration"
                    className="w-full h-auto rounded-lg object-cover"
                />
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-3xl font-bold text-white">
                not<span className="text-blue-400">Jira</span>
              </h1>
              <p className="text-slate-400 mt-2">Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full bg-white hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800/80 text-slate-500 text-xs backdrop-blur-sm">SECURE SIGN-IN</span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                By signing in, you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
import { Home, User, LogOut } from 'lucide-react';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import PageNotFound from './pages/PageNotFound';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      {user && (
        <nav className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link
                  to="/dashboard"
                  className="flex items-center text-white hover:text-blue-400 transition-colors"
                >
                  <Home className="h-5 w-5 mr-2" />
                  <span className="font-semibold">notJira</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                
                <div className="flex items-center ml-4">
                  <div className="relative">
                    <Link
                      to="/profile"
                      className="flex items-center text-sm rounded-full focus:outline-none"
                    >
                      {user.photoURL ? (
                        <img
                          className="h-8 w-8 rounded-full border-2 border-blue-500"
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-500">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </Link>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const auth = getAuth(app);
                    auth.signOut();
                  }}
                  className="ml-4 text-slate-300 hover:text-red-400 flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <div className={user ? "pt-16 min-h-screen bg-slate-900" : "min-h-screen bg-slate-900"}>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profile" 
            element={user ? <ProfilePage user={user} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
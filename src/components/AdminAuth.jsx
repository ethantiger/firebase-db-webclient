import { useState, useEffect } from 'react';
import { signInAdmin, signOutUser, getCurrentUser, onAuthChanged } from '../services/firebase';

const AdminAuth = ({ isFirebaseInitialized, onAuthChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    if (!isFirebaseInitialized) return;

    const unsubscribe = onAuthChanged((user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      onAuthChange(!!user, user);
      
      if (user) {
        setAuthStatus({
          success: true,
          message: `Signed in as ${user.email}`
        });
      } else {
        setAuthStatus(null);
      }
    });

    // Check initial auth state
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      onAuthChange(true, user);
    }

    return () => unsubscribe();
  }, [isFirebaseInitialized, onAuthChange]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setAuthStatus({
        success: false,
        message: 'Please enter both email and password'
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus(null);

    try {
      await signInAdmin(email, password);
      setPassword(''); // Clear password for security
    } catch (error) {
      let errorMessage = 'Authentication failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No admin account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This admin account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      setAuthStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      await signOutUser();
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthStatus({
        success: false,
        message: `Sign out failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFirebaseInitialized) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Admin Authentication</h2>
          <p className="text-sm text-gray-400">
            {isAuthenticated ? 'Authenticated as admin user' : 'Sign in with admin credentials to access database operations'}
          </p>
        </div>
      </div>

      {!isAuthenticated ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourcompany.com"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          {authStatus && (
            <div className={`p-3 rounded-md ${authStatus.success 
              ? 'bg-green-900/50 border border-green-700 text-green-300' 
              : 'bg-red-900/50 border border-red-700 text-red-300'
            }`}>
              {authStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </span>
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {authStatus && (
            <div className="p-3 rounded-md bg-green-900/50 border border-green-700 text-green-300">
              {authStatus.message}
            </div>
          )}

          <div className="bg-gray-900/50 rounded p-3 border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Email:</span> {currentUser?.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="font-medium">User ID:</span> {currentUser?.uid}
                </p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium">Last Sign In:</span> {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </button>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-md">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-300 font-medium">Admin Access Enabled</p>
                <p className="text-xs text-blue-400 mt-1">
                  You can now perform database operations including queries, batch updates, duplications, and deletions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuth;
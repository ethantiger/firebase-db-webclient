import { useState } from 'react';

const FirebaseConfig = ({ onConnect, isConnected, connectionStatus }) => {
  const [config, setConfig] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (!config.trim() || !collectionName.trim()) {
      alert('Please provide both Firebase config and collection name');
      return;
    }

    try {
      setIsLoading(true);
      const configObj = JSON.parse(config);
      await onConnect(configObj, collectionName);
    } catch (error) {
      alert('Invalid JSON configuration: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleConfig = `{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "your-app-id"
}`;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Firebase Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Firebase Config JSON
            </label>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder={exampleConfig}
              className="w-full h-48 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
              disabled={isConnected}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Collection Name
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="e.g., users, products, posts"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isConnected}
            />
          </div>

          {connectionStatus && (
            <div className={`p-3 rounded-md ${connectionStatus.success 
              ? 'bg-green-900/50 border border-green-700 text-green-300' 
              : 'bg-red-900/50 border border-red-700 text-red-300'
            }`}>
              {connectionStatus.message}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading || isConnected}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </span>
            ) : isConnected ? (
              'Connected'
            ) : (
              'Connect & Load Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConfig;
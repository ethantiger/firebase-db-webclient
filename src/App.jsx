import { useState } from 'react';
import { initializeFirebase, getCollectionData, executeQuery } from './services/firebase';
import FirebaseConfig from './components/FirebaseConfig';
import DataTable from './components/DataTable';
import QueryConsole from './components/QueryConsole';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [currentCollection, setCurrentCollection] = useState('');
  const [queryStatus, setQueryStatus] = useState(null);

  const handleConnect = async (config, collectionName) => {
    setIsLoading(true);
    setConnectionStatus(null);
    
    try {
      // Initialize Firebase
      const initResult = initializeFirebase(config);
      
      if (!initResult.success) {
        setConnectionStatus(initResult);
        return;
      }

      // Fetch data from collection
      const collectionData = await getCollectionData(collectionName);
      
      setData(collectionData);
      setOriginalData(collectionData);
      setCurrentCollection(collectionName);
      setIsConnected(true);
      setConnectionStatus({
        success: true,
        message: `Successfully connected and loaded ${collectionData.length} documents from "${collectionName}"`
      });
      
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteQuery = async (queryParams) => {
    setIsQuerying(true);
    setQueryStatus(null);
    
    try {
      const queryResults = await executeQuery(queryParams);
      setData(queryResults);
      
      const hasFilters = queryParams.filters && queryParams.filters.length > 0;
      const hasOrderBy = queryParams.orderBy && queryParams.orderBy.field;
      const hasLimit = queryParams.limit && queryParams.limit > 0;
      
      let statusMessage = `Query executed successfully. Found ${queryResults.length} documents`;
      
      if (hasFilters || hasOrderBy || hasLimit) {
        const conditions = [];
        if (hasFilters) conditions.push(`${queryParams.filters.length} filter(s)`);
        if (hasOrderBy) conditions.push(`ordered by ${queryParams.orderBy.field}`);
        if (hasLimit) conditions.push(`limited to ${queryParams.limit}`);
        statusMessage += ` (${conditions.join(', ')})`;
      }
      
      setQueryStatus({
        success: true,
        message: statusMessage
      });
      
    } catch (error) {
      setQueryStatus({
        success: false,
        message: `Query failed: ${error.message}`
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const resetToOriginalData = () => {
    setData(originalData);
    setQueryStatus(null);
  };

  // Get available fields from the data
  const availableFields = originalData.length > 0 
    ? [...new Set(originalData.flatMap(item => Object.keys(item)))]
    : [];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15h6" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Firebase Database Client
              </h1>
              <p className="text-gray-400 text-sm">
                Connect to your Firebase Firestore and explore your collections
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Firebase Configuration Section */}
          <FirebaseConfig
            onConnect={handleConnect}
            isConnected={isConnected}
            connectionStatus={connectionStatus}
          />

          {/* Query Console and Data Display Section */}
          {(isConnected || isLoading) && (
            <div className="space-y-6">
              {/* Query Console */}
              {isConnected && originalData.length > 0 && (
                <QueryConsole
                  onExecuteQuery={handleExecuteQuery}
                  availableFields={availableFields}
                  isLoading={isQuerying}
                />
              )}

              {/* Query Status */}
              {queryStatus && (
                <div className={`p-3 rounded-md flex items-center justify-between ${queryStatus.success 
                  ? 'bg-green-900/50 border border-green-700 text-green-300' 
                  : 'bg-red-900/50 border border-red-700 text-red-300'
                }`}>
                  <span>{queryStatus.message}</span>
                  {queryStatus.success && data.length !== originalData.length && (
                    <button
                      onClick={resetToOriginalData}
                      className="ml-4 text-xs bg-green-800/50 hover:bg-green-700/50 px-3 py-1 rounded transition-colors"
                    >
                      Show All ({originalData.length})
                    </button>
                  )}
                </div>
              )}

              {/* Data Table Header and Count */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Collection Data: <span className="text-orange-400">{currentCollection}</span>
                </h2>
                <div className="flex items-center space-x-4">
                  {data.length !== originalData.length && (
                    <span className="text-sm text-gray-400">
                      Showing {data.length} of {originalData.length} documents
                    </span>
                  )}
                  {data.length > 0 && data.length === originalData.length && (
                    <span className="text-sm text-gray-400">
                      {data.length} documents
                    </span>
                  )}
                </div>
              </div>
              
              <DataTable data={data} isLoading={isLoading || isQuerying} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState } from 'react';
import { isFirestoreTimestamp } from '../services/firebase';

const DataTable = ({ data, isLoading }) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  // Get all unique keys from all objects to create columns
  const allKeys = [...new Set(data.flatMap(item => Object.keys(item)))];
  
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const renderValue = (value) => {
    if (value === null || value === undefined) return '';
    
    // Handle Firestore Timestamps
    if (isFirestoreTimestamp(value)) {
      const date = value.toDate();
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    // Handle Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length <= 3) {
        return `[${value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
      }
      return `[${value.slice(0, 2).map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}, ...+${value.length - 2}]`;
    }
    
    // Handle Objects
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      if (keys.length <= 2) {
        return `{${keys.map(k => `${k}: ${typeof value[k] === 'string' ? `"${value[k]}"` : String(value[k])}`).join(', ')}}`;
      }
      return `{${keys.slice(0, 2).map(k => `${k}: ${typeof value[k] === 'string' ? `"${value[k]}"` : String(value[k])}`).join(', ')}, ...+${keys.length - 2}}`;
    }
    
    // Handle Booleans
    if (typeof value === 'boolean') return value.toString();
    
    // Handle everything else as string
    return String(value);
  };

  const renderFullValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (isFirestoreTimestamp(value)) return value.toDate().toLocaleString();
    if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-gray-700">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-orange-900/30 to-orange-800/30">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="px-6 py-3 text-left text-xs font-medium text-orange-300 uppercase tracking-wider cursor-pointer hover:bg-orange-800/40 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>{key}</span>
                  {sortKey === key && (
                    <span className="text-orange-400">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedData.map((row, index) => (
            <tr
              key={row.id || index}
              className="hover:bg-gray-700/30 transition-colors"
            >
              {allKeys.map((key) => (
                <td
                  key={key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                >
                  <div className="max-w-xs truncate" title={renderFullValue(row[key])}>
                    {renderValue(row[key])}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
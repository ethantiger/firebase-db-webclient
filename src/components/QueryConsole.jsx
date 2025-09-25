import { useState } from 'react';
import { convertToFirestoreValue } from '../services/firebase';

const QueryConsole = ({ onExecuteQuery, availableFields = [], isLoading }) => {
  const [filters, setFilters] = useState([]);
  const [orderBy, setOrderBy] = useState({ field: '', direction: 'asc' });
  const [limitValue, setLimitValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const operators = [
    { value: '==', label: 'equals (==)' },
    { value: '!=', label: 'not equals (!=)' },
    { value: '<', label: 'less than (<)' },
    { value: '<=', label: 'less than or equal (<=)' },
    { value: '>', label: 'greater than (>)' },
    { value: '>=', label: 'greater than or equal (>=)' },
    { value: 'array-contains', label: 'array contains' },
    { value: 'array-contains-any', label: 'array contains any' },
    { value: 'in', label: 'in (up to 10 values)' },
    { value: 'not-in', label: 'not in (up to 10 values)' }
  ];

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: '==', value: '', type: 'string' }]);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index, key, value) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const parseValue = (value, type) => {
    return convertToFirestoreValue(value, type);
  };

  const executeQuery = () => {
    const queryParams = {
      filters: filters.map(filter => ({
        ...filter,
        value: parseValue(filter.value, filter.type)
      })).filter(filter => filter.field && filter.value !== ''),
      orderBy: orderBy.field ? orderBy : null,
      limit: limitValue ? parseInt(limitValue) : null
    };

    onExecuteQuery(queryParams);
  };

  const resetQuery = () => {
    setFilters([]);
    setOrderBy({ field: '', direction: 'asc' });
    setLimitValue('');
  };

  const loadSampleQueries = () => {
    const samples = [
      { field: availableFields[0] || 'name', operator: '==', value: 'example', type: 'string' }
    ];
    setFilters(samples);
    setOrderBy({ field: availableFields[0] || 'id', direction: 'asc' });
    setLimitValue('10');
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Query Console</h3>
            <p className="text-sm text-gray-400">Build and execute Firestore queries</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {filters.length > 0 && (
            <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded">
              {filters.length} filter{filters.length !== 1 ? 's' : ''}
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Filters Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-300">Where Clauses</h4>
              <button
                onClick={addFilter}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
              >
                Add Filter
              </button>
            </div>
            
            {filters.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-600 rounded">
                No filters added. Click "Add Filter" to start building your query.
              </div>
            ) : (
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-900/50 p-3 rounded border border-gray-600">
                    {/* Field */}
                    <div className="col-span-3">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                        className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select field</option>
                        {availableFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Operator */}
                    <div className="col-span-2">
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Value Type */}
                    <div className="col-span-2">
                      <select
                        value={filter.type}
                        onChange={(e) => updateFilter(index, 'type', e.target.value)}
                        className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="timestamp">Date/Timestamp</option>
                      </select>
                    </div>
                    
                    {/* Value */}
                    <div className="col-span-4">
                      {filter.type === 'boolean' ? (
                        <select
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">Select value</option>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : filter.type === 'timestamp' ? (
                        <input
                          type="datetime-local"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        />
                      ) : (
                        <input
                          type={filter.type === 'number' ? 'number' : 'text'}
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          placeholder={filter.type === 'array' ? 'value1, value2, value3' : 'Enter value'}
                          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        />
                      )}
                    </div>
                    
                    {/* Remove */}
                    <div className="col-span-1">
                      <button
                        onClick={() => removeFilter(index)}
                        className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded transition-colors"
                        title="Remove filter"
                      >
                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order By Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Order By</h4>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={orderBy.field}
                onChange={(e) => setOrderBy({ ...orderBy, field: e.target.value })}
                className="text-sm bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">No ordering</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              
              <select
                value={orderBy.direction}
                onChange={(e) => setOrderBy({ ...orderBy, direction: e.target.value })}
                disabled={!orderBy.field}
                className="text-sm bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Limit Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Limit Results</h4>
            <input
              type="number"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              placeholder="Enter maximum number of results"
              min="1"
              className="w-full text-sm bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={executeQuery}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded transition-all duration-200 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </span>
              ) : (
                'Execute Query'
              )}
            </button>
            
            <button
              onClick={resetQuery}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Reset
            </button>
            
            {availableFields.length > 0 && (
              <button
                onClick={loadSampleQueries}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Sample
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryConsole;
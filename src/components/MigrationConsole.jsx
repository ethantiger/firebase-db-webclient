import { useState } from 'react';
import { convertToFirestoreValue, formatFirestoreValue } from '../services/firebase';

const MigrationConsole = ({ 
  data, 
  onBatchUpdate, 
  onDuplicateDocuments, 
  onDeleteDocuments, 
  onRefreshData,
  availableFields = [],
  isLoading 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [activeOperation, setActiveOperation] = useState('update');
  const [updateFields, setUpdateFields] = useState([]);
  const [deleteFields, setDeleteFields] = useState([]);
  const [operationStatus, setOperationStatus] = useState(null);

  // Helper function to find and format a date field from document
  const getDocumentDateInfo = (doc) => {
    // Common date field names to look for
    const dateFields = ['createdAt', 'updatedAt', 'timestamp', 'date', 'created', 'modified'];
    
    for (const field of dateFields) {
      if (doc[field]) {
        const formatted = formatFirestoreValue(doc[field]);
        if (formatted !== JSON.stringify(doc[field])) { // If it was formatted as a date
          return `${field}: ${formatted}`;
        }
      }
    }
    
    // If no common date fields found, look for any Timestamp objects
    for (const [key, value] of Object.entries(doc)) {
      if (key !== 'id' && value && typeof value === 'object' && value.toDate) {
        return `${key}: ${formatFirestoreValue(value)}`;
      }
    }
    
    // Fall back to first non-id field
    const firstField = Object.entries(doc).find(([key, _]) => key !== 'id');
    if (firstField) {
      const [key, value] = firstField;
      const formatted = formatFirestoreValue(value);
      return `${key}: ${formatted.length > 30 ? formatted.substring(0, 30) + '...' : formatted}`;
    }
    
    return 'No additional data';
  };

  // Select/deselect documents
  const toggleDocumentSelection = (docId) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocuments(newSelection);
  };

  const selectAll = () => {
    setSelectedDocuments(new Set(data.map(doc => doc.id)));
  };

  const selectNone = () => {
    setSelectedDocuments(new Set());
  };

  const selectFiltered = () => {
    // If data is filtered (different from all documents), select visible ones
    setSelectedDocuments(new Set(data.map(doc => doc.id)));
  };

  // Update field management
  const addUpdateField = () => {
    setUpdateFields([...updateFields, { field: '', value: '', type: 'string' }]);
  };

  const removeUpdateField = (index) => {
    setUpdateFields(updateFields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const newFields = [...updateFields];
    newFields[index] = { ...newFields[index], [key]: value };
    setUpdateFields(newFields);
  };

  // Delete field management
  const addDeleteField = () => {
    setDeleteFields([...deleteFields, '']);
  };

  const removeDeleteField = (index) => {
    setDeleteFields(deleteFields.filter((_, i) => i !== index));
  };

  const updateDeleteField = (index, value) => {
    const newFields = [...deleteFields];
    newFields[index] = value;
    setDeleteFields(newFields);
  };

  const parseValue = (value, type) => {
    return convertToFirestoreValue(value, type);
  };

  // Operation handlers
  const handleBatchUpdate = async () => {
    if (selectedDocuments.size === 0 || (updateFields.length === 0 && deleteFields.length === 0)) {
      setOperationStatus({ success: false, message: 'Select documents and specify fields to update or delete' });
      return;
    }

    try {
      const updates = {};
      updateFields.forEach(field => {
        if (field.field && field.value !== undefined) {
          updates[field.field] = parseValue(field.value, field.type);
        }
      });

      // Filter out empty delete fields
      const fieldsToDelete = deleteFields.filter(field => field.trim() !== '');

      if (Object.keys(updates).length === 0 && fieldsToDelete.length === 0) {
        setOperationStatus({ success: false, message: 'No valid update or delete fields provided' });
        return;
      }

      await onBatchUpdate(Array.from(selectedDocuments), updates, fieldsToDelete);
      
      let message = `Successfully updated ${selectedDocuments.size} documents`;
      if (Object.keys(updates).length > 0 && fieldsToDelete.length > 0) {
        message = `Successfully updated ${selectedDocuments.size} documents (${Object.keys(updates).length} fields updated, ${fieldsToDelete.length} fields deleted)`;
      } else if (fieldsToDelete.length > 0) {
        message = `Successfully updated ${selectedDocuments.size} documents (${fieldsToDelete.length} fields deleted)`;
      } else if (Object.keys(updates).length > 0) {
        message = `Successfully updated ${selectedDocuments.size} documents (${Object.keys(updates).length} fields updated)`;
      }

      setOperationStatus({ success: true, message });
      setSelectedDocuments(new Set());
      setUpdateFields([]);
      setDeleteFields([]);
      onRefreshData();
    } catch (error) {
      setOperationStatus({ success: false, message: `Update failed: ${error.message}` });
    }
  };

  const handleDuplicate = async () => {
    if (selectedDocuments.size === 0) {
      setOperationStatus({ success: false, message: 'Select documents to duplicate' });
      return;
    }

    try {
      await onDuplicateDocuments(Array.from(selectedDocuments));
      setOperationStatus({ 
        success: true, 
        message: `Successfully duplicated ${selectedDocuments.size} documents` 
      });
      setSelectedDocuments(new Set());
      onRefreshData();
    } catch (error) {
      setOperationStatus({ success: false, message: `Duplication failed: ${error.message}` });
    }
  };

  const handleDelete = async () => {
    if (selectedDocuments.size === 0) {
      setOperationStatus({ success: false, message: 'Select documents to delete' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDocuments.size} document(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await onDeleteDocuments(Array.from(selectedDocuments));
      setOperationStatus({ 
        success: true, 
        message: `Successfully deleted ${selectedDocuments.size} documents` 
      });
      setSelectedDocuments(new Set());
      onRefreshData();
    } catch (error) {
      setOperationStatus({ success: false, message: `Deletion failed: ${error.message}` });
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Migration Console</h3>
            <p className="text-sm text-gray-400">Batch operations for editing, duplicating, and deleting documents</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedDocuments.size > 0 && (
            <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded">
              {selectedDocuments.size} selected
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
          {/* Document Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-300">Document Selection</h4>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  All ({data.length})
                </button>
                <button
                  onClick={selectFiltered}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  Visible ({data.length})
                </button>
                <button
                  onClick={selectNone}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  None
                </button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto bg-gray-900/50 rounded border border-gray-600">
              {data.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-700/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.has(doc.id)}
                    onChange={() => toggleDocumentSelection(doc.id)}
                    className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">
                      ID: {doc.id}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {getDocumentDateInfo(doc)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Operation Type Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Operation</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveOperation('update')}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  activeOperation === 'update'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Batch Update
              </button>
              <button
                onClick={() => setActiveOperation('duplicate')}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  activeOperation === 'duplicate'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Duplicate
              </button>
              <button
                onClick={() => setActiveOperation('delete')}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  activeOperation === 'delete'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Update Fields (only shown for update operation) */}
          {activeOperation === 'update' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300">Fields to Update</h4>
                <button
                  onClick={addUpdateField}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  Add Field
                </button>
              </div>
              
              {updateFields.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-600 rounded">
                  No fields added. Click "Add Field" to specify what to update.
                </div>
              ) : (
                <div className="space-y-3">
                  {updateFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-900/50 p-3 rounded border border-gray-600">
                      {/* Field Name */}
                      <div className="col-span-4">
                        <select
                          value={field.field}
                          onChange={(e) => updateField(index, 'field', e.target.value)}
                          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="">Select field</option>
                          {availableFields.map(fieldName => (
                            <option key={fieldName} value={fieldName}>{fieldName}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Value Type */}
                      <div className="col-span-2">
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, 'type', e.target.value)}
                          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="array">Array</option>
                          <option value="object">Object</option>
                          <option value="timestamp">Date/Timestamp</option>
                          <option value="null">Null</option>
                        </select>
                      </div>
                      
                      {/* Value */}
                      <div className="col-span-5">
                        {field.type === 'boolean' ? (
                          <select
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Select value</option>
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : field.type === 'null' ? (
                          <input
                            type="text"
                            value="null"
                            disabled
                            className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-400"
                          />
                        ) : field.type === 'timestamp' ? (
                          <input
                            type="datetime-local"
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          />
                        ) : field.type === 'object' ? (
                          <textarea
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            placeholder='{"key": "value", "nested": {"prop": 123}}'
                            rows="2"
                            className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            placeholder={
                              field.type === 'array' ? 'value1, value2, value3' : 
                              field.type === 'number' ? 'Enter number' :
                              'Enter value'
                            }
                            className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                          />
                        )}
                      </div>
                      
                      {/* Remove */}
                      <div className="col-span-1">
                        <button
                          onClick={() => removeUpdateField(index)}
                          className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded transition-colors"
                          title="Remove field"
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
          )}

          {/* Delete Fields (only shown for update operation) */}
          {activeOperation === 'update' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300">Fields to Delete</h4>
                <button
                  onClick={addDeleteField}
                  className="text-xs bg-red-700 hover:bg-red-600 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  Add Field to Delete
                </button>
              </div>
              
              {deleteFields.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-600 rounded">
                  No fields to delete. Click "Add Field to Delete" to remove fields from documents.
                </div>
              ) : (
                <div className="space-y-3">
                  {deleteFields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-900/50 p-3 rounded border border-red-600/30">
                      {/* Field Name */}
                      <div className="flex-1">
                        <select
                          value={field}
                          onChange={(e) => updateDeleteField(index, e.target.value)}
                          className="w-full text-sm bg-gray-800 border border-red-600 rounded px-3 py-2 text-gray-200 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Select field to delete</option>
                          {availableFields.map(fieldName => (
                            <option key={fieldName} value={fieldName}>{fieldName}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Remove */}
                      <button
                        onClick={() => removeDeleteField(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                        title="Remove from deletion list"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {deleteFields.length > 0 && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-700/30 rounded-md">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm text-red-300 font-medium">Warning: Field Deletion</p>
                      <p className="text-xs text-red-400 mt-1">
                        These fields will be permanently removed from the selected documents. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Operation Status */}
          {operationStatus && (
            <div className={`p-3 rounded-md ${operationStatus.success 
              ? 'bg-green-900/50 border border-green-700 text-green-300' 
              : 'bg-red-900/50 border border-red-700 text-red-300'
            }`}>
              {operationStatus.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            {activeOperation === 'update' && (
              <button
                onClick={handleBatchUpdate}
                disabled={isLoading || selectedDocuments.size === 0 || (updateFields.length === 0 && deleteFields.length === 0)}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded transition-all duration-200 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Updating...' : `Update ${selectedDocuments.size} Documents`}
              </button>
            )}
            
            {activeOperation === 'duplicate' && (
              <button
                onClick={handleDuplicate}
                disabled={isLoading || selectedDocuments.size === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded transition-all duration-200 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Duplicating...' : `Duplicate ${selectedDocuments.size} Documents`}
              </button>
            )}
            
            {activeOperation === 'delete' && (
              <button
                onClick={handleDelete}
                disabled={isLoading || selectedDocuments.size === 0}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded transition-all duration-200 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Deleting...' : `Delete ${selectedDocuments.size} Documents`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationConsole;
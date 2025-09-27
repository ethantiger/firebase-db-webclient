import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  endBefore,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  deleteField,
  Timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

let app = null;
let db = null;
let auth = null;
let currentCollection = null;

export const initializeFirebase = (config) => {
  try {
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    return { success: true, message: 'Firebase initialized successfully' };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { success: false, message: error.message };
  }
};

export const getCollectionData = async (collectionName) => {
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    currentCollection = collectionName;
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data = [];
    
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching collection data:', error);
    throw error;
  }
};

export const executeQuery = async (queryParams) => {
  if (!db || !currentCollection) {
    throw new Error('Firebase not initialized or no collection selected');
  }

  try {
    const collectionRef = collection(db, currentCollection);
    let firestoreQuery = collectionRef;

    // Apply filters (where clauses)
    if (queryParams.filters && queryParams.filters.length > 0) {
      queryParams.filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value !== undefined) {
          firestoreQuery = query(firestoreQuery, where(filter.field, filter.operator, filter.value));
        }
      });
    }

    // Apply ordering
    if (queryParams.orderBy && queryParams.orderBy.field) {
      const direction = queryParams.orderBy.direction || 'asc';
      firestoreQuery = query(firestoreQuery, orderBy(queryParams.orderBy.field, direction));
    }

    // Apply limit
    if (queryParams.limit && queryParams.limit > 0) {
      firestoreQuery = query(firestoreQuery, limit(queryParams.limit));
    }

    const querySnapshot = await getDocs(firestoreQuery);
    const data = [];
    
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return data;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Migration Operations

export const batchUpdateDocuments = async (documentIds, updates, fieldsToDelete = []) => {
  if (!db || !currentCollection) {
    throw new Error('Firebase not initialized or no collection selected');
  }

  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, currentCollection);
    
    documentIds.forEach(docId => {
      const docRef = doc(collectionRef, docId);
      
      // Prepare the update object
      const updateData = { ...updates };
      
      // Add field deletions
      fieldsToDelete.forEach(fieldName => {
        updateData[fieldName] = deleteField();
      });
      
      batch.update(docRef, updateData);
    });
    
    await batch.commit();
    return { 
      success: true, 
      updated: documentIds.length, 
      deletedFields: fieldsToDelete.length 
    };
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

export const duplicateDocuments = async (documentIds, data) => {
  if (!db || !currentCollection) {
    throw new Error('Firebase not initialized or no collection selected');
  }

  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, currentCollection);
    const duplicatedIds = [];
    
    // Find the source documents to duplicate
    const sourceDocuments = data.filter(doc => documentIds.includes(doc.id));
    
    sourceDocuments.forEach(sourceDoc => {
      // Create a new document reference (Firestore will auto-generate ID)
      const newDocRef = doc(collectionRef);
      // Remove the id field and add the data
      const { id, ...docData } = sourceDoc;
      batch.set(newDocRef, docData);
      duplicatedIds.push(newDocRef.id);
    });
    
    await batch.commit();
    return { success: true, duplicated: duplicatedIds.length, newIds: duplicatedIds };
  } catch (error) {
    console.error('Error duplicating documents:', error);
    throw error;
  }
};

export const deleteDocuments = async (documentIds) => {
  if (!db || !currentCollection) {
    throw new Error('Firebase not initialized or no collection selected');
  }

  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, currentCollection);
    
    documentIds.forEach(docId => {
      const docRef = doc(collectionRef, docId);
      batch.delete(docRef);
    });
    
    await batch.commit();
    return { success: true, deleted: documentIds.length };
  } catch (error) {
    console.error('Error deleting documents:', error);
    throw error;
  }
};

export const createDocument = async (documentData) => {
  if (!db || !currentCollection) {
    throw new Error('Firebase not initialized or no collection selected');
  }

  try {
    const collectionRef = collection(db, currentCollection);
    const docRef = await addDoc(collectionRef, documentData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const updateDocument = async (docId, updates) => {
  if (!db || !currentCollection) {
    throw new Error('Firebase not initialized or no collection selected');
  }

  try {
    const collectionRef = collection(db, currentCollection);
    const docRef = doc(collectionRef, docId);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const isFirebaseInitialized = () => {
  return app !== null && db !== null;
};

// Authentication functions

export const signInAdmin = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  if (!auth) return null;
  return auth.currentUser;
};

export const onAuthChanged = (callback) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// Utility functions for data formatting
export const isFirestoreTimestamp = (value) => {
  return value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function';
};

export const formatFirestoreValue = (value) => {
  return formatNestedValue(value);
};

// Helper function to recursively format nested structures for display
const formatNestedValue = (value) => {
  if (isFirestoreTimestamp(value)) {
    return value.toDate().toLocaleString();
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    
    // Check if it's an array of objects
    const hasObjects = value.some(item => item && typeof item === 'object' && !Array.isArray(item) && !isFirestoreTimestamp(item));
    
    if (hasObjects) {
      const formatted = value.slice(0, 2).map(item => {
        if (item && typeof item === 'object' && !Array.isArray(item) && !isFirestoreTimestamp(item)) {
          const entries = Object.entries(item).slice(0, 2);
          const objStr = entries.map(([k, v]) => `${k}: ${formatNestedValue(v)}`).join(', ');
          return `{${objStr}${Object.keys(item).length > 2 ? '...' : ''}}`;
        }
        return formatNestedValue(item);
      });
      
      return value.length > 2 
        ? `[${formatted.join(', ')}... +${value.length - 2} more]`
        : `[${formatted.join(', ')}]`;
    }
    
    // Regular array formatting
    const formatted = value.slice(0, 3).map(item => formatNestedValue(item));
    return value.length > 3 
      ? `${formatted.join(', ')}... (+${value.length - 3} more)`
      : formatted.join(', ');
  }
  
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    
    const formatted = entries.slice(0, 2).map(([key, val]) => {
      const formattedVal = formatNestedValue(val);
      return `${key}: ${typeof formattedVal === 'string' && formattedVal.length > 20 
        ? formattedVal.substring(0, 20) + '...' 
        : formattedVal}`;
    });
    
    return entries.length > 2 
      ? `{${formatted.join(', ')}... +${entries.length - 2} more}`
      : `{${formatted.join(', ')}}`;
  }
  
  return value;
};

export const convertToFirestoreValue = (value, type) => {
  switch (type) {
    case 'timestamp':
      return value ? Timestamp.fromDate(new Date(value)) : null;
    case 'number':
      return parseFloat(value) || 0;
    case 'boolean':
      return value === 'true' || value === true;
    case 'array':
      if (typeof value === 'string') {
        // Try to parse as JSON first (for arrays of objects)
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return processArrayItems(parsed);
          }
        } catch {
          // Fall back to comma-separated values
          return value.split(',').map(v => v.trim()).filter(v => v);
        }
      }
      return Array.isArray(value) ? processArrayItems(value) : [value];
    case 'object':
      const parsedObject = typeof value === 'string' ? JSON.parse(value) : value;
      return processNestedValue(parsedObject);
    case 'null':
      return null;
    default:
      return value;
  }
};

// Helper function to process array items, handling objects within arrays
const processArrayItems = (array) => {
  return array.map(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return processNestedValue(item);
    }
    if (Array.isArray(item)) {
      return processArrayItems(item);
    }
    // Check if item is a date string
    if (typeof item === 'string' && isDateString(item)) {
      try {
        return Timestamp.fromDate(new Date(item));
      } catch {
        return item;
      }
    }
    return item;
  });
};

// Helper function to process nested objects and detect dates
const processNestedValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (Array.isArray(value)) {
    return processArrayItems(value);
  }
  
  if (typeof value === 'object') {
    const processed = {};
    for (const [key, val] of Object.entries(value)) {
      processed[key] = processNestedValue(val);
    }
    return processed;
  }
  
  // Check if value is a date string
  if (typeof value === 'string' && isDateString(value)) {
    try {
      return Timestamp.fromDate(new Date(value));
    } catch {
      return value;
    }
  }
  
  return value;
};

// Helper function to detect if a string looks like a date
const isDateString = (str) => {
  if (typeof str !== 'string') return false;
  
  // Check for common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // datetime-local format  
    /^\d{4}-\d{2}-\d{2}$/ // date format
  ];
  
  return datePatterns.some(pattern => pattern.test(str)) && !isNaN(Date.parse(str));
};
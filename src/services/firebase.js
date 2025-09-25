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
  if (isFirestoreTimestamp(value)) {
    return value.toDate().toLocaleString();
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return value;
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
      return typeof value === 'string' 
        ? value.split(',').map(v => v.trim()).filter(v => v)
        : Array.isArray(value) ? value : [value];
    case 'object':
      return typeof value === 'string' ? JSON.parse(value) : value;
    case 'null':
      return null;
    default:
      return value;
  }
};
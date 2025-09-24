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
  runTransaction
} from 'firebase/firestore';

let app = null;
let db = null;
let currentCollection = null;

export const initializeFirebase = (config) => {
  try {
    app = initializeApp(config);
    db = getFirestore(app);
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

export const isFirebaseInitialized = () => {
  return app !== null && db !== null;
};
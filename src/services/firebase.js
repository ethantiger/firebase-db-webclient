import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

let app = null;
let db = null;

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

export const isFirebaseInitialized = () => {
  return app !== null && db !== null;
};
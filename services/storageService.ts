
const DB_NAME = 'LittleAiNeuralVault';
const STORE_NAME = 'vault_data';
const DB_VERSION = 1;

// 100 GB in bytes (100 * 1024 * 1024 * 1024)
const STORAGE_LIMIT_100GB = 107374182400;

export const initVault = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject('Failed to initialize Neural Vault');
    };
  });
};

/**
 * Saves data specific to a user to prevent data mixing.
 */
export const saveUserToVault = async (username: string, key: string, data: any): Promise<void> => {
  const db = await initVault();
  const userKey = `user_${username}_${key}`;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, userKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving to vault');
  });
};

/**
 * Retrieves data specific to a user.
 */
export const getUserFromVault = async (username: string, key: string): Promise<any> => {
  const db = await initVault();
  const userKey = `user_${username}_${key}`;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userKey);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error retrieving from vault');
  });
};

export const saveToVault = async (key: string, data: any): Promise<void> => {
  const db = await initVault();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving to vault');
  });
};

export const getFromVault = async (key: string): Promise<any> => {
  const db = await initVault();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    // Fix: Removed broken line referencing undefined userKey
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('Error retrieving from vault');
  });
};

export const wipeVault = async (): Promise<void> => {
  const db = await initVault();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Wipe failed');
  });
};

export const getVaultUsage = async (): Promise<{ used: number; total: number }> => {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { used: 0, total: STORAGE_LIMIT_100GB }; 
  }
  const estimate = await navigator.storage.estimate();
  return {
    used: estimate.usage || 0,
    total: STORAGE_LIMIT_100GB 
  };
};

const DB_NAME = 'MuiXOfflineDB';
const STORE_NAME = 'offlineSongs';
const DB_VERSION = 1;

class AudioStorage {
  constructor() {
    this.db = null;
    this.dbReady = false;
    this.initDB();
  }

  async initDB() {
    if (this.db && this.dbReady) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        this.dbReady = false;
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.dbReady = true;
        
        // Handle connection errors
        this.db.onerror = (event) => {
          console.error('Database error:', event.target.error);
          this.dbReady = false;
        };
        
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Delete existing store if it exists
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        
        // Create new store
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('Object store created:', STORE_NAME);
      };
    });
  }

  async saveSong(songData, audioBlob) {
    try {
      const db = await this.initDB();
      
      if (!db || !this.dbReady) {
        throw new Error('Database not ready');
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);

          const data = {
            id: songData.id,
            audioBlob,
            metadata: songData,
            timestamp: Date.now()
          };

          const request = store.put(data);

          request.onsuccess = () => {
            console.log('Song saved successfully:', songData.id);
            resolve();
          };

          request.onerror = () => {
            console.error('Error saving song:', request.error);
            reject(new Error('Failed to save song data'));
          };

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => {
            console.error('Transaction error:', transaction.error);
            reject(new Error('Failed to save song'));
          };
        } catch (error) {
          console.error('Transaction creation error:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Save song error:', error);
      throw new Error('Failed to save song: ' + error.message);
    }
  }

  async getSong(id) {
    try {
      const db = await this.initDB();
      if (!db || !this.dbReady) {
        throw new Error('Database not ready');
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Error getting song:', request.error);
          reject(new Error('Failed to get song data'));
        };
      });
    } catch (error) {
      console.error('Get song error:', error);
      throw new Error('Failed to get song: ' + error.message);
    }
  }

  async getAllSongs() {
    try {
      const db = await this.initDB();
      if (!db || !this.dbReady) {
        throw new Error('Database not ready');
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          console.error('Error getting all songs:', request.error);
          reject(new Error('Failed to get all songs'));
        };
      });
    } catch (error) {
      console.error('Get all songs error:', error);
      throw new Error('Failed to get all songs: ' + error.message);
    }
  }

  async deleteSong(id) {
    try {
      const db = await this.initDB();
      if (!db || !this.dbReady) {
        throw new Error('Database not ready');
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error('Error deleting song:', request.error);
          reject(new Error('Failed to delete song'));
        };
      });
    } catch (error) {
      console.error('Delete song error:', error);
      throw new Error('Failed to delete song: ' + error.message);
    }
  }
}

export const audioStorage = new AudioStorage();

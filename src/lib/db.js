import { openDB } from 'idb';

const DB_NAME = 'spotiflow_db';
const STORE_NAME = 'library_features';

export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' }); // id = track ID
            }
        },
    });
}

export async function saveLibraryFeatures(items) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const item of items) {
        if (item && item.id) {
            tx.store.put(item);
        }
    }
    await tx.done;
}

export async function getAllLibraryFeatures() {
    const db = await initDB();
    return db.getAll(STORE_NAME);
}

export async function clearLibraryFeatures() {
    const db = await initDB();
    return db.clear(STORE_NAME);
}

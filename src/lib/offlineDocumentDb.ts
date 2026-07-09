export interface OfflineDocumentRecord {
  key?: string;
  documentId: number;
  userId?: number | null;
  fileName: string;
  contentType: string;
  fileSize: number;
  lastModified: string;
  savedAt: string;
  blob: Blob;
}

const DB_NAME = 'aetherdocs-offline-documents';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

const buildKey = (documentId: number, userId?: number | null) => `${userId ?? 'anonymous'}:${documentId}`;

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('documentId', 'documentId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
) => {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const findByDocumentId = async (documentId: number) => {
  const db = await openDb();

  return new Promise<OfflineDocumentRecord | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('documentId');
    const request = index.openCursor(IDBKeyRange.only(documentId));

    request.onsuccess = () => {
      const cursor = request.result;
      resolve(cursor ? (cursor.value as OfflineDocumentRecord) : undefined);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const saveOfflineDocument = async (record: OfflineDocumentRecord) => {
  const storedRecord: OfflineDocumentRecord = {
    ...record,
    userId: record.userId ?? undefined,
    key: buildKey(record.documentId, record.userId),
  };

  await withStore('readwrite', (store) => store.put(storedRecord));
};

export const getOfflineDocument = async (documentId: number, userId?: number | null) => {
  if (userId !== undefined) {
    return withStore<OfflineDocumentRecord | undefined>('readonly', (store) =>
      store.get(buildKey(documentId, userId))
    );
  }

  return findByDocumentId(documentId);
};

export const deleteOfflineDocument = async (documentId: number, userId?: number | null) => {
  if (userId !== undefined) {
    await withStore('readwrite', (store) => store.delete(buildKey(documentId, userId)));
    return;
  }

  const record = await findByDocumentId(documentId);
  if (record?.key) {
    await withStore('readwrite', (store) => store.delete(record.key as IDBValidKey));
  }
};

export const getAllOfflineDocuments = async () =>
  withStore<OfflineDocumentRecord[]>('readonly', (store) => store.getAll());

export const deleteAllOfflineDocuments = async () => {
  await withStore('readwrite', (store) => store.clear());
};

export const isOfflineDocumentSaved = async (documentId: number, userId?: number | null) => {
  const record = await getOfflineDocument(documentId, userId);
  return !!record;
};

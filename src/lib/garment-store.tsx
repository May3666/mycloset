import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { garments as demoGarments, type Garment } from "@/lib/demo-data";

type GarmentDetails = Omit<Garment, "image" | "brand"> & { brand?: string };
type NewGarment = GarmentDetails;
type GarmentUpdate = Omit<GarmentDetails, "id">;
type StoredGarment = GarmentDetails & { imageBlob?: Blob };
type DeletedGarment = { id: string; deleted: true };
type StoredRecord = StoredGarment | DeletedGarment;
type GarmentStoreValue = {
  garments: Garment[];
  addGarment: (garment: NewGarment, image: Blob) => Promise<void>;
  updateGarment: (id: string, garment: GarmentUpdate, image?: Blob) => Promise<void>;
  deleteGarment: (id: string) => Promise<void>;
};

const DATABASE_NAME = "mycloset";
const DATABASE_VERSION = 1;
const GARMENT_STORE = "garments";

const GarmentStoreContext = createContext<GarmentStoreValue | null>(null);

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(GARMENT_STORE)) {
        request.result.createObjectStore(GARMENT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSavedGarments() {
  const database = await openDatabase();
  return new Promise<StoredRecord[]>((resolve, reject) => {
    const request = database.transaction(GARMENT_STORE, "readonly").objectStore(GARMENT_STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredRecord[]);
    request.onerror = () => reject(request.error);
  });
}

async function writeRecord(record: StoredRecord) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GARMENT_STORE, "readwrite");
    transaction.objectStore(GARMENT_STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function updateRecord(id: string, updates: GarmentUpdate, image?: Blob) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GARMENT_STORE, "readwrite");
    const store = transaction.objectStore(GARMENT_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      const current = request.result as StoredRecord | undefined;
      const currentImage = current && !isDeletedRecord(current) ? current.imageBlob : undefined;
      store.put({ ...updates, id, ...((image ?? currentImage) ? { imageBlob: image ?? currentImage } : {}) });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function deleteRecord(id: string) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GARMENT_STORE, "readwrite");
    transaction.objectStore(GARMENT_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function isDeletedRecord(record: StoredRecord): record is DeletedGarment {
  return "deleted" in record && record.deleted;
}

function makeGarmentList(records: StoredRecord[]) {
  const deletedIds = new Set(records.filter(isDeletedRecord).map((record) => record.id));
  const saved = records.filter((record): record is StoredGarment => !isDeletedRecord(record));
  const savedById = new Map(saved.map((record) => [record.id, record]));
  const demoIds = new Set(demoGarments.map((garment) => garment.id));
  const urls: string[] = [];
  const createImageUrl = (imageBlob: Blob) => {
    const url = URL.createObjectURL(imageBlob);
    urls.push(url);
    return url;
  };
  const demos = demoGarments.flatMap((garment) => {
    if (deletedIds.has(garment.id)) return [];
    const override = savedById.get(garment.id);
    if (!override) return [garment];
    return [{
      id: garment.id,
      name: override.name,
      category: override.category,
      color: override.color,
      season: override.season,
      brand: override.brand,
      image: override.imageBlob ? createImageUrl(override.imageBlob) : garment.image,
    }];
  });
  const added = saved
    .filter((record) => !demoIds.has(record.id) && record.imageBlob)
    .map((record) => ({
      id: record.id,
      name: record.name,
      category: record.category,
      color: record.color,
      season: record.season,
      brand: record.brand,
      image: createImageUrl(record.imageBlob!),
    }));
  return { garments: [...demos, ...added], urls };
}

export function GarmentStoreProvider({ children }: { children: ReactNode }) {
  const [garments, setGarments] = useState<Garment[]>(demoGarments);
  const garmentsRef = useRef(garments);
  const objectUrls = useRef<string[]>([]);
  garmentsRef.current = garments;

  const createImageUrl = (image: Blob) => {
    const url = URL.createObjectURL(image);
    objectUrls.current.push(url);
    return url;
  };

  useEffect(() => {
    let active = true;
    readSavedGarments()
      .then((records) => {
        const result = makeGarmentList(records);
        if (active) {
          objectUrls.current = result.urls;
          setGarments(result.garments);
        } else result.urls.forEach(URL.revokeObjectURL);
      })
      .catch(() => {
        if (active) setGarments(demoGarments);
      });

    return () => {
      active = false;
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, []);

  const addGarment = async (garment: NewGarment, image: Blob) => {
    await writeRecord({ ...garment, imageBlob: image });
    const imageUrl = createImageUrl(image);
    setGarments((current) => [
      ...current.filter((item) => item.id !== garment.id),
      { ...garment, image: imageUrl },
    ]);
  };

  const updateGarment = async (id: string, updates: GarmentUpdate, image?: Blob) => {
    const current = garmentsRef.current.find((garment) => garment.id === id);
    if (!current) throw new Error("La prenda ya no existe");

    await updateRecord(id, updates, image);
    const updated = { ...updates, id, image: image ? createImageUrl(image) : current.image };
    setGarments((items) => items.map((item) => (item.id === id ? updated : item)));
  };

  const deleteGarment = async (id: string) => {
    if (demoGarments.some((garment) => garment.id === id)) await writeRecord({ id, deleted: true });
    else await deleteRecord(id);
    const current = garmentsRef.current.find((garment) => garment.id === id);
    if (current?.image.startsWith("blob:")) {
      URL.revokeObjectURL(current.image);
      objectUrls.current = objectUrls.current.filter((url) => url !== current.image);
    }
    setGarments((current) => current.filter((garment) => garment.id !== id));
  };

  return (
    <GarmentStoreContext.Provider value={{ garments, addGarment, updateGarment, deleteGarment }}>
      {children}
    </GarmentStoreContext.Provider>
  );
}

export function useGarments() {
  const store = useContext(GarmentStoreContext);
  if (!store) throw new Error("useGarments debe usarse dentro de GarmentStoreProvider");
  return store;
}

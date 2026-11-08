import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { garments as demoGarments, type Garment } from "@/lib/demo-data";

type GarmentDetails = Omit<Garment, "image" | "brand"> & { brand?: string };
type NewGarment = GarmentDetails;
type GarmentUpdate = Omit<GarmentDetails, "id">;
type StoredGarment = GarmentDetails & { imageBlob: Blob };
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
        if (!active) return;
        const deletedIds = new Set(records.filter(isDeletedRecord).map((record) => record.id));
        const saved = records.filter((record): record is StoredGarment => !isDeletedRecord(record));
        const savedById = new Map(saved.map((record) => [record.id, record]));
        const demoIds = new Set(demoGarments.map((garment) => garment.id));
        const toGarment = ({ imageBlob, ...garment }: StoredGarment): Garment => ({
          ...garment,
          image: createImageUrl(imageBlob),
        });
        const loadedDemos = demoGarments
          .filter((garment) => !deletedIds.has(garment.id))
          .map((garment) => {
            const override = savedById.get(garment.id);
            return override ? toGarment(override) : garment;
          });
        const customGarments = saved.filter((record) => !demoIds.has(record.id)).map(toGarment);
        setGarments([...loadedDemos, ...customGarments]);
      })
      .catch(() => {
        if (active) setGarments(demoGarments);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach(URL.revokeObjectURL);
  }, []);

  const addGarment = async (garment: NewGarment, image: Blob) => {
    await writeRecord({ ...garment, imageBlob: image });
    const imageUrl = createImageUrl(image);
    setGarments((current) => [...current.filter((item) => item.id !== garment.id), { ...garment, image: imageUrl }]);
  };

  const updateGarment = async (id: string, updates: GarmentUpdate, image?: Blob) => {
    const current = garmentsRef.current.find((garment) => garment.id === id);
    if (!current) throw new Error("La prenda ya no existe");

    let imageBlob = image;
    if (!imageBlob) {
      const response = await fetch(current.image);
      if (!response.ok) throw new Error("No se pudo conservar la imagen");
      imageBlob = await response.blob();
    }

    const updated = { ...updates, id };
    await writeRecord({ ...updated, imageBlob });
    const imageUrl = image ? createImageUrl(image) : current.image;
    setGarments((items) => items.map((item) => (item.id === id ? { ...updated, image: imageUrl } : item)));
  };

  const deleteGarment = async (id: string) => {
    if (demoGarments.some((garment) => garment.id === id)) await writeRecord({ id, deleted: true });
    else await deleteRecord(id);
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

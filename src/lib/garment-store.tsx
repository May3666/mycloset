import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { garments as demoGarments, type Garment } from "@/lib/demo-data";

type StoredGarment = Omit<Garment, "image"> & { imageBlob: Blob };
type NewGarment = Omit<Garment, "image">;
type GarmentStoreValue = {
  garments: Garment[];
  addGarment: (garment: NewGarment, image: Blob) => Promise<void>;
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
  return new Promise<StoredGarment[]>((resolve, reject) => {
    const request = database.transaction(GARMENT_STORE, "readonly").objectStore(GARMENT_STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredGarment[]);
    request.onerror = () => reject(request.error);
  });
}

async function writeGarment(garment: NewGarment, image: Blob) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GARMENT_STORE, "readwrite");
    transaction.objectStore(GARMENT_STORE).put({ ...garment, imageBlob: image } satisfies StoredGarment);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export function GarmentStoreProvider({ children }: { children: ReactNode }) {
  const [savedGarments, setSavedGarments] = useState<Garment[]>([]);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    let active = true;
    readSavedGarments()
      .then((records) => {
        const loaded = records.map(({ imageBlob, ...garment }) => {
          const image = URL.createObjectURL(imageBlob);
          objectUrls.current.push(image);
          return { ...garment, image };
        });
        if (active) setSavedGarments(loaded);
        else loaded.forEach((garment) => URL.revokeObjectURL(garment.image));
      })
      .catch(() => {
        if (active) setSavedGarments([]);
      });

    return () => {
      active = false;
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, []);

  const addGarment = async (garment: NewGarment, image: Blob) => {
    await writeGarment(garment, image);
    const imageUrl = URL.createObjectURL(image);
    objectUrls.current.push(imageUrl);
    setSavedGarments((current) => [...current, { ...garment, image: imageUrl }]);
  };

  return (
    <GarmentStoreContext.Provider value={{ garments: [...demoGarments, ...savedGarments], addGarment }}>
      {children}
    </GarmentStoreContext.Provider>
  );
}

export function useGarments() {
  const store = useContext(GarmentStoreContext);
  if (!store) throw new Error("useGarments debe usarse dentro de GarmentStoreProvider");
  return store;
}
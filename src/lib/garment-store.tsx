import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { garments as demoGarments, type Garment } from "@/lib/demo-data";

type StoredGarment = Pick<Garment, "id"> &
  Partial<Omit<Garment, "id" | "image">> & { imageBlob?: Blob; deleted?: boolean };
type NewGarment = Omit<Garment, "image">;
type GarmentStoreValue = {
  garments: Garment[];
  addGarment: (garment: NewGarment, image: Blob) => Promise<void>;
  updateGarment: (garment: NewGarment, image?: Blob) => Promise<void>;
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

async function writeGarmentChanges(garment: NewGarment, image?: Blob) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GARMENT_STORE, "readwrite");
    const store = transaction.objectStore(GARMENT_STORE);
    const request = store.get(garment.id);
    request.onsuccess = () => {
      const current = request.result as StoredGarment | undefined;
      store.put({ ...garment, imageBlob: image ?? current?.imageBlob });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function removeGarment(id: string) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GARMENT_STORE, "readwrite");
    const store = transaction.objectStore(GARMENT_STORE);
    if (demoGarments.some((garment) => garment.id === id)) store.put({ id, deleted: true });
    else store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function makeGarmentList(records: StoredGarment[]) {
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const urls: string[] = [];
  const demos = demoGarments.flatMap((garment) => {
    const record = recordsById.get(garment.id);
    if (record?.deleted) return [];
    return [{
      ...garment,
      name: record?.name ?? garment.name,
      category: record?.category ?? garment.category,
      color: record?.color ?? garment.color,
      season: record?.season ?? garment.season,
      brand: record?.brand,
    }];
  });
  const added = records.flatMap((record) => {
    if (demoGarments.some((garment) => garment.id === record.id) || record.deleted || !record.imageBlob) return [];
    const image = URL.createObjectURL(record.imageBlob);
    urls.push(image);
    return [{
      id: record.id,
      name: record.name ?? "Prenda",
      category: record.category ?? "",
      color: record.color ?? "",
      season: record.season ?? "",
      brand: record.brand,
      image,
    }];
  });
  return { garments: [...demos, ...added], urls };
}

export function GarmentStoreProvider({ children }: { children: ReactNode }) {
  const [garments, setGarments] = useState<Garment[]>(demoGarments);
  const objectUrls = useRef<string[]>([]);

  const reloadGarments = async () => {
    const records = await readSavedGarments();
    const result = makeGarmentList(records);
    objectUrls.current.forEach(URL.revokeObjectURL);
    objectUrls.current = result.urls;
    setGarments(result.garments);
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
    await writeGarment(garment, image);
    await reloadGarments();
  };

  const updateGarment = async (garment: NewGarment, image?: Blob) => {
    await writeGarmentChanges(garment, image);
    await reloadGarments();
  };

  const deleteGarment = async (id: string) => {
    await removeGarment(id);
    await reloadGarments();
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
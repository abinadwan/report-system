// IndexedDB draft mirror. The primary save remains localStorage for offline compatibility.
// Reads are async and therefore are only used for recovery when localStorage is empty.
const DATABASE="report-system-v2";
const STORE="drafts";
const LIBRARY_STORE="libraries";
function connect(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in globalThis)){reject(new Error("IndexedDB unavailable"));return;}
  const request=indexedDB.open(DATABASE,2);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);
   if(!request.result.objectStoreNames.contains(LIBRARY_STORE))request.result.createObjectStore(LIBRARY_STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function transact(mode,action,storeName=STORE){
 const db=await connect();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(storeName,mode),req=action(tx.objectStore(storeName));
  let value;
  req.onsuccess=()=>value=req.result;
  req.onerror=()=>reject(req.error);
  tx.oncomplete=()=>{db.close();resolve(value);};
  tx.onerror=()=>{db.close();reject(tx.error);};
 });
}
export const writeDraft=report=>transact("readwrite",store=>store.put(report,"latest"));
export const readDraft=()=>transact("readonly",store=>store.get("latest"));

// Persist the complete report library in IndexedDB as an independent recovery copy.
// Serialize writes so an older asynchronous save cannot overwrite a newer snapshot.
let libraryWriteQueue=Promise.resolve();
export function writeLibrary(reports){
 const snapshot=structuredClone(reports);
 const operation=libraryWriteQueue.catch(()=>{}).then(()=>transact("readwrite",store=>store.put(snapshot,"all"),LIBRARY_STORE));
 libraryWriteQueue=operation;
 return operation;
}
export const readLibrary=()=>transact("readonly",store=>store.get("all"),LIBRARY_STORE);

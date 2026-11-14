// IndexedDB draft mirror. The primary save remains localStorage for offline compatibility.
// Reads are async and therefore are only used for recovery when localStorage is empty.
const DATABASE="report-system-v2";
const STORE="drafts";
function connect(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in globalThis)){reject(new Error("IndexedDB unavailable"));return;}
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function transact(mode,action){
 const db=await connect();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),req=action(tx.objectStore(STORE));
  let value;
  req.onsuccess=()=>value=req.result;
  req.onerror=()=>reject(req.error);
  tx.oncomplete=()=>{db.close();resolve(value);};
  tx.onerror=()=>{db.close();reject(tx.error);};
 });
}
export const writeDraft=report=>transact("readwrite",store=>store.put(report,"latest"));
export const readDraft=()=>transact("readonly",store=>store.get("latest"));

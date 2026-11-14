// Minimal read-only XLSX decoder for first worksheet, no external JS dependency.
// Supports OOXML shared strings, inline strings and numeric cells.
// Explicit limits guard against oversized spreadsheets and ZIP archives.
const MAX_ZIP=8*1024*1024, MAX_UNCOMPRESSED=24*1024*1024, MAX_ENTRIES=2048;
const sig=(view,at,value)=>at>=0&&at+4<=view.byteLength&&view.getUint32(at,true)===value;
const bytesToString=b=>new TextDecoder("utf-8",{fatal:true}).decode(b);
function zipEntries(buffer){
 if(buffer.byteLength>MAX_ZIP)throw Error("ملف Excel أكبر من 8 ميجابايت.");
 const view=new DataView(buffer);let eocd=-1;
 for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--){if(sig(view,i,0x06054b50)){eocd=i;break;}}
 if(eocd<0)throw Error("ملف XLSX غير صالح (ZIP).");
 const total=view.getUint16(eocd+10,true),dirOffset=view.getUint32(eocd+16,true);
 if(total>MAX_ENTRIES)throw Error("ملف Excel يحتوي على عدد كبير من الملفات الداخلية.");
 const archive=new Map();let cursor=dirOffset,expanded=0;
 for(let i=0;i<total;i++){
  if(!sig(view,cursor,0x02014b50))throw Error("فهرس XLSX غير صالح.");
  const flags=view.getUint16(cursor+8,true),method=view.getUint16(cursor+10,true);
  const compressed=view.getUint32(cursor+20,true),raw=view.getUint32(cursor+24,true);
  const nameLen=view.getUint16(cursor+28,true),extraLen=view.getUint16(cursor+30,true),commentLen=view.getUint16(cursor+32,true);
  const offset=view.getUint32(cursor+42,true),end=cursor+46+nameLen+extraLen+commentLen;
  if(end>view.byteLength||raw===0xFFFFFFFF||compressed===0xFFFFFFFF||flags&1)throw Error("XLSX مشفر أو غير مدعوم.");
  const path=bytesToString(new Uint8Array(buffer,cursor+46,nameLen));
  if(!path.startsWith("/")&&!path.includes("..")&&!path.includes("\\")){
   expanded+=raw;
   if(expanded>MAX_UNCOMPRESSED)throw Error("حجم XLSX المفكوك كبير جدًا.");
   archive.set(path,{method,compressed,raw,offset});
  }
  cursor=end;
 }
 return {archive,view,buffer};
}
async function extract(zip,path){
 const entry=zip.archive.get(path);if(!entry)return null;
 const {view,buffer}=zip;
 if(!sig(view,entry.offset,0x04034b50))throw Error("محتوى XLSX غير صالح.");
 const nameLen=view.getUint16(entry.offset+26,true),extraLen=view.getUint16(entry.offset+28,true);
 const start=entry.offset+30+nameLen+extraLen,end=start+entry.compressed;
 if(end>buffer.byteLength)throw Error("ملف XLSX ناقص.");
 const input=new Uint8Array(buffer,start,entry.compressed);
 if(entry.method===0)return bytesToString(input);
 if(entry.method!==8||typeof DecompressionStream!=="function")throw Error("طريقة ضغط XLSX غير مدعومة؛ احفظ الملف بصيغة CSV.");
 let stream;
 try{stream=new Blob([input]).stream().pipeThrough(new DecompressionStream("deflate-raw"));}
 catch{throw Error("متصفحك لا يدعم فك ضغط XLSX؛ استخدم CSV.");}
 const reader=stream.getReader();let bytes=0,chunks=[];
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  bytes+=value.byteLength;if(bytes>MAX_UNCOMPRESSED){await reader.cancel();throw Error("حجم بيانات Excel كبير جدًا.");}
  chunks.push(value);
 }
 if(bytes!==entry.raw)throw Error("حجم ملف داخلي في XLSX غير متطابق.");
 const all=new Uint8Array(bytes);let at=0;for(const chunk of chunks){all.set(chunk,at);at+=chunk.length;}
 return bytesToString(all);
}
function xml(text){
 const doc=new DOMParser().parseFromString(text,"application/xml");
 if(doc.getElementsByTagName("parsererror").length)throw Error("محتوى XML في XLSX غير صالح.");
 return doc;
}
function nodes(element,name){return Array.from(element.getElementsByTagNameNS("*",name));}
function cellText(cell,shared){
 const type=cell.getAttribute("t");
 if(type==="inlineStr")return nodes(cell,"t").map(x=>x.textContent||"").join("");
 const v=nodes(cell,"v")[0]?.textContent??"";
 if(type==="s"){const index=Number(v);if(!Number.isInteger(index)||index<0||index>=shared.length)throw Error("جدول النصوص داخل XLSX غير صالح.");return shared[index];}
 return v;
}
function columnIndex(ref){
 const letters=ref.match(/^[A-Z]+/)?.[0]||"";let result=0;
 for(const letter of letters)result=result*26+(letter.charCodeAt(0)-64);
 return result-1;
}
export async function readXLSX(buffer){
 const zip=zipEntries(buffer);
 const workbook=await extract(zip,"xl/workbook.xml");
 if(!workbook)throw Error("ملف Excel يفتقد معلومات المصنف.");
 const sheetXml=await extract(zip,"xl/worksheets/sheet1.xml");
 if(!sheetXml)throw Error("الورقة الأولى غير متوفرة؛ صدّرها إلى CSV.");
 let shared=[];
 const strings=await extract(zip,"xl/sharedStrings.xml");
 if(strings){shared=nodes(xml(strings),"si").map(si=>nodes(si,"t").map(x=>x.textContent||"").join(""));}
 const sheet=xml(sheetXml);
 const spreadsheetRows=nodes(sheet,"row").slice(0,36001).map(row=>{
  const values=[];
  for(const c of nodes(row,"c")){
   const idx=columnIndex(c.getAttribute("r")||"");if(idx<0||idx>250)throw Error("عدد الأعمدة كبير جدًا.");
   values[idx]=cellText(c,shared);
  }
  return values;
 }).filter(row=>row.some(v=>v!==undefined&&v!==""));
 if(spreadsheetRows.length<2)throw Error("ورقة Excel لا تحتوي على صفوف كافية.");
 const headers=spreadsheetRows.shift().map(h=>String(h??"").trim());
 if(new Set(headers).size!==headers.length||headers.some(h=>!h))throw Error("عناوين أعمدة Excel غير صالحة أو مكررة.");
 return spreadsheetRows.map((row,i)=>Object.fromEntries(headers.map((header,j)=>[header,String(row[j]??"").trim()])));
}

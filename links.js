'use strict';
/* Frontend Tautan.
   SATU-SATUNYA sumber data: GET /api/links (database Neon, Postgres).
   Tidak ada penyimpanan di browser: Web Storage API (local storage) tidak dipakai.
   Bila API gagal, daftar dibiarkan kosong + pesan kesalahan; tidak ada data contoh
   dan tidak ada penulisan ke browser. */
const categories = [
  {name:'Produktivitas',color:'#8f76ca',bg:'#f2edfb'},
  {name:'Pekerjaan',color:'#6398c2',bg:'#edf4fa'},
  {name:'Belajar',color:'#c5a05c',bg:'#fcf5e9'},
  {name:'Inspirasi',color:'#c17f9d',bg:'#faeef4'},
  {name:'Lainnya',color:'#7d9e92',bg:'#edf5f1'}
];
const $=s=>document.querySelector(s);
let view='all', category='Semua', editing=null;
let links=[], loaded=false, serverMode=false, storageKind=null, loadError='';
function validUrl(url){try {return ['http:','https:'].includes(new URL(url).protocol)||url==='dashboard.html';}catch{return false;}}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
let timer;function toast(text){$('#toast').textContent=text;clearTimeout(timer);timer=setTimeout(()=>$('#toast').textContent='',3500);}
function updateStorageStatus(){const label=$('#storage-status'),hint=$('#storage-hint');if(!label)return;if(!loaded){label.textContent='Memuat dari database Neon…';if(hint)hint.title='Tautan diambil dari database Neon (Postgres).';}else if(loadError){label.textContent='Database Neon tidak terhubung';if(hint)hint.title='Tautan hanya dimuat dari database Neon. '+loadError+' Periksa NEON_DATABASE_URL lalu muat ulang halaman.';}else if(storageKind==='neon'){label.textContent='Tersimpan di database Neon';if(hint)hint.title='Database Neon (Postgres) adalah satu-satunya penyimpanan. Tidak ada data yang ditulis ke browser.';}else{label.textContent='Tersimpan di database server';if(hint)hint.title='Penyimpanan aktif di server ('+(storageKind||'server')+'). Di Vercel penyimpanannya adalah Neon (Postgres).';}}
/* Ambil ulang seluruh koleksi dari /api/links. Dipakai saat memuat halaman dan setelah menyimpan. */
async function syncFromServer(){
 try{
  const res=await fetch('/api/links',{headers:{'Accept':'application/json'}});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json();
  if(!data||data.storage==='unavailable'||!Array.isArray(data.links))throw Error('Database Neon belum siap');
  links=data.links.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.description==='string'&&categories.some(c=>c.name===x.category)&&validUrl(x.url));
  storageKind=data.storage||'neon';serverMode=true;loadError='';loaded=true;
 }catch(err){
  links=[];serverMode=false;loaded=true;loadError=(err&&err.message)?err.message:'gagal memuat';
 }
 updateStorageStatus();render();
}
/* Kirim perubahan (tambah/edit/favorit/hapus) ke database Neon, lalu selaraskan ulang dari server. */
async function save(op,item){
 if(!serverMode){toast('Database Neon belum terhubung. Perubahan tidak disimpan.');return false;}
 try{
  let res;
  if(op==='create')res=await fetch('/api/links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
  else if(op==='delete')res=await fetch('/api/links/'+encodeURIComponent(item.id),{method:'DELETE'});
  else res=await fetch('/api/links/'+encodeURIComponent(item.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
  if(!res.ok)throw Error('HTTP '+res.status);
  await syncFromServer();return true;
 }catch{toast('Gagal menyimpan ke database Neon. Daftar dimuat ulang dari database.');await syncFromServer();return false;}
}
function openForm(item){editing=item?.id||null;const f=$('#link-form');f.reset();f.elements.title.value=item?.title||'';f.elements.url.value=item?.url==='dashboard.html'?new URL('dashboard.html',location.href).href:item?.url||'';f.elements.description.value=item?.description||'';f.elements.category.value=item?.category||categories[0].name;f.elements.favorite.checked=!!item?.favorite;$('#dialog-title').textContent=item?'Edit tautan':'Tambah tautan';$('#form-error').textContent='';$('#link-dialog').showModal();f.elements.title.focus();}
function render(){
 const favorites=links.filter(x=>x.favorite).length;
 $('#all-count').textContent=links.length;$('#favorite-count').textContent=favorites;$('#stat-total').textContent=links.length;$('#stat-favorite').textContent=favorites;$('#stat-category').textContent=new Set(links.map(x=>x.category)).size;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view&&category==='Semua');b.setAttribute('aria-pressed',b.classList.contains('active'));});
 const title=category!=='Semua'?category:view==='favorite'?'Tautan favorit':view==='recent'?'Baru ditambahkan':'Semua tautan';$('#breadcrumb-title').textContent=title;$('#collection-title').textContent=title==='Semua tautan'?'Koleksi tautan':title;
 $('#categories').replaceChildren();categories.forEach(c=>{const b=el('button','nav-button'+(category===c.name?' active':''));const dot=el('span','category-dot');dot.style.background=c.color;b.append(dot,document.createTextNode(c.name),el('small','',links.filter(x=>x.category===c.name).length));b.onclick=()=>{category=c.name;view='all';render();};$('#categories').append(b);});
 $('#filter-chips').replaceChildren();['Semua',...categories.map(c=>c.name)].forEach(c=>{const b=el('button','chip'+(category===c?' active':''),c);b.setAttribute('aria-pressed',category===c);b.onclick=()=>{category=c;render();};$('#filter-chips').append(b);});
 const query=$('#search').value.trim().toLocaleLowerCase('id');let shown=links.filter(x=>(view!=='favorite'||x.favorite)&&(category==='Semua'||x.category===category)&&[x.title,x.url,x.description].join(' ').toLocaleLowerCase('id').includes(query));
 const sort=view==='recent'?'new':$('#sort').value;shown.sort((a,b)=>sort==='az'?a.title.localeCompare(b.title,'id'):sort==='old'?a.created-b.created:b.created-a.created);$('#sort').disabled=view==='recent';$('#result-count').textContent=shown.length+' tautan';
 const note=$('#load-note');
 if(note){if(!loaded){note.hidden=false;note.textContent='Memuat tautan dari database Neon…';}else if(loadError){note.hidden=false;note.textContent='Tautan tidak dapat dimuat dari database Neon ('+loadError+'). Aplikasi tidak menyimpan data di browser, jadi koleksi dibiarkan kosong.';}else{note.hidden=true;note.textContent='';}}
 const cards=$('#cards');cards.replaceChildren();$('#empty').hidden=!loaded||!!loadError||shown.length!==0;
 shown.forEach(item=>{const c=categories.find(c=>c.name===item.category)||categories[categories.length-1];const card=el('article','card');const top=el('div','card-top');const icon=el('span','site-icon',item.icon||item.title.charAt(0).toUpperCase());icon.style.background=item.bg||c.bg;icon.style.color=item.color||c.color;const tools=el('div','card-tools');const star=el('button','icon-button'+(item.favorite?' favorited':''),item.favorite?'★':'☆');star.setAttribute('aria-label',(item.favorite?'Hapus dari favorit: ':'Favoritkan: ')+item.title);star.setAttribute('aria-pressed',!!item.favorite);star.onclick=()=>{item.favorite=!item.favorite;save('update',item);render();};const edit=el('button','icon-button','⋯');edit.setAttribute('aria-label','Edit '+item.title);edit.onclick=()=>openForm(item);tools.append(star,edit);top.append(icon,tools);
 const identity=el('div','card-identity');const heading=el('h3');const anchor=el('a','',item.title);anchor.href=item.url;anchor.target='_blank';anchor.rel='noopener noreferrer';heading.append(anchor);const domain=item.url==='dashboard.html'?'Dashboard lokal':new URL(item.url).hostname.replace(/^www\./,'');identity.append(heading,el('span','domain',domain));const bottom=el('div','card-bottom');const badge=el('span','badge',item.category);badge.style.setProperty('--badge-bg',c.bg);badge.style.setProperty('--badge-color',c.color);const open=el('a','open-link','Buka tautan');open.href=item.url;open.target='_blank';open.rel='noopener noreferrer';open.setAttribute('aria-label','Buka '+item.title+' di tab baru');open.append(el('span','','↗'));bottom.append(badge,open);card.append(top,identity,el('p','',item.description||'Tautan tersimpan di koleksi pribadi Anda.'),bottom);card.addEventListener('click',e=>{const s=document.getSelection();if(s&&!s.isCollapsed)e.preventDefault();});cards.append(card);});
 if(shown.length){const add=el('button','add-card');add.append(el('span','','＋'),el('strong','','Ada tautan menarik lainnya?'),el('small','','Tambahkan ke koleksi Anda'));add.onclick=()=>openForm();cards.append(add);}
}
categories.forEach(c=>$('#form-category').append(el('option','',c.name)));
$('#today').textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;category='Semua';render();});
$('#search').oninput=render;$('#sort').onchange=render;$('#add-link').onclick=()=>openForm();$('#empty-add').onclick=()=>openForm();$('#close-dialog').onclick=$('#cancel-dialog').onclick=()=>$('#link-dialog').close();
['grid','list'].forEach(mode=>$('#'+mode+'-view').onclick=()=>{$('#cards').classList.toggle('list',mode==='list');['grid','list'].forEach(m=>{const b=$('#'+m+'-view');b.classList.toggle('selected',m===mode);b.setAttribute('aria-pressed',m===mode);});});
const remove=el('button','secondary','Hapus tautan');remove.type='button';remove.style.marginRight='auto';$('#link-form .form-actions').prepend(remove);remove.onclick=async()=>{if(editing&&confirm('Hapus tautan ini dari koleksi Anda?')){const id=editing;$('#link-dialog').close();const ok=await save('delete',{id});if(ok)toast('Tautan dihapus dari database Neon.');}};
new MutationObserver(()=>{remove.hidden=!editing;}).observe($('#link-dialog'),{attributes:true,attributeFilter:['open']});
$('#link-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const title=f.elements.title.value.trim(),url=f.elements.url.value.trim();if(!title||!validUrl(url)){$('#form-error').textContent='Isi nama dan URL http:// atau https:// yang valid.';return;}const data={title,url,description:f.elements.description.value.trim(),category:f.elements.category.value,favorite:f.elements.favorite.checked};const wasEditing=!!editing;const item=wasEditing?Object.assign({},links.find(x=>x.id===editing),data):Object.assign({},data,{id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),created:Date.now()});$('#link-dialog').close();const ok=await save(wasEditing?'update':'create',item);if(ok)toast(wasEditing?'Tautan diperbarui di database Neon.':'Tautan baru disimpan di database Neon.');};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#link-dialog').open){e.preventDefault();$('#search').focus();}});
render();updateStorageStatus();syncFromServer();

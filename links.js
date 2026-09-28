'use strict';
const categories = [
  {name:'Produktivitas',color:'#8f76ca',bg:'#f2edfb'},
  {name:'Pekerjaan',color:'#6398c2',bg:'#edf4fa'},
  {name:'Belajar',color:'#c5a05c',bg:'#fcf5e9'},
  {name:'Inspirasi',color:'#c17f9d',bg:'#faeef4'},
  {name:'Lainnya',color:'#7d9e92',bg:'#edf5f1'}
];
const initial = [
 ['Google Drive','https://drive.google.com','Simpan, kelola, dan bagikan semua dokumen penting Anda.','Produktivitas',true,'△','#edf6f0','#68a78b'],
 ['Notion','https://www.notion.so','Ruang untuk catatan, ide, dan rencana besar berikutnya.','Produktivitas',true,'N','#f1f1f3','#33343b'],
 ['Gmail','https://mail.google.com','Semua percakapan dan email penting dalam satu kotak masuk.','Pekerjaan',true,'M','#fceeee','#d27878'],
 ['Figma','https://www.figma.com','Dari ide menjadi desain. Tempat berkolaborasi dan berkreasi.','Pekerjaan',false,'◈','#f1edfc','#9b79d0'],
 ['YouTube','https://www.youtube.com','Tutorial, pengetahuan baru, dan sedikit hiburan.','Belajar',false,'▶','#fff0ef','#de7272'],
 ['Pinterest','https://www.pinterest.com','Kumpulkan inspirasi visual untuk proyek Anda berikutnya.','Inspirasi',true,'P','#fcedf0','#c96e85'],
 ['ChatGPT','https://chatgpt.com','Teman bertukar ide, mencari jawaban, dan belajar hal baru.','Produktivitas',false,'✳','#eaf5f0','#69a68d'],
 ['SIPD Indonesia','https://sipd.go.id','Buka portal resmi Sistem Informasi Pemerintahan Daerah.','Pekerjaan',false,'▥','#edf2fb','#7897c9']
].map((x,i)=>({id:'default-'+i,title:x[0],url:x[1],description:x[2],category:x[3],favorite:x[4],icon:x[5],bg:x[6],color:x[7],created:Date.now()-i*1000}));
const key='tautan-collection-v1';
let links=initial, storageFailed=false;
function validUrl(url){try {return ['http:','https:'].includes(new URL(url).protocol);}catch{return false;}}
try{const saved=localStorage.getItem(key);if(saved){const data=JSON.parse(saved);if(!Array.isArray(data))throw Error();links=data.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.description==='string'&&categories.some(c=>c.name===x.category)&&(validUrl(x.url)||x.url==='dashboard.html'));}}catch{storageFailed=true;}
let view='all', category='Semua', editing=null;
const $=s=>document.querySelector(s);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
let timer;function toast(text){$('#toast').textContent=text;clearTimeout(timer);timer=setTimeout(()=>$('#toast').textContent='',3500);}
function save(){try{localStorage.setItem(key,JSON.stringify(links));return true;}catch{toast('Penyimpanan tidak tersedia. Perubahan hanya berlaku selama halaman ini terbuka.');return false;}}
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
 const cards=$('#cards');cards.replaceChildren();$('#empty').hidden=shown.length!==0;
 shown.forEach(item=>{const c=categories.find(c=>c.name===item.category);const card=el('article','card');const top=el('div','card-top');const icon=el('span','site-icon',item.icon||item.title.charAt(0).toUpperCase());icon.style.background=item.bg||c.bg;icon.style.color=item.color||c.color;const tools=el('div','card-tools');const star=el('button','icon-button'+(item.favorite?' favorited':''),item.favorite?'★':'☆');star.setAttribute('aria-label',(item.favorite?'Hapus dari favorit: ':'Favoritkan: ')+item.title);star.setAttribute('aria-pressed',!!item.favorite);star.onclick=()=>{item.favorite=!item.favorite;save();render();};const edit=el('button','icon-button','⋯');edit.setAttribute('aria-label','Edit '+item.title);edit.onclick=()=>openForm(item);tools.append(star,edit);top.append(icon,tools);
 const identity=el('div','card-identity');const heading=el('h3');const anchor=el('a','card-link',item.title);anchor.href=item.url;anchor.target='_blank';anchor.rel='noopener noreferrer';heading.append(anchor);const domain=item.url==='dashboard.html'?'Dashboard lokal':new URL(item.url).hostname.replace(/^www\./,'');identity.append(heading,el('span','domain',domain));const bottom=el('div','card-bottom');const badge=el('span','badge',item.category);badge.style.setProperty('--badge-bg',c.bg);badge.style.setProperty('--badge-color',c.color);const open=el('a','open-link','Buka tautan');open.href=item.url;open.target='_blank';open.rel='noopener noreferrer';open.setAttribute('aria-label','Buka '+item.title+' di tab baru');open.append(el('span','','↗'));bottom.append(badge,open);card.append(top,identity,el('p','',item.description||'Tautan tersimpan di koleksi pribadi Anda.'),bottom);cards.append(card);});
 if(shown.length){const add=el('button','add-card');add.append(el('span','','＋'),el('strong','','Ada tautan menarik lainnya?'),el('small','','Tambahkan ke koleksi Anda'));add.onclick=()=>openForm();cards.append(add);}
}
categories.forEach(c=>$('#form-category').append(el('option','',c.name)));
$('#today').textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;category='Semua';render();});
$('#search').oninput=render;$('#sort').onchange=render;$('#add-link').onclick=()=>openForm();$('#empty-add').onclick=()=>openForm();$('#close-dialog').onclick=$('#cancel-dialog').onclick=()=>$('#link-dialog').close();
['grid','list'].forEach(mode=>$('#'+mode+'-view').onclick=()=>{$('#cards').classList.toggle('list',mode==='list');['grid','list'].forEach(m=>{const b=$('#'+m+'-view');b.classList.toggle('selected',m===mode);b.setAttribute('aria-pressed',m===mode);});});
const remove=el('button','secondary','Hapus tautan');remove.type='button';remove.style.marginRight='auto';$('#link-form .form-actions').prepend(remove);remove.onclick=()=>{if(editing&&confirm('Hapus tautan ini dari koleksi Anda?')){links=links.filter(x=>x.id!==editing);const ok=save();render();$('#link-dialog').close();if(ok)toast('Tautan dihapus dari koleksi.');}};
new MutationObserver(()=>{remove.hidden=!editing;}).observe($('#link-dialog'),{attributes:true,attributeFilter:['open']});
$('#link-form').onsubmit=e=>{e.preventDefault();const f=e.currentTarget;const title=f.elements.title.value.trim(),url=f.elements.url.value.trim();if(!title||!validUrl(url)){$('#form-error').textContent='Isi nama dan URL http:// atau https:// yang valid.';return;}const data={title,url,description:f.elements.description.value.trim(),category:f.elements.category.value,favorite:f.elements.favorite.checked};if(editing){const item=links.find(x=>x.id===editing);Object.assign(item,data);}else links.unshift({...data,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),created:Date.now()});const ok=save();$('#link-dialog').close();render();if(ok)toast(editing?'Tautan berhasil diperbarui.':'Tautan baru berhasil disimpan.');};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#link-dialog').open){e.preventDefault();$('#search').focus();}});
render();if(storageFailed)toast('Data tersimpan tidak dapat dibaca. Menampilkan koleksi contoh.');

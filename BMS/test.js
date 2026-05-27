
// ══════════════════════════════════════════════════════════
// SAFE LOCALSTORAGE (Brave blocks localStorage on file:// URLs)
// ══════════════════════════════════════════════════════════
const _lsMem = {};
function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return _lsMem[k]||null; } }
function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){ _lsMem[k]=String(v); } }
function lsRem(k){ try { localStorage.removeItem(k); } catch(e){ delete _lsMem[k]; } }
// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════
const DEFAULT_CATS = ['Rings','Claw','Bangle','Mirror','Hairpin','Gift','Other'];
const CAT_COLORS_DEFAULT = {Rings:'#c9a853',Claw:'#a78bfa','Fish Claw':'#2dd4bf','Goth Claw':'#f472b6','Mini Claw':'#818cf8',Bangle:'#4ade80',Mirror:'#60a5fa',Hairpin:'#fb923c',Pin:'#facc15',Gift:'#f87171',Other:'#6b7280'};
let CAT_COLORS = {...CAT_COLORS_DEFAULT,...JSON.parse(lsGet('bms_cat_colors')||'{}')};
function saveCatColors(){lsSet('bms_cat_colors',JSON.stringify(CAT_COLORS));}
function getCatColor(cat){return CAT_COLORS[cat]||null;}
let CATS = JSON.parse(lsGet('bms_cats') || JSON.stringify(DEFAULT_CATS));
const SALE_HEADERS  = ['id','item','cat','customer','qty','rev','cost','date','pay','due','ord','disc','notes','batchRef'];
const COST_HEADERS  = ['id','item','cat','qty','totalCost','date','notes','type','missingFromBox','refundReceived','batchNum'];
const SALES_TAB = 'Sales';
const COSTS_TAB = 'Costs';
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const fmt  = n => '৳' + Number(n||0).toLocaleString('en-IN');
const pct  = (a,b) => b ? Math.round(a/b*100)+'%' : '0%';
const profit = s => (parseFloat(s.rev)||0) - (parseFloat(s.cost)||0) - (parseFloat(s.disc)||0);
const $    = id => document.getElementById(id);
const today= () => new Date().toISOString().slice(0,10);
const escH = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ══════════════════════════════════════════════════════════
// BATCH BADGE HELPER
// ══════════════════════════════════════════════════════════
function renderBatchBadge(batchId){
  if(!batchId)return'';
  const b=costsData.find(c=>c.id===batchId);
  if(!b)return'';
  const label=b.batchNum?('B'+b.batchNum):(b.notes?b.notes.slice(0,8):'?');
  return `<span style="display:inline-flex;margin-left:6px;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;background:var(--blue-dim);color:var(--blue);border:1px solid rgba(96,165,250,.2);letter-spacing:.5px;font-family:'DM Mono',monospace;vertical-align:middle">${escH(label)}</span>`;
}
// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let cfg = {clientId:'',sheetId:''};
let accessToken = '';
let tokenClient = null;
let sales = [];
let costsData = [];
let currentPage = 'dashboard';
let editId = null;
let editCostId = null;
let sortState = {col:'date',dir:'desc'};
let filterOpen = false;
let charts = {};
let pendingDeleteId = null;
let pendingDeleteRow = null;
let pendingDeleteType = 'sale';

// ══════════════════════════════════════════════════════════
// SAMPLE DATA — Full actual records
// ══════════════════════════════════════════════════════════
const SAMPLE_SALES = [
  {item:"Golden Ring",cat:"Rings",customer:"Shoronika",qty:2,rev:120,cost:62,date:"2025-01-24",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"First Order"},
  {item:"Golden Ring",cat:"Rings",customer:"",qty:4,rev:240,cost:124,date:"2026-01-04",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Refund",cat:"Other",customer:"REFUND",qty:1,rev:142,cost:142,date:"2026-01-04",pay:"Paid",due:0,ord:"Cancelled",disc:0,notes:"Refund"},
  {item:"Golden Ring",cat:"Rings",customer:"Rajani",qty:1,rev:60,cost:31,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"Gift 40"},
  {item:"Gift",cat:"Gift",customer:"",qty:1,rev:40,cost:0,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Juthi Miss",qty:5,rev:300,cost:155,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"Teacher"},
  {item:"Golden Ring",cat:"Rings",customer:"Tuba",qty:1,rev:40,cost:31,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"2p Set Discount"},
  {item:"Golden Ring",cat:"Rings",customer:"Riana",qty:2,rev:120,cost:62,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Riana",qty:2,rev:120,cost:62,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Shoshi",qty:1,rev:60,cost:31,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Gift",cat:"Gift",customer:"",qty:1,rev:40,cost:0,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Mukti",qty:1,rev:60,cost:31,date:"2026-01-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Gothic Claw",cat:"Goth Claw",customer:"Prothoma",qty:1,rev:190,cost:113,date:"2026-01-30",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Gothic Claw",cat:"Goth Claw",customer:"Siam",qty:1,rev:190,cost:113,date:"2026-01-31",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Silver Ring",cat:"Rings",customer:"Tuba",qty:3,rev:220,cost:93,date:"2026-02-03",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"70+70+60"},
  {item:"Claw + 2 Rings",cat:"Claw",customer:"Nadia",qty:1,rev:330,cost:175,date:"2026-02-03",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"1x Claw + 2x Rings"},
  {item:"Bangle",cat:"Bangle",customer:"Juthi Miss",qty:2,rev:460,cost:258,date:"2026-02-04",pay:"Pending",due:460,ord:"Completed",disc:0,notes:"220+240 DUE"},
  {item:"Bangle",cat:"Bangle",customer:"Ratna",qty:1,rev:200,cost:129,date:"2026-02-04",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Mukti",qty:2,rev:100,cost:62,date:"2026-02-04",pay:"Pending",due:100,ord:"Completed",disc:0,notes:"DUE"},
  {item:"Gothic Claw",cat:"Goth Claw",customer:"Anisha",qty:1,rev:190,cost:113,date:"2026-02-04",pay:"Pending",due:190,ord:"Completed",disc:0,notes:"DUE"},
  {item:"Golden Ring",cat:"Rings",customer:"Anisha",qty:2,rev:120,cost:62,date:"2026-02-04",pay:"Pending",due:120,ord:"Completed",disc:0,notes:"DUE"},
  {item:"Golden Ring",cat:"Rings",customer:"Tuba",qty:1,rev:60,cost:31,date:"2026-02-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Tuba",qty:1,rev:70,cost:31,date:"2026-02-05",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Nadia",qty:1,rev:80,cost:31,date:"2026-02-08",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"Mimi Miss",qty:3,rev:210,cost:93,date:"2026-02-08",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Bangle",cat:"Bangle",customer:"Mimi Miss",qty:1,rev:220,cost:129,date:"2026-02-04",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Mirror",cat:"Mirror",customer:"Orpita",qty:1,rev:550,cost:458,date:"2026-02-06",pay:"Pending",due:550,ord:"Completed",disc:0,notes:"DUE"},
  {item:"Goth Claw",cat:"Goth Claw",customer:"Afra",qty:1,rev:190,cost:113,date:"2026-03-10",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Fish Claw",cat:"Fish Claw",customer:"Adrita",qty:1,rev:230,cost:133,date:"2026-03-15",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Hairpin",cat:"Hairpin",customer:"Adrita",qty:1,rev:180,cost:68,date:"2026-03-15",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Mini Claw",cat:"Mini Claw",customer:"Othoi",qty:2,rev:200,cost:103,date:"2026-03-15",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Gothic Claw",cat:"Goth Claw",customer:"Nadia",qty:2,rev:480,cost:226,date:"2026-04-01",pay:"Paid",due:0,ord:"Completed",disc:0,notes:"2x Claw"},
  {item:"Fish Claw",cat:"Fish Claw",customer:"Supti",qty:1,rev:230,cost:133,date:"2026-04-07",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Refund",cat:"Other",customer:"REFUND",qty:1,rev:110,cost:110,date:"2026-04-07",pay:"Paid",due:0,ord:"Cancelled",disc:0,notes:"Refund"},
  {item:"Fish Claw",cat:"Fish Claw",customer:"Prottasha",qty:1,rev:230,cost:133,date:"2026-04-13",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Mirror",cat:"Mirror",customer:"Tuba",qty:1,rev:600,cost:458,date:"2026-04-21",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Golden Ring",cat:"Rings",customer:"",qty:1,rev:70,cost:31,date:"2026-04-21",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
  {item:"Hairpin",cat:"Hairpin",customer:"",qty:2,rev:310,cost:136,date:"2026-04-21",pay:"Paid",due:0,ord:"Completed",disc:0,notes:""},
].map(s=>({...s,id:uid()}));

const SAMPLE_COSTS = [
  {item:"Mirror (5 pcs)",cat:"Mirror",qty:5,totalCost:2290,date:"2025-12-15",notes:"Batch 1",type:"purchase"},
  {item:"Rings (28 pcs)",cat:"Rings",qty:28,totalCost:1020,date:"2025-12-15",notes:"Batch 1",type:"purchase"},
  {item:"Claws (12 pcs)",cat:"Claw",qty:12,totalCost:1240,date:"2025-12-15",notes:"Batch 1",type:"purchase"},
  {item:"Rings (40 pcs)",cat:"Rings",qty:40,totalCost:962,date:"2025-12-20",notes:"Batch 2",type:"purchase"},
  {item:"Bangles (10 pcs)",cat:"Bangle",qty:10,totalCost:1286,date:"2026-01-01",notes:"Batch 1",type:"purchase"},
  {item:"Fish Claw (10 pcs)",cat:"Fish Claw",qty:10,totalCost:1171,date:"2026-01-15",notes:"Batch 1",type:"purchase"},
  {item:"Fish Claw (8 pcs)",cat:"Fish Claw",qty:8,totalCost:1189,date:"2026-02-15",notes:"Batch 2",type:"purchase"},
  {item:"Hairpin (15 pcs)",cat:"Hairpin",qty:15,totalCost:1012,date:"2026-02-15",notes:"Batch 1",type:"purchase"},
  {item:"Market Stall Fee",cat:"Other",qty:1,totalCost:250,date:"2026-01-01",notes:"Setup cost",type:"purchase"},
].map(c=>({...c,id:uid()}));

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function toast(msg,type='info'){
  const el=document.createElement('div');
  el.className=`toast toast-${type}`;
  el.innerHTML=`<div class="toast-dot"></div><div>${msg}</div>`;
  $('toast-stack').appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),300);},3000);
}
function showSync(v){$('sync-indicator').style.display=v?'flex':'none';}
function openModal(id){$(id).classList.add('open');}
function closeModal(id){$(id).classList.remove('open');}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id==='setup'?'s-setup':id==='auth'?'s-auth':'s-app').classList.add('active');$('loading').classList.add('hidden');}

function getTimeCutoff(){
  const p=$('time-filter')?.value||'all';
  if(p==='all') return null;
  const days={
    '30d':30,'3m':90,'6m':180,'1y':365,'3y':1095
  }[p];
  const d=new Date();
  d.setDate(d.getDate()-days);
  return d.toISOString().slice(0,10);
}

function filterByTime(arr){
  const cut=getTimeCutoff();
  if(!cut) return arr;
  return arr.filter(s=>s.date>=cut);
}

// Populate category selects
function populateCatSelects(){
  const opts = CATS.map(c=>`<option value="${c}">${c}</option>`).join('');
  const fOpts = `<option value="">All Categories</option>` + opts;
  const fCat = $('f-cat'); if(fCat) fCat.innerHTML = fOpts;
  const sfCat = $('f-catf'); if(sfCat) sfCat.innerHTML = opts;
  const cfCat = $('cf-cat'); if(cfCat) cfCat.innerHTML = opts;
  // Dashboard category filter — include ALL cats ever seen in data too
  const dashCat = $('dash-cat-filter');
  if(dashCat){
    const allCats = [...new Set([...CATS,...sales.map(s=>s.cat),...costsData.map(c=>c.cat)])].filter(Boolean);
    dashCat.innerHTML = `<option value="">All Categories</option>` + allCats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }
}

// ══════════════════════════════════════════════════════════════
// CONFIG + AUTH
// ══════════════════════════════════════════════════════════════
let supabaseClient = null;
function loadConfig(){cfg.clientId=lsGet('bms_supabase_url')||'';cfg.sheetId=lsGet('bms_supabase_key')||'';}
function saveSetup(){
  const cid=$('inp-client-id').value.trim();const sid=$('inp-sheet-id').value.trim();
  if(!cid||!sid){showErr('setup-err','Fill in both fields.');return;}
  lsSet('bms_supabase_url',cid);lsSet('bms_supabase_key',sid);
  cfg.clientId=cid;cfg.sheetId=sid;hideErr('setup-err');showScreen('auth');populateAuthScreen();
}
function populateAuthScreen(){const t=s=>s.length>30?s.slice(0,16)+'…'+s.slice(-8):s;$('disp-client-id').textContent=t(cfg.clientId);$('disp-sheet-id').textContent=t(cfg.sheetId);}
function resetSetup(){supabaseClient=null;showScreen('auth');populateAuthScreen();}
function showErr(id,msg){const e=$(id);e.style.display='block';e.textContent=msg;}
function hideErr(id){$(id).style.display='none';}

async function signIn(){
  hideErr('auth-err');const btn=$('btn-signin');btn.disabled=true;
  btn.innerHTML='<div class="spinner" style="border-color:rgba(0,0,0,.2);border-top-color:#0a0808"></div> Connecting…';
  try {
    supabaseClient = supabase.createClient(cfg.clientId, cfg.sheetId);
    $('loading').classList.remove('hidden');
    await Promise.all([fetchSales(),fetchCosts()]);
    initApp();showScreen('app');
  } catch(e) {
    $('loading').classList.add('hidden');
    btn.disabled=false;btn.innerHTML='Connect to Supabase';
    showErr('auth-err','Auth failed: '+e.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SUPABASE API
// ══════════════════════════════════════════════════════════════
async function fetchSales(){
  const { data, error } = await supabaseClient.from('bms_sales').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data || [];
  if(rows.length===0){sales=SAMPLE_SALES;await bulkWriteSales();return;}
  sales=rows.map((r,i)=>({_row:i+2,id:r.id||uid(),item:r.item||'',cat:r.cat||'Rings',customer:r.customer||'',qty:+r.qty||1,rev:+r.rev||0,cost:+r.cost||0,date:r.date||'',pay:r.pay||'Paid',due:+r.due||0,ord:r.ord||'Completed',disc:+r.disc||0,notes:r.notes||'',batchRef:r.batch_ref||''}));
}

async function fetchCosts(){
  const { data, error } = await supabaseClient.from('bms_costs').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data || [];
  if(rows.length===0){costsData=SAMPLE_COSTS;await bulkWriteCosts();return;}
  costsData=rows.map((r,i)=>({_row:i+2,id:r.id||uid(),item:r.item||'',cat:r.cat||'Other',qty:+r.qty||1,totalCost:+r.total_cost||0,date:r.date||'',notes:r.notes||'',type:r.type||'purchase',missingFromBox:+r.missing_from_box||0,refundReceived:+r.refund_received||0,batchNum:+r.batch_num||0}));
}

async function refreshData(){showSync(true);try{await Promise.all([fetchSales(),fetchCosts()]);renderCurrentPage();toast('Refreshed','success');}catch(e){toast('Refresh failed: '+e.message,'error');}showSync(false);}

async function bulkWriteSales(){
  const rows=sales.map(s=>({id:s.id,item:s.item,cat:s.cat,customer:s.customer,qty:s.qty,rev:s.rev,cost:s.cost,date:s.date,pay:s.pay,due:s.due,ord:s.ord,disc:s.disc,notes:s.notes,batch_ref:s.batchRef}));
  await supabaseClient.from('bms_sales').insert(rows);
  await fetchSales();
}
async function bulkWriteCosts(){
  const rows=costsData.map(c=>({id:c.id,item:c.item,cat:c.cat,qty:c.qty,total_cost:c.totalCost,date:c.date,notes:c.notes,type:c.type,missing_from_box:c.missingFromBox,refund_received:c.refundReceived,batch_num:c.batchNum}));
  await supabaseClient.from('bms_costs').insert(rows);
  await fetchCosts();
}

async function appendRow(tab,headers,obj){
  const table = tab === SALES_TAB ? 'bms_sales' : 'bms_costs';
  let dbObj;
  if(tab===SALES_TAB) dbObj={id:obj.id,item:obj.item,cat:obj.cat,customer:obj.customer,qty:obj.qty,rev:obj.rev,cost:obj.cost,date:obj.date,pay:obj.pay,due:obj.due,ord:obj.ord,disc:obj.disc,notes:obj.notes,batch_ref:obj.batchRef};
  else dbObj={id:obj.id,item:obj.item,cat:obj.cat,qty:obj.qty,total_cost:obj.totalCost,date:obj.date,notes:obj.notes,type:obj.type,missing_from_box:obj.missingFromBox,refund_received:obj.refundReceived,batch_num:obj.batchNum};
  const { error } = await supabaseClient.from(table).insert(dbObj);
  if(error) throw error;
}
async function updateRow(tab,row,headers,obj){
  const table = tab === SALES_TAB ? 'bms_sales' : 'bms_costs';
  let dbObj;
  if(tab===SALES_TAB) dbObj={item:obj.item,cat:obj.cat,customer:obj.customer,qty:obj.qty,rev:obj.rev,cost:obj.cost,date:obj.date,pay:obj.pay,due:obj.due,ord:obj.ord,disc:obj.disc,notes:obj.notes,batch_ref:obj.batchRef};
  else dbObj={item:obj.item,cat:obj.cat,qty:obj.qty,total_cost:obj.totalCost,date:obj.date,notes:obj.notes,type:obj.type,missing_from_box:obj.missingFromBox,refund_received:obj.refundReceived,batch_num:obj.batchNum};
  const { error } = await supabaseClient.from(table).update(dbObj).eq('id', obj.id);
  if(error) throw error;
}
async function deleteById(table, id){
  const { error } = await supabaseClient.from(table).delete().eq('id', id);
  if(error) throw error;
}

// ══════════════════════════════════════════════════════════
// APP INIT
// ══════════════════════════════════════════════════════════
function initApp(){
  $('conn-sheet-label').textContent=cfg.sheetId.slice(0,18)+'…';
  populateCatSelects();
  nav('dashboard');
}

function nav(pg){
  currentPage=pg;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  $(`nav-${pg}`)?.classList.add('active');
  ['dashboard','sales','customers','costs'].forEach(p=>{$(p===pg?`page-${p}`:`page-${p}`).style.display=p===pg?'':'none';});
  const titles={dashboard:'Dashboard',sales:'Sales <span>Records</span>',customers:'Customers',costs:'Costs &amp; <span>Shipments</span>'};
  $('topbar-title').innerHTML=titles[pg];
  $('btn-add-sale').style.display=pg==='sales'?'flex':'none';
  $('btn-add-cost').style.display=pg==='costs'?'flex':'none';
  renderCurrentPage();
}

function renderCurrentPage(){
  if(currentPage==='dashboard') renderDashboard();
  else if(currentPage==='sales') renderSales();
  else if(currentPage==='customers') renderCustomers();
  else if(currentPage==='costs') renderCosts();
}

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
function renderDashboard(){
  const catFilter=$('dash-cat-filter')?.value||'';
  let baseSales=catFilter?sales.filter(s=>s.cat===catFilter):sales;
  const filtered=filterByTime(baseSales);
  const totalRev   =filtered.reduce((a,s)=>a+(+s.rev||0),0);
  const totalProfit=filtered.reduce((a,s)=>a+profit(s),0);
  const totalCost  =filtered.reduce((a,s)=>a+(+s.cost||0),0);
  const totalDue   =filtered.reduce((a,s)=>a+(+s.due||0),0);
  const period=$('time-filter')?.value||'all';
  const pLabel={'all':'All Time','30d':'Last 30 Days','3m':'Last 3 Months','6m':'Last 6 Months','1y':'Last Year','3y':'Last 3 Years'}[period];
  const catLabel=catFilter?` · ${catFilter}`:'';
  $('dash-period-label').textContent=`Showing: ${pLabel}${catLabel} · ${filtered.length} sales`;

  const totalOrders=filtered.length;
  const aov=totalOrders?Math.round(totalRev/totalOrders):0;
  animNum('kpi-rev',totalRev);animNum('kpi-profit',totalProfit);animNum('kpi-cost',totalCost);animNum('kpi-due',totalDue);animNum('kpi-aov',aov);
  $('kpi-rev-sub').textContent=`${filtered.length} sales`;
  $('kpi-profit-sub').textContent=`${pct(totalProfit,totalRev)} margin`;
  $('kpi-cost-sub').textContent='cost of goods sold';
  $('kpi-due-sub').textContent=`${filtered.filter(s=>s.due>0).length} unpaid orders`;
  $('kpi-aov-sub').textContent=`revenue ÷ ${totalOrders} orders`;

  renderCharts(filtered);
  const recent=[...filtered].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  $('recent-sales').innerHTML=recent.length?recent.map(s=>`
    <div class="recent-sale">
      <div><div class="rs-item">${escH(s.item)}</div><div class="rs-meta">${escH(s.customer)||'—'} · ${s.date}</div></div>
      <div class="rs-amount">${fmt(s.rev)}</div>
    </div>`).join(''):'<div style="color:var(--text3);font-size:12px;padding:20px 0;text-align:center">No sales in this period</div>';
}

function animNum(id,val){
  const el=$(id);const d=600;const s=Date.now();
  const step=()=>{const p=Math.min((Date.now()-s)/d,1);const cur=val*(1-Math.pow(1-p,3));el.textContent=fmt(Math.round(cur));if(p<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

function renderCharts(data){
  const monthly={};
  data.forEach(s=>{
    const m=s.date?.slice(0,7);if(!m)return;
    if(!monthly[m])monthly[m]={revenue:0,profit:0,cost:0};
    monthly[m].revenue+=+s.rev||0;monthly[m].profit+=profit(s);monthly[m].cost+=+s.cost||0;
  });
  const mKeys=Object.keys(monthly).sort().slice(-8);
  const mLabels=mKeys.map(k=>{const[,m]=k.split('-');return['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]+"'"+k.slice(2,4);});
  const mRev=mKeys.map(k=>monthly[k].revenue);
  const mPro=mKeys.map(k=>monthly[k].profit);
  const mCos=mKeys.map(k=>monthly[k].cost);

  destroyChart('line');
  charts.line=new Chart($('chart-line'),{type:'line',data:{labels:mLabels,datasets:[
    {label:'Revenue',data:mRev,borderColor:'#c9a853',backgroundColor:'rgba(201,168,83,.08)',tension:.4,borderWidth:2.5,pointBackgroundColor:'#c9a853',pointRadius:4,fill:true},
    {label:'Profit',data:mPro,borderColor:'#4ade80',backgroundColor:'rgba(74,222,128,.05)',tension:.4,borderWidth:2,pointBackgroundColor:'#4ade80',pointRadius:4,fill:true},
  ]},options:cOpts({y:{ticks:{callback:v=>'৳'+v}}})});

  const catRevs=CATS.map(c=>data.filter(s=>s.cat===c).reduce((a,s)=>a+(+s.rev||0),0));
  const catLabs=CATS.filter((_,i)=>catRevs[i]>0);
  const catVals=catRevs.filter(v=>v>0);
  const catCols=catLabs.map(c=>CAT_COLORS[c]||'#888');

  destroyChart('doughnut');
  charts.doughnut=new Chart($('chart-doughnut'),{type:'doughnut',data:{labels:catLabs,datasets:[{data:catVals,backgroundColor:catCols,borderColor:'rgba(0,0,0,0)',hoverOffset:6}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fmt(ctx.raw)}`}}},cutout:'72%',animation:{animateScale:true}}});
  $('chart-legend').innerHTML=catLabs.map((l,i)=>`<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2)"><span style="width:7px;height:7px;border-radius:50%;background:${catCols[i]};display:inline-block"></span>${l}</span>`).join('');

  destroyChart('bar');
  charts.bar=new Chart($('chart-bar'),{type:'bar',data:{labels:mLabels,datasets:[
    {label:'Revenue',data:mRev,backgroundColor:'rgba(201,168,83,.7)',borderRadius:5,borderSkipped:false},
    {label:'Profit',data:mPro,backgroundColor:'rgba(74,222,128,.6)',borderRadius:5,borderSkipped:false},
    {label:'Cost',data:mCos,backgroundColor:'rgba(96,165,250,.4)',borderRadius:5,borderSkipped:false},
  ]},options:cOpts({y:{ticks:{callback:v=>'৳'+v}}})});
}

function destroyChart(k){if(charts[k]){charts[k].destroy();delete charts[k];}}
function cOpts(extra={}){return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#161628',borderColor:'#1c1c32',borderWidth:1,titleColor:'#ede8d8',bodyColor:'#8888aa',padding:10,callbacks:{label:ctx=>`${ctx.dataset.label}: ${fmt(ctx.raw)}`}}},scales:{x:{grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#8888aa',font:{size:10,family:'DM Sans'}}},y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#8888aa',font:{size:10,family:'DM Sans'},...extra.y?.ticks},...extra.y}}};}

// ══════════════════════════════════════════════════════════
// SALES
// ══════════════════════════════════════════════════════════
function getFiltered(){
  const q=$('search-input')?.value.toLowerCase()||'';
  const fCat=$('f-cat')?.value||'';const fPay=$('f-pay')?.value||'';
  const fFrom=$('f-from')?.value||'';const fTo=$('f-to')?.value||'';
  const fMinR=parseFloat($('f-minr')?.value)||0;const fMaxR=parseFloat($('f-maxr')?.value)||0;
  return [...sales].filter(s=>{
    if(q&&!`${s.item} ${s.customer} ${s.cat}`.toLowerCase().includes(q))return false;
    if(fCat&&s.cat!==fCat)return false;if(fPay&&s.pay!==fPay)return false;
    if(fFrom&&s.date<fFrom)return false;if(fTo&&s.date>fTo)return false;
    if(fMinR&&(+s.rev||0)<fMinR)return false;if(fMaxR&&(+s.rev||0)>fMaxR)return false;
    return true;
  }).sort((a,b)=>{
    const col=sortState.col;let av,bv;
    if(col==='profit'){av=profit(a);bv=profit(b);}
    else if(['rev','cost','due','qty'].includes(col)){av=+a[col]||0;bv=+b[col]||0;}
    else{av=a[col]||'';bv=b[col]||'';}
    return sortState.dir==='asc'?(av>bv?1:-1):(av<bv?1:-1);
  });
}

function renderSales(){
  const filtered=getFiltered();
  const fRev=filtered.reduce((a,s)=>a+(+s.rev||0),0);
  const fPro=filtered.reduce((a,s)=>a+profit(s),0);
  const fDue=filtered.reduce((a,s)=>a+(+s.due||0),0);
  $('summary-bar').innerHTML=`<strong>${filtered.length}</strong> <span class="summary-sep">results</span> <span class="summary-sep">·</span> Revenue <span class="summary-num" style="color:var(--gold)">${fmt(fRev)}</span> <span class="summary-sep">·</span> Profit <span class="summary-num" style="color:var(--green)">${fmt(fPro)}</span>${fDue>0?` <span class="summary-sep">·</span> Due <span class="summary-num" style="color:var(--red)">${fmt(fDue)}</span>`:''}`;

  const cols=[
    {key:'_sl',label:'#',noSort:true},
    {key:'item',label:'Item'},{key:'cat',label:'Category'},{key:'customer',label:'Customer'},
    {key:'qty',label:'Qty'},{key:'rev',label:'Revenue'},{key:'cost',label:'Cost'},
    {key:'profit',label:'Profit'},{key:'date',label:'Date'},{key:'pay',label:'Payment'},
    {key:'ord',label:'Order'},{key:'due',label:'Due'},{key:'notes',label:'Notes',noSort:true},{key:'_act',label:'',noSort:true}
  ];
  $('table-head').innerHTML=cols.map(c=>{
    const cls=c.noSort?'no-sort':sortState.col===c.key?`sort-${sortState.dir}`:'';
    const onclick=c.noSort?'':`onclick="toggleSort('${c.key}')"`;
    return `<th class="${cls}" ${onclick}>${c.label}</th>`;
  }).join('');

  if(!filtered.length){
    $('table-body').innerHTML=`<tr class="empty-row"><td colspan="${cols.length}"><div class="empty-icon">◇</div><div class="empty-text">No sales found</div><div class="empty-sub">Adjust filters or add a new sale</div></td></tr>`;
    return;
  }
  $('table-body').innerHTML=filtered.map((s,i)=>{
    const p=profit(s);
    return `<tr style="animation:fadeUp .15s ${i*.025}s both;cursor:context-menu" oncontextmenu="showCtxMenu(event,'sale','${s.id}',${s._row||0})">
      <td class="sl-cell">${i+1}</td>
      <td style="font-weight:500;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis">${escH(s.item)}${s.batchRef?renderBatchBadge(s.batchRef):''}</td>
      <td><span class="cell-cat" style="color:${CAT_COLORS[s.cat]||'var(--text2)'}">${escH(s.cat)}</span></td>
      <td style="color:${s.customer?'var(--text)':'var(--text3)'}">${escH(s.customer)||'—'}</td>
      <td class="num-cell" style="text-align:center;color:var(--text2)">${s.qty}</td>
      <td class="num-cell num-gold">${fmt(s.rev)}</td>
      <td class="num-cell" style="color:var(--text2)">${s.cost?fmt(s.cost):'—'}</td>
      <td class="num-cell ${p>=0?'num-green':'num-red'}">${fmt(p)}</td>
      <td class="num-cell" style="color:var(--text2);font-size:12px">${s.date}</td>
      <td><span class="badge badge-${s.pay}">${s.pay}</span></td>
      <td><span class="badge badge-${s.ord}">${s.ord}</span></td>
      <td class="num-cell ${s.due>0?'num-red':''}">${s.due>0?fmt(s.due):'<span style="color:var(--text3)">—</span>'}</td>
      <td style="color:var(--text2);font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escH(s.notes)||'—'}</td>
      <td><div class="row-actions">
        <button class="row-btn row-btn-edit" onclick="openEditSale('${s.id}')" title="Edit"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="row-btn row-btn-del" onclick="confirmDel('${s.id}',${s._row||0},'sale')" title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
}

function toggleSort(col){if(sortState.col===col)sortState.dir=sortState.dir==='asc'?'desc':'asc';else{sortState.col=col;sortState.dir='desc';}renderSales();}
function toggleFilters(){filterOpen=!filterOpen;$('filter-grid').style.display=filterOpen?'grid':'none';$('btn-filter-toggle').classList.toggle('active',filterOpen);}
function applyFilters(){
  const count=['f-cat','f-pay','f-from','f-to','f-minr','f-maxr'].filter(id=>$(id)?.value).length+($('search-input')?.value?1:0);
  const badge=$('filter-badge');badge.style.display=count?'flex':'none';badge.textContent=count;
  $('btn-filter-toggle').classList.toggle('active',count>0||filterOpen);
  $('btn-clear-filters').style.display=count?'flex':'none';renderSales();
}
function clearFilters(){['f-cat','f-pay','f-from','f-to','f-minr','f-maxr'].forEach(id=>{if($(id))$(id).value='';});if($('search-input'))$('search-input').value='';applyFilters();}

// ══════════════════════════════════════════════════════════
// ADD / EDIT SALE
// ══════════════════════════════════════════════════════════
function openAddSale(){editId=null;$('modal-title').textContent='Add New Sale';$('btn-save-sale').textContent='Save Sale';setSaleForm({cat:'Rings'});setTimeout(autoFillSaleCost,0);openModal('m-sale');}
function openEditSale(id){const s=sales.find(x=>x.id===id);if(!s)return;editId=id;$('modal-title').textContent='Edit Sale';$('btn-save-sale').textContent='Save Changes';setSaleForm(s);openModal('m-sale');}
function setSaleForm(s){
  $('f-item').value=s.item||'';$('f-catf').value=s.cat||'Rings';$('f-cust').value=s.customer||'';
  $('f-qty').value=s.qty||1;$('f-date').value=s.date||today();$('f-rev').value=s.rev||'';
  $('f-cost').value=s.cost||'';$('f-due').value=s.due||'';$('f-disc').value=s.disc||'';
  $('f-pay-f').value=s.pay||'Paid';$('f-ord-f').value=s.ord||'Completed';$('f-notes').value=s.notes||'';
  const hint=$('f-cost-hint');if(hint)hint.textContent=editId?'manual':'';
  populateSaleBatchDropdown(s.cat||'Rings', s.batchRef||'');
  updateProfitPreview();
}
// Populate the batch selector for the chosen category
function populateSaleBatchDropdown(cat, selectedBatchRef=''){
  const sel=$('f-batchref');if(!sel)return;
  const {batches}=getFIFOBatches(cat||'');
  const available=batches.filter(b=>b.remainingQty>0||(selectedBatchRef&&b.id===selectedBatchRef));
  sel.innerHTML=`<option value="">&#x26A1; FIFO Auto (oldest stock first)</option>`
    + available.map(b=>{
      const label=b.batchNum?`Batch ${b.batchNum}`:(b.notes||b.item||'Unknown batch');
      return `<option value="${b.id}">${label} — ${b.remainingQty} left @ ${fmt(b.costPerUnit)}/unit · ${b.date}</option>`;
    }).join('');
  sel.value=selectedBatchRef||'';
  const wrap=$('f-batch-wrap');
  if(wrap) wrap.style.display=(cat&&cat!=='Other')&&available.length?'':'none';
}
// When user manually picks a batch → override cost
function onSaleBatchChange(){
  const batchId=$('f-batchref')?.value;
  if(!batchId){autoFillSaleCost();return;}
  const batch=costsData.find(c=>c.id===batchId);
  if(!batch)return;
  const qty=+$('f-qty')?.value||1;
  const effQty=Math.max(1,(+batch.qty||1)-(+batch.missingFromBox||0));
  const effCost=Math.max(0,(+batch.totalCost||0)-(+batch.refundReceived||0));
  const cpu=effQty?Math.round(effCost/effQty):0;
  $('f-cost').value=cpu*qty;
  const hint=$('f-cost-hint');
  if(hint){const bn=batch.batchNum?('Batch '+batch.batchNum):(batch.notes||'');hint.textContent='Manual batch'+(bn?' · '+bn:'');}
  updateProfitPreview();
}
function updateProfitPreview(){
  const r=parseFloat($('f-rev').value)||0,c=parseFloat($('f-cost').value)||0;
  const pr=$('profit-preview');const v=$('profit-preview-val');
  if(r||c){pr.style.display='flex';const p=r-c;v.textContent=fmt(p)+(r?` (${pct(p,r)} margin)`:'');v.style.color=p>=0?'var(--green)':'var(--red)';}
  else pr.style.display='none';
}
// FIFO: calculate cost of selling next qty units from a category
function getFIFOCostForSale(cat,qty){
  if(!cat||cat==='Other')return{total:0,cpu:0,batch:null};
  const {batches}=getFIFOBatches(cat);
  let remaining=qty;let totalCost=0;let firstBatch=null;
  for(const b of batches){
    if(b.remainingQty<=0)continue;
    if(!firstBatch)firstBatch=b;
    const take=Math.min(remaining,b.remainingQty);
    totalCost+=take*b.costPerUnit;
    remaining-=take;
    if(remaining<=0)break;
  }
  const cpu=qty?Math.round(totalCost/qty):0;
  return{total:totalCost,cpu,batch:firstBatch};
}
function autoFillSaleCost(){
  const cat=$('f-catf')?.value;
  const qty=+$('f-qty')?.value||1;
  // Repopulate batch dropdown whenever category or qty changes
  populateSaleBatchDropdown(cat, $('f-batchref')?.value||'');
  const batchId=$('f-batchref')?.value;
  // If user picked a specific batch, respect it
  if(batchId){onSaleBatchChange();return;}
  // Only auto-fill on new sales, not edits (don't clobber manually set costs)
  if(editId)return;
  const {total,cpu,batch}=getFIFOCostForSale(cat,qty);
  const hint=$('f-cost-hint');
  if(cpu>0){
    $('f-cost').value=total;
    if(hint){const batchLabel=batch?.batchNum?('Batch '+batch.batchNum):(batch?.notes||'');hint.textContent='FIFO auto'+(batchLabel?' · '+batchLabel:'');}
  }else{
    if(hint)hint.textContent=cat&&cat!=='Other'?'no stock data':'';
  }
  updateProfitPreview();
}
async function saveSale(){
  const item=$('f-item').value.trim();if(!item){toast('Item name required','error');return;}
  const entry={id:editId||uid(),item,cat:$('f-catf').value,customer:$('f-cust').value.trim(),qty:+$('f-qty').value||1,date:$('f-date').value,rev:+$('f-rev').value||0,cost:+$('f-cost').value||0,due:+$('f-due').value||0,disc:+$('f-disc').value||0,pay:$('f-pay-f').value,ord:$('f-ord-f').value,notes:$('f-notes').value.trim(),batchRef:$('f-batchref')?.value||''};
  const btn=$('btn-save-sale');btn.disabled=true;showSync(true);closeModal('m-sale');
  try{
    if(editId){const ex=sales.find(s=>s.id===editId);entry._row=ex._row;await updateRow(SALES_TAB,entry._row,SALE_HEADERS,entry);const i=sales.findIndex(s=>s.id===editId);sales[i]=entry;toast('Sale updated ✦','success');}
    else{await appendRow(SALES_TAB,SALE_HEADERS,entry);await fetchSales();toast('Sale added ✦','success');}
    renderCurrentPage();
  }catch(e){toast('Save failed: '+e.message,'error');}
  btn.disabled=false;showSync(false);
}

// ══════════════════════════════════════════════════════════
// ADD / EDIT COST
// ══════════════════════════════════════════════════════════
function openAddCost(){editCostId=null;$('cost-modal-title').textContent='Add Shipment';$('btn-save-cost').textContent='Save Shipment';setCostForm({});openModal('m-cost');}
function openEditCost(id){const c=costsData.find(x=>x.id===id);if(!c)return;editCostId=id;$('cost-modal-title').textContent='Edit Shipment';setCostForm(c);openModal('m-cost');}
function getNextBatchNum(cat){
  const existing=costsData.filter(c=>c.cat===cat&&(c.type||'purchase')==='purchase'&&c.batchNum>0).map(c=>+c.batchNum);
  return existing.length?Math.max(...existing)+1:1;
}
function setCostForm(c){
  $('cf-item').value=c.item||'';
  $('cf-cat').value=c.cat||CATS[0]||'Rings';
  $('cf-qty').value=c.qty||1;
  $('cf-total').value=c.totalCost||'';
  $('cf-date').value=c.date||today();
  $('cf-notes').value=c.notes||'';
  $('cf-type').value=c.type||'purchase';
  $('cf-box-missing').value=c.missingFromBox||0;
  $('cf-refund-amt').value=c.refundReceived||0;
  // Batch num: if editing use existing, if new auto-suggest
  $('cf-batch').value=c.batchNum||(editCostId?'':getNextBatchNum(c.cat||CATS[0]||'Rings'));
  updateCostPreview();
}
// Re-suggest batch number when category changes on add
function onCostCatChange(){
  if(!editCostId){$('cf-batch').value=getNextBatchNum($('cf-cat').value);}
  updateCostPreview();
}
function updateCostPreview(){
  const type=$('cf-type')?.value||'purchase';
  const isPurchase=type==='purchase';
  const totalInput=$('cf-total');
  const lbl=$('cf-cost-label');

  // Show/hide purchase-only adjustment fields
  $('cf-box-missing-wrap').style.display=isPurchase?'':'none';
  $('cf-refund-amt-wrap').style.display=isPurchase?'':'none';

  // Handle missing type: lock cost at 0
  if(type==='missing'){
    totalInput.value='0';totalInput.disabled=true;totalInput.style.opacity='0.4';totalInput.style.cursor='not-allowed';
    if(lbl){lbl.textContent='(auto \u09f30 \u2014 write-off)';lbl.style.color='var(--amber)';}
  }else{
    totalInput.disabled=false;totalInput.style.opacity='';totalInput.style.cursor='';
    if(lbl){
      if(type==='refund'){lbl.textContent='(amount recovered from supplier)';lbl.style.color='var(--green)';}
      else{lbl.textContent='(leave 0 if unknown)';lbl.style.color='var(--text3)';}
    }
  }

  const orderedQty=+$('cf-qty').value||0;
  const totalCost=+totalInput.value||0;
  const missingQty=isPurchase?(+$('cf-box-missing').value||0):0;
  const refundAmt=isPurchase?(+$('cf-refund-amt').value||0):0;
  const effQty=Math.max(0,orderedQty-missingQty);
  const effCost=Math.max(0,totalCost-refundAmt);

  const pr=$('cost-preview');
  const oldWrap=$('cost-preview-old-wrap');
  const extraDiv=$('cost-preview-extra');

  if(orderedQty&&(totalCost||type==='missing')){
    pr.style.display='flex';
    if(type==='missing'){
      $('cost-preview-val').textContent=orderedQty+' unit'+(orderedQty>1?'s':'')+' written off \u2014 \u09f30 cost';
      $('cost-preview-val').style.color='var(--amber)';
      oldWrap.style.display='none';extraDiv.textContent='';
    }else if(type==='refund'){
      const cpu=orderedQty?Math.round(totalCost/orderedQty):0;
      $('cost-preview-val').textContent=fmt(cpu)+' per unit \u00b7 '+fmt(totalCost)+' total recovered';
      $('cost-preview-val').style.color='var(--green)';
      oldWrap.style.display='none';extraDiv.textContent='';
    }else{
      // Purchase with optional adjustments
      const origCpu=orderedQty&&totalCost?Math.round(totalCost/orderedQty):0;
      const newCpu=effQty&&effCost?Math.round(effCost/effQty):origCpu;
      $('cost-preview-val').textContent=fmt(newCpu)+' per unit';
      $('cost-preview-val').style.color='var(--blue)';
      if((missingQty>0||refundAmt>0)&&origCpu&&newCpu!==origCpu){
        oldWrap.style.display='flex';
        $('cost-preview-old').textContent=fmt(origCpu)+' per unit';
        extraDiv.textContent=(missingQty>0?missingQty+' missing \u2192 '+effQty+' effective units':'')+(missingQty>0&&refundAmt>0?' \u00b7 ':'')+(refundAmt>0?fmt(refundAmt)+' refund \u2192 '+fmt(effCost)+' net cost':'');
        extraDiv.style.color='var(--text3)';
      }else{oldWrap.style.display='none';extraDiv.textContent='';}
    }
  }else pr.style.display='none';
}
async function saveCost(){
  const item=$('cf-item').value.trim();if(!item){toast('Item name required','error');return;}
  const type=$('cf-type').value||'purchase';
  const batchNum=+$('cf-batch').value||0;
  const entry={id:editCostId||uid(),item,cat:$('cf-cat').value,qty:+$('cf-qty').value||1,totalCost:type==='missing'?0:(+$('cf-total').value||0),date:$('cf-date').value,notes:$('cf-notes').value.trim(),type,missingFromBox:type==='purchase'?(+$('cf-box-missing').value||0):0,refundReceived:type==='purchase'?(+$('cf-refund-amt').value||0):0,batchNum};
  const btn=$('btn-save-cost');btn.disabled=true;showSync(true);closeModal('m-cost');
  try{
    if(editCostId){const ex=costsData.find(c=>c.id===editCostId);entry._row=ex._row;await updateRow(COSTS_TAB,entry._row,COST_HEADERS,entry);const i=costsData.findIndex(c=>c.id===editCostId);costsData[i]=entry;toast('Shipment updated','success');}
    else{await appendRow(COSTS_TAB,COST_HEADERS,entry);await fetchCosts();toast('Shipment added','success');}
    renderCurrentPage();
  }catch(e){toast('Save failed: '+e.message,'error');}
  btn.disabled=false;showSync(false);
}

// ══════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════
function confirmDel(id,row,type){pendingDeleteId=id;pendingDeleteRow=row;pendingDeleteType=type;resetConfirmInput();openModal('m-confirm');setTimeout(()=>$('confirm-type-input')?.focus(),200);}
function resetConfirmInput(){const inp=$('confirm-type-input');if(inp)inp.value='';const btn=$('btn-confirm-del');if(btn){btn.disabled=true;btn.style.opacity='.35';btn.style.cursor='not-allowed';}}
function onConfirmType(){const v=$('confirm-type-input')?.value||'';const ok=v==='CONFIRM';const btn=$('btn-confirm-del');if(btn){btn.disabled=!ok;btn.style.opacity=ok?'1':'.35';btn.style.cursor=ok?'pointer':'not-allowed';}}
$('btn-confirm-del').onclick=async function(){
  if(!pendingDeleteId||$('confirm-type-input')?.value!=='CONFIRM')return;resetConfirmInput();closeModal('m-confirm');showSync(true);
  try{
    if(pendingDeleteType==='sale'){
      await deleteById('bms_sales', pendingDeleteId);
      sales=sales.filter(s=>s.id!==pendingDeleteId);
      await fetchSales();toast('Sale deleted','info');
    } else {
      await deleteById('bms_costs', pendingDeleteId);
      costsData=costsData.filter(c=>c.id!==pendingDeleteId);
      await fetchCosts();toast('Shipment deleted','info');
    }
    renderCurrentPage();
  }catch(e){toast('Delete failed: '+e.message,'error');}
  showSync(false);pendingDeleteId=null;resetConfirmInput();
};

// ══════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════
function getCustomers(){
  const map={};
  sales.forEach(s=>{
    const k=s.customer||'—';
    if(!map[k])map[k]={name:k,orders:0,revenue:0,profit:0,due:0,last:''};
    map[k].orders++;map[k].revenue+=+s.rev||0;map[k].profit+=profit(s);map[k].due+=+s.due||0;
    if(s.date>map[k].last)map[k].last=s.date;
  });
  return Object.values(map).sort((a,b)=>b.revenue-a.revenue);
}

function renderCustomers(selected=null){
  const list=$('customers-list');const detail=$('customer-detail');
  if(selected){
    list.style.display='none';detail.style.display='';
    const cs=[...sales].filter(s=>(s.customer||'—')===selected).sort((a,b)=>b.date.localeCompare(a.date));
    const rev=cs.reduce((a,s)=>a+(+s.rev||0),0);const pr=cs.reduce((a,s)=>a+profit(s),0);const due=cs.reduce((a,s)=>a+(+s.due||0),0);
    detail.innerHTML=`
      <div class="cust-detail-header">
        <button class="back-btn" onclick="renderCustomers()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back</button>
        <div class="cust-detail-name">${escH(selected)}</div>
      </div>
      <div class="kpi-grid" style="margin-bottom:22px;grid-template-columns:repeat(4,1fr)">
        <div class="kpi-card" style="--kpi-color:var(--gold)"><div class="kpi-label">LTV (Lifetime Value)</div><div class="kpi-value" style="color:var(--gold)">${fmt(rev)}</div><div class="kpi-sub">total revenue ever</div><div class="kpi-bar" style="width:90%"></div></div>
        <div class="kpi-card" style="--kpi-color:var(--green)"><div class="kpi-label">Total Profit</div><div class="kpi-value" style="color:var(--green)">${fmt(pr)}</div><div class="kpi-sub">${pct(pr,rev)} margin</div><div class="kpi-bar" style="width:65%;background:linear-gradient(90deg,var(--green),transparent)"></div></div>
        <div class="kpi-card" style="--kpi-color:var(--blue)"><div class="kpi-label">Total Orders</div><div class="kpi-value" style="color:var(--blue)">${cs.length}</div><div class="kpi-sub">across all time</div></div>
        <div class="kpi-card" style="--kpi-color:var(--red)"><div class="kpi-label">Outstanding Due</div><div class="kpi-value" style="color:var(--red)">${fmt(due)}</div><div class="kpi-sub">${cs.filter(s=>s.due>0).length} unpaid</div></div>
      </div>
      <div class="table-card"><div class="table-scroll"><table><thead><tr>
        ${['#','Item','Date','Revenue','Cost','Profit','Payment','Due','Order','Notes'].map(h=>`<th class="no-sort">${h}</th>`).join('')}
      </tr></thead><tbody>${cs.map((s,i)=>`<tr style="animation:fadeUp .12s ${i*.025}s both">
        <td class="sl-cell">${i+1}</td>
        <td style="font-weight:500">${escH(s.item)}</td>
        <td class="num-cell" style="color:var(--text2);font-size:12px">${s.date}</td>
        <td class="num-cell num-gold">${fmt(s.rev)}</td>
        <td class="num-cell" style="color:var(--text2)">${s.cost?fmt(s.cost):'—'}</td>
        <td class="num-cell ${profit(s)>=0?'num-green':'num-red'}">${fmt(profit(s))}</td>
        <td><span class="badge badge-${s.pay}">${s.pay}</span></td>
        <td class="num-cell ${s.due>0?'num-red':''}">${s.due>0?fmt(s.due):'<span style="color:var(--text3)">—</span>'}</td>
        <td><span class="badge badge-${s.ord}">${s.ord}</span></td>
        <td style="color:var(--text2);font-size:12px">${escH(s.notes)||'—'}</td>
      </tr>`).join('')}</tbody></table></div></div>`;
    return;
  }
  detail.style.display='none';list.style.display='';
  const custs=getCustomers();
  list.innerHTML=`<div class="cust-grid">${custs.map(c=>`
    <div class="cust-card" onclick="renderCustomers('${escH(c.name).replace(/'/g,"\\'")}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div class="cust-avatar">${c.name[0].toUpperCase()}</div>
        ${c.due>0?`<span class="cust-due-badge">DUE ${fmt(c.due)}</span>`:''}
      </div>
      <div class="cust-name">${escH(c.name)}</div>
      <div class="cust-meta">${c.orders} order${c.orders>1?'s':''} · Last: ${c.last||'—'}</div>
      <div class="ltv-badge">
        <div><div class="ltv-label">Lifetime Value</div></div>
        <div class="ltv-value">${fmt(c.revenue)}</div>
      </div>
      <div class="cust-stats">
        <div><div class="cust-stat-label">Profit</div><div class="cust-stat-val" style="color:${c.profit>=0?'var(--green)':'var(--red)'}">${fmt(c.profit)}</div></div>
        <div style="text-align:right"><div class="cust-stat-label">Margin</div><div class="cust-stat-val" style="color:${c.profit>=0?'var(--text2)':'var(--red)'}">${pct(c.profit,c.revenue)}</div></div>
      </div>
    </div>`).join('')}</div>`;
}

// ══════════════════════════════════════════════════════════
// FIFO BATCH CALCULATOR
// ══════════════════════════════════════════════════════════
function getFIFOBatches(cat){
  const purchases=costsData.filter(c=>c.cat===cat&&(c.type||'purchase')==='purchase').sort((a,b)=>a.date.localeCompare(b.date));
  const refunds=costsData.filter(c=>c.cat===cat&&c.type==='refund');
  const missing=costsData.filter(c=>c.cat===cat&&c.type==='missing');
  const soldQty=sales.filter(s=>s.cat===cat).reduce((a,s)=>a+(+s.qty||0),0);
  const refundedQty=refunds.reduce((a,c)=>a+(+c.qty||0),0);
  const missingQty=missing.reduce((a,c)=>a+(+c.qty||0),0);
  let toDeduct=soldQty+refundedQty+missingQty;
  const batches=purchases.map(b=>{
    const orderedQty=+b.qty||0;
    const missingFromBox=+b.missingFromBox||0;
    const refundReceived=+b.refundReceived||0;
    const effQty=Math.max(0,orderedQty-missingFromBox);
    const effCost=Math.max(0,(+b.totalCost||0)-refundReceived);
    const used=Math.min(toDeduct,effQty);
    toDeduct=Math.max(0,toDeduct-effQty);
    const origCpu=orderedQty?(+b.totalCost/orderedQty):0;
    const costPerUnit=effQty?Math.round(effCost/effQty):0;
    return{...b,originalQty:orderedQty,effQty,effCost,usedQty:used,remainingQty:effQty-used,costPerUnit,origCpu:Math.round(origCpu),hasAdjust:missingFromBox>0||refundReceived>0};
  });
  return{batches,refunds,missing,soldQty,refundedQty,missingQty,
    totalBought:batches.reduce((a,b)=>a+b.effQty,0),
    totalRemaining:batches.reduce((a,b)=>a+b.remainingQty,0)};
}

function openInvDetail(cat){
  const col=CAT_COLORS[cat]||'#888';
  const {batches,refunds,missing,soldQty,refundedQty,missingQty,totalBought,totalRemaining}=getFIFOBatches(cat);
  $('inv-detail-title').innerHTML=`<span style="color:${col}">●</span> ${escH(cat)} — Batch Breakdown`;
  const rows=batches.map((b,i)=>{
    const rem=b.remainingQty;const remCol=rem<=0?'var(--red)':rem<=2?'var(--amber)':'var(--green)';
    const batchLabel=b.batchNum?`<span style="background:var(--blue-dim);color:var(--blue);border:1px solid rgba(96,165,250,.2);border-radius:4px;padding:1px 7px;font-size:9px;font-weight:700;margin-right:6px">B${b.batchNum}</span>`:'';
    const adjustTag=b.hasAdjust?`<div style="font-size:9px;color:var(--amber);margin-top:2px">\u25b2 ${b.originalQty} ordered · ${b.originalQty-b.effQty} missing${b.refundReceived?` · ${fmt(b.refundReceived)} refunded`:''}</div>`:'';
    const cpuCell=b.hasAdjust?`<div style="color:var(--blue);font-weight:600">${fmt(b.costPerUnit)}</div><div style="font-size:9px;color:var(--text3);text-decoration:line-through">${fmt(b.origCpu)}</div>`:`<span style="color:var(--blue)">${fmt(b.costPerUnit)}</span>`;
    return`<tr style="animation:fadeUp .1s ${i*.04}s both">
      <td class="sl-cell">${i+1}</td>
      <td style="font-weight:500;font-size:12px">${batchLabel}${escH(b.item)}${adjustTag}</td>
      <td class="num-cell" style="color:var(--text2);font-size:11px">${b.date}</td>
      <td class="num-cell" style="text-align:center;color:var(--text2)">${b.effQty}${b.hasAdjust?`<span style="color:var(--text3);font-size:9px;display:block">of ${b.originalQty}</span>`:''}</td>
      <td class="num-cell" style="text-align:center;color:var(--text3)">${b.usedQty}</td>
      <td class="num-cell" style="text-align:center;color:${remCol};font-weight:700">${rem}</td>
      <td class="num-cell">${cpuCell}</td>
      <td style="font-size:11px;color:var(--text3)">${escH(b.notes)||'—'}</td>
    </tr>`;
  }).join('');
  const adjRows=[...refunds.map(r=>`<tr><td colspan="8" style="padding:8px 12px;font-size:12px">
    <span style="background:var(--green-dim);color:var(--green);border:1px solid rgba(74,222,128,.2);border-radius:5px;padding:2px 8px;font-weight:600;font-size:11px">REFUND</span>
    <span style="margin-left:10px;color:var(--text2)">${escH(r.item)} · ${r.qty} units · ${r.date} · ${fmt(r.totalCost)} recovered</span></td></tr>`),...missing.map(m=>`<tr><td colspan="8" style="padding:8px 12px;font-size:12px">
    <span style="background:var(--amber-dim);color:var(--amber);border:1px solid rgba(251,191,36,.2);border-radius:5px;padding:2px 8px;font-weight:600;font-size:11px">MISSING</span>
    <span style="margin-left:10px;color:var(--text2)">${escH(m.item)} · ${m.qty} units written off · ${m.date}</span></td></tr>`)].join('');
  $('inv-detail-body').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Bought</div>
        <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:var(--text)">${totalBought}</div>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Sold</div>
        <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:var(--gold)">${soldQty}</div>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Adjustments</div>
        <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:var(--amber)">${refundedQty+missingQty}</div>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:4px">Remaining</div>
        <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:${totalRemaining<=0?'var(--red)':totalRemaining<=2?'var(--amber)':'var(--green)'}">${totalRemaining}</div>
      </div>
    </div>
    <div style="font-size:10px;color:var(--text3);margin-bottom:8px;letter-spacing:.5px">FIFO ORDER — Oldest stock depletes first. Cost per unit is per batch.</div>
    <div class="table-scroll"><table>
      <thead><tr>
        <th class="no-sort" style="width:28px">#</th>
        <th class="no-sort" style="min-width:200px">Item / Batch</th>
        <th class="no-sort" style="min-width:90px">Date</th>
        <th class="no-sort" style="min-width:70px;text-align:center">Bought</th>
        <th class="no-sort" style="min-width:60px;text-align:center">Used</th>
        <th class="no-sort" style="min-width:60px;text-align:center">Left</th>
        <th class="no-sort" style="min-width:90px">Cost/Unit</th>
        <th class="no-sort" style="min-width:120px">Notes</th>
      </tr></thead>
      <tbody>${rows}${adjRows}</tbody>
    </table></div>`;
  openModal('m-inv-detail');
}

// ══════════════════════════════════════════════════════════
// CATEGORY MANAGER
// ══════════════════════════════════════════════════════════
function openCatManager(){renderCatManagerList();openModal('m-cats');}
function renderCatManagerList(){
  $('cat-list').innerHTML=CATS.map(cat=>{
    const col=CAT_COLORS[cat]||'#6b7280';
    const safeCat=cat.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:9px">
      <button onclick="openColorPicker('${safeCat}',this)" title="Pick colour for ${escH(cat)}"
        style="width:22px;height:22px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,.18);cursor:pointer;flex-shrink:0;box-shadow:0 0 8px ${col}66;transition:.2s;padding:0"></button>
      <span style="flex:1;font-size:13px">${escH(cat)}</span>
      ${cat==='Other'?'<span style="font-size:10px;color:var(--text3)">required</span>':`<button onclick="removeCat('${safeCat}')" style="padding:3px 8px;border-radius:6px;background:var(--red-dim);border:1px solid rgba(248,113,113,.2);color:var(--red);font-size:11px;cursor:pointer">Remove</button>`}
    </div>`;
  }).join('');
}
function setCatColor(cat,color){
  CAT_COLORS[cat]=color;
  saveCatColors();
  renderCatManagerList();
  renderCurrentPage();
}

// ── Custom colour picker logic ──
let _cpCat=null;
function hslToHex(h,s,l){
  s/=100;l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12;const col=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*col).toString(16).padStart(2,'0');};
  return '#'+f(0)+f(8)+f(4);
}
function hexToHsl(hex){
  let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}else{const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}
  return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}
function cpUpdate(){
  const h=+$('color-popover-hue').value,s=+$('color-popover-sat').value,l=+$('color-popover-lit').value;
  const hex=hslToHex(h,s,l);
  $('color-popover-hex').value=hex;
  $('color-popover-preview').style.background=hex;
  $('color-popover-hue').style.background=`linear-gradient(to right,hsl(${h},0%,${l}%),hsl(${h},100%,${l}%))`;
}
function cpHueChange(v){
  const s=+$('color-popover-sat').value,l=+$('color-popover-lit').value;
  const hex=hslToHex(+v,s,l);
  $('color-popover-hex').value=hex;
  $('color-popover-preview').style.background=hex;
  $('color-popover-hue').style.background=`linear-gradient(to right,hsl(0,80%,55%),hsl(60,80%,55%),hsl(120,80%,40%),hsl(180,80%,45%),hsl(240,80%,55%),hsl(300,80%,50%),hsl(360,80%,55%))`;
}
function cpHexInput(v){
  if(/^#[0-9a-fA-F]{6}$/.test(v)){
    const [h,s,l]=hexToHsl(v);
    $('color-popover-hue').value=h;$('color-popover-sat').value=s;$('color-popover-lit').value=l;
    $('color-popover-preview').style.background=v;
  }
}
function openColorPicker(cat,btn){
  _cpCat=cat;
  const col=CAT_COLORS[cat]||'#6b7280';
  const [h,s,l]=hexToHsl(col);
  $('color-popover-label').textContent='Colour for '+cat;
  $('color-popover-hue').value=h;$('color-popover-sat').value=s;$('color-popover-lit').value=l;
  $('color-popover-hex').value=col;
  $('color-popover-preview').style.background=col;
  const pop=$('color-popover');
  const rect=btn.getBoundingClientRect();
  const top=Math.min(rect.bottom+6, window.innerHeight-360);
  const left=Math.min(rect.left, window.innerWidth-230);
  pop.style.top=top+'px';pop.style.left=left+'px';
  pop.classList.add('open');
  cpHueChange(h);
}
function cpConfirm(){
  if(!_cpCat)return;
  const hex=$('color-popover-hex').value;
  if(/^#[0-9a-fA-F]{6}$/.test(hex)){setCatColor(_cpCat,hex);}
  $('color-popover').classList.remove('open');_cpCat=null;
}
function cpCancel(){$('color-popover').classList.remove('open');_cpCat=null;}
function removeCat(cat){
  if(cat==='Other') return;
  CATS=CATS.filter(c=>c!==cat);
  lsSet('bms_cats',JSON.stringify(CATS));
  populateCatSelects();renderCatManagerList();toast(`Removed "${cat}" from new entries`,'info');
}
function addCat(){
  const name=$('new-cat-input').value.trim();
  if(!name){toast('Enter a category name','error');return;}
  if(CATS.includes(name)){toast('Already exists','error');return;}
  CATS.push(name);
  lsSet('bms_cats',JSON.stringify(CATS));
  populateCatSelects();renderCatManagerList();
  $('new-cat-input').value='';toast(`Added "${name}"` ,'success');
}

// ══════════════════════════════════════════════════════════
// COSTS PAGE
// ══════════════════════════════════════════════════════════
function renderCosts(){
  const purchases=costsData.filter(c=>(c.type||'purchase')==='purchase');
  const refundsAll=costsData.filter(c=>c.type==='refund');
  const missingAll=costsData.filter(c=>c.type==='missing');
  const totalInvested=purchases.reduce((a,c)=>a+(+c.totalCost||0),0)-refundsAll.reduce((a,c)=>a+(+c.totalCost||0),0);
  const totalRev=sales.reduce((a,s)=>a+(+s.rev||0),0);
  const pnl=totalRev-totalInvested;

  $('cost-kpi-total').textContent=fmt(totalInvested);
  $('cost-kpi-sub').textContent=`${purchases.length} purchase batches`;
  $('cost-kpi-rev').textContent=fmt(totalRev);
  $('cost-kpi-pnl').textContent=fmt(pnl);
  $('cost-kpi-pnl').style.color=pnl>=0?'var(--green)':'var(--red)';

  const typeBadge={purchase:'<span style="background:var(--blue-dim);color:var(--blue);border:1px solid rgba(96,165,250,.2);border-radius:5px;padding:2px 8px;font-size:10px;font-weight:600">Purchase</span>',refund:'<span style="background:var(--green-dim);color:var(--green);border:1px solid rgba(74,222,128,.2);border-radius:5px;padding:2px 8px;font-size:10px;font-weight:600">Refund</span>',missing:'<span style="background:var(--amber-dim);color:var(--amber);border:1px solid rgba(251,191,36,.2);border-radius:5px;padding:2px 8px;font-size:10px;font-weight:600">Missing</span>'};

  const sortedCosts=[...costsData].sort((a,b)=>a.date.localeCompare(b.date));
  $('costs-table-body').innerHTML=sortedCosts.length?sortedCosts.map((c,i)=>{
    const t=c.type||'purchase';
    const effQty=Math.max(0,(+c.qty||0)-(+c.missingFromBox||0));
    const effCost=Math.max(0,(+c.totalCost||0)-(+c.refundReceived||0));
    const cpu=t==='missing'?0:(effQty?Math.round(effCost/effQty):0);
    const origCpu=t==='purchase'&&c.qty?Math.round(c.totalCost/c.qty):0;
    const hasAdj=t==='purchase'&&((+c.missingFromBox||0)>0||(+c.refundReceived||0)>0);
    const cpuDisplay=hasAdj?`<div style="color:var(--blue);font-size:12px">${fmt(cpu)}</div><div style="color:var(--text3);font-size:10px;text-decoration:line-through">${fmt(origCpu)}</div>`:(cpu?fmt(cpu):'—');
    const qtyDisplay=t!=='purchase'?`<span style="color:var(--amber)">-${c.qty}</span>`:(hasAdj?`${effQty} <span style="color:var(--text3);font-size:10px">of ${c.qty}</span>`:c.qty);
    const costDisplay=t==='missing'?'<span style="color:var(--amber)">write-off</span>':`<span class="num-cell ${t==='refund'?'num-green':'num-red'}">${t==='refund'?'+':'-'}${fmt(t==='purchase'?effCost:c.totalCost).slice(1)}${hasAdj?`<span style="color:var(--text3);font-size:10px;display:block;text-decoration:line-through">-${fmt(c.totalCost).slice(1)}</span>`:''}</span>`;
    return `<tr style="animation:fadeUp .12s ${i*.025}s both;cursor:context-menu" oncontextmenu="showCtxMenu(event,'cost','${c.id}',${c._row||0})">
      <td class="sl-cell">${i+1}</td>
      <td style="font-weight:500">${escH(c.item)}</td>
      <td class="num-cell" style="color:var(--blue);text-align:center;font-size:12px">${c.batchNum?`<span style="background:var(--blue-dim);color:var(--blue);border:1px solid rgba(96,165,250,.2);border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700">B${c.batchNum}</span>`:'<span style="color:var(--text3)">—</span>'}</td>
      <td>${typeBadge[t]||''}</td>
      <td><span class="cell-cat" style="color:${CAT_COLORS[c.cat]||'var(--text2)'}">${escH(c.cat)}</span></td>
      <td class="num-cell" style="color:var(--text2);text-align:center">${qtyDisplay}</td>
      <td>${costDisplay}</td>
      <td class="num-cell" style="color:var(--blue)">${cpuDisplay}</td>
      <td class="num-cell" style="color:var(--text2);font-size:12px">${c.date}</td>
      <td style="color:var(--text2);font-size:12px">${escH(c.notes)||'—'}</td>
      <td><div class="row-actions">
        <button class="row-btn row-btn-edit" onclick="openEditCost('${c.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="row-btn row-btn-del" onclick="confirmDel('${c.id}',${c._row||0},'cost')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
      </div></td>
    </tr>`;
  }).join(''):`<tr class="empty-row"><td colspan="10"><div class="empty-icon">◇</div><div class="empty-text">No shipments yet</div><div class="empty-sub">Add your first purchase</div></td></tr>`;

  // Inventory tracker — EXCLUDE 'Other', use FIFO data
  const invCats=[...new Set(costsData.filter(c=>(c.type||'purchase')==='purchase').map(c=>c.cat))].filter(c=>c!=='Other');
  $('inv-tracker').innerHTML=invCats.map(cat=>{
    const {totalBought,totalRemaining,soldQty}=getFIFOBatches(cat);
    const pctVal=totalBought?Math.max(0,Math.min(100,Math.round(totalRemaining/totalBought*100))):0;
    const col=CAT_COLORS[cat]||'#888';const remCol=totalRemaining<=0?'var(--red)':totalRemaining<=2?'var(--amber)':'var(--green)';
    return `<div class="inv-card" style="cursor:pointer;transition:.2s" onclick="openInvDetail('${cat}')" onmouseover="this.style.borderColor='${col}'" onmouseout="this.style.borderColor='var(--border)'">
      <div class="inv-cat-label" style="color:${col}">${cat} <span style="float:right;font-size:9px;color:var(--text3);letter-spacing:.5px;font-weight:400">Click for batches ↗</span></div>
      <div class="inv-remaining" style="color:${remCol}">${totalRemaining} left</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3)"><span>Bought: ${totalBought}</span><span>Sold: ${soldQty}</span></div>
      <div class="inv-bar-bg"><div class="inv-bar-fill" style="width:${pctVal}%;background:${col}"></div></div>
    </div>`;
  }).join('')||'<div style="color:var(--text3);font-size:12px;padding:20px">No inventory data yet.</div>';
}

// ══════════════════════════════════════════════════════════
// COSTS PAGE TABS
// ══════════════════════════════════════════════════════════
function switchCostsTab(tab){
  ['shipments','stock'].forEach(t=>{
    const panel=$('costs-panel-'+t);
    const btn=$('costs-tab-'+t);
    if(panel){panel.style.display=t===tab?'':'none';}
    if(btn){
      btn.style.borderBottomColor=t===tab?'var(--gold)':'transparent';
      btn.style.color=t===tab?'var(--gold)':'var(--text2)';
      btn.style.fontWeight=t===tab?'600':'400';
    }
  });
  if(tab==='stock')renderStockCost();
}

function renderStockCost(){
  const cats=[...new Set(costsData.filter(c=>(c.type||'purchase')==='purchase').map(c=>c.cat))].filter(c=>c!=='Other');
  let rows='';let globalIdx=0;
  cats.forEach(cat=>{
    const col=CAT_COLORS[cat]||'#888';
    const {batches}=getFIFOBatches(cat);
    const withStock=batches.filter(b=>b.remainingQty>0);
    if(!withStock.length)return;
    withStock.forEach((b,i)=>{
      globalIdx++;
      const stockVal=b.remainingQty*b.costPerUnit;
      const adjustTag=b.hasAdjust
        ?`<span style="background:var(--amber-dim);color:var(--amber);border:1px solid rgba(251,191,36,.2);border-radius:4px;padding:1px 6px;font-size:9px;margin-left:6px;font-weight:600">adjusted</span>`:'';
      const cpuCell=b.hasAdjust
        ?`<div style="color:var(--blue)">${fmt(b.costPerUnit)}</div><div style="font-size:10px;color:var(--text3);text-decoration:line-through">${fmt(b.origCpu)}</div>`
        :`<span style="color:var(--blue)">${fmt(b.costPerUnit)}</span>`;
      const batchLabel=b.batchNum?`<span style="background:var(--blue-dim);color:var(--blue);border:1px solid rgba(96,165,250,.2);border-radius:4px;padding:1px 7px;font-size:9px;font-weight:700;margin-right:5px">B${b.batchNum}</span>`:'';
      rows+=`<tr style="animation:fadeUp .1s ${globalIdx*.03}s both;cursor:pointer" onclick="openInvDetail('${cat}')">
        <td class="sl-cell">${globalIdx}</td>
        <td><span style="background:${col}22;color:${col};border:1px solid ${col}44;border-radius:5px;padding:2px 9px;font-size:11px;font-weight:600">${escH(cat)}</span></td>
        <td style="font-weight:500;font-size:12px">${batchLabel}${escH(b.item)}${adjustTag}</td>
        <td style="color:var(--text2);font-size:11px">${b.date}</td>
        <td class="num-cell" style="color:var(--green);font-weight:700;text-align:center">${b.remainingQty}</td>
        <td class="num-cell">${cpuCell}</td>
        <td class="num-cell" style="color:var(--gold)">${fmt(stockVal)}</td>
        <td style="color:var(--text3);font-size:11px">${escH(b.notes)||'—'}</td>
      </tr>`;
    });
  });
  // Total stock value footer
  const totalStockVal=cats.reduce((sum,cat)=>{
    const {batches}=getFIFOBatches(cat);
    return sum+batches.filter(b=>b.remainingQty>0).reduce((s,b)=>s+b.remainingQty*b.costPerUnit,0);
  },0);
  rows+=`<tr style="border-top:2px solid var(--border2)">
    <td colspan="6" style="font-weight:600;font-size:12px;color:var(--text2);padding-left:12px">Total Stock Value</td>
    <td class="num-cell" style="color:var(--gold);font-weight:700;font-size:14px">${fmt(totalStockVal)}</td>
    <td></td>
  </tr>`;
  $('stock-cost-body').innerHTML=rows||`<tr class="empty-row"><td colspan="8"><div class="empty-icon">◇</div><div class="empty-text">No stock remaining</div></td></tr>`;
}

// ══════════════════════════════════════════════════════════
// CONTEXT MENU
// ══════════════════════════════════════════════════════════
let ctxTarget={type:null,id:null,row:null};
function showCtxMenu(e,type,id,row){
  e.preventDefault();e.stopPropagation();
  ctxTarget={type,id,row};
  const m=$('ctx-menu');
  m.style.display='block';
  const x=Math.min(e.clientX,window.innerWidth-170);
  const y=Math.min(e.clientY,window.innerHeight-90);
  m.style.left=x+'px';m.style.top=y+'px';
}
function hideCtxMenu(){$('ctx-menu').style.display='none';}
function ctxAction(action){
  hideCtxMenu();
  const {type,id,row}=ctxTarget;
  if(action==='edit'){
    if(type==='sale')openEditSale(id);
    else if(type==='cost')openEditCost(id);
  }else if(action==='delete'){
    confirmDel(id,row,type);
  }
}
document.addEventListener('click',e=>{if(!e.target.closest('#ctx-menu'))hideCtxMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideCtxMenu();});

// ══════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════
function toggleExportMenu(){const m=$('export-menu');if(m)m.style.display=m.style.display==='none'?'block':'none';}
function closeExportMenu(){const m=$('export-menu');if(m)m.style.display='none';}
document.addEventListener('click',e=>{if(!e.target.closest('#export-menu')&&!e.target.closest('[onclick*="toggleExportMenu"]'))closeExportMenu();});

function exportCSV(){
  const h=['Item','Category','Customer','Qty','Revenue','Cost','Profit','Discount','Due','Date','Payment','Order','Notes'];
  const rows=sales.map(s=>[s.item,s.cat,s.customer,s.qty,s.rev,s.cost,profit(s),s.disc,s.due,s.date,s.pay,s.ord,s.notes]);
  const csv=[h,...rows].map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:'bms-sales.csv'});a.click();toast('CSV exported — open in Excel or Google Sheets','success');
}

function exportPDF(){
  const totalRev=sales.reduce((a,s)=>a+(+s.rev||0),0);
  const totalProfit=sales.reduce((a,s)=>a+profit(s),0);
  const totalDue=sales.reduce((a,s)=>a+(+s.due||0),0);
  const totalInvested=costsData.filter(c=>(c.type||'purchase')==='purchase').reduce((a,c)=>a+(+c.totalCost||0),0);
  const fmtN=n=>'৳'+Number(n||0).toLocaleString('en-IN');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>BMS Report</title><style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;background:#fff;padding:32px;font-size:13px}
    h1{font-size:22px;color:#c9a853;margin-bottom:4px;font-family:Georgia,serif}
    .sub{color:#666;font-size:11px;margin-bottom:28px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
    .kpi{border:1px solid #e0e0e0;border-radius:10px;padding:16px}
    .kpi-l{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:6px}
    .kpi-v{font-size:20px;font-family:'Courier New',monospace;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{padding:8px 10px;text-align:left;background:#f5f5f0;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#666;border-bottom:2px solid #e0e0e0}
    td{padding:7px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
    tr:nth-child(even) td{background:#fafaf8}
    .gold{color:#c9853a;font-weight:600}.green{color:#22863a;font-weight:600}.red{color:#d73a49;font-weight:600}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 10px;border-top:1px solid #eee;padding-top:16px}
    @media print{body{padding:16px}button{display:none}}
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>BMS Business Report</h1><div class="sub">Generated ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${sales.length} total sales</div></div>
      <button onclick="window.print()" style="padding:8px 16px;background:#c9a853;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px">🖨 Print / Save PDF</button>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-l">Total Revenue</div><div class="kpi-v gold">${fmtN(totalRev)}</div></div>
      <div class="kpi"><div class="kpi-l">Total Profit</div><div class="kpi-v green">${fmtN(totalProfit)}</div></div>
      <div class="kpi"><div class="kpi-l">Total Invested</div><div class="kpi-v" style="color:#3a6dc9">${fmtN(totalInvested)}</div></div>
      <div class="kpi"><div class="kpi-l">Outstanding Due</div><div class="kpi-v red">${fmtN(totalDue)}</div></div>
    </div>
    <h2>Sales Records</h2>
    <table><thead><tr><th>#</th><th>Item</th><th>Category</th><th>Customer</th><th>Date</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Payment</th><th>Due</th></tr></thead>
    <tbody>${[...sales].sort((a,b)=>b.date.localeCompare(a.date)).map((s,i)=>`<tr>
      <td style="color:#999">${i+1}</td><td><strong>${escH(s.item)}</strong></td><td>${escH(s.cat)}</td>
      <td>${escH(s.customer)||'—'}</td><td style="color:#666">${s.date}</td>
      <td class="gold">${fmtN(s.rev)}</td><td style="color:#666">${s.cost?fmtN(s.cost):'—'}</td>
      <td class="${profit(s)>=0?'green':'red'}">${fmtN(profit(s))}</td>
      <td>${s.pay}</td><td class="${s.due>0?'red':''}">${s.due>0?fmtN(s.due):'—'}</td>
    </tr>`).join('')}</tbody></table>
    <h2>Purchase Shipments</h2>
    <table><thead><tr><th>#</th><th>Item</th><th>Type</th><th>Category</th><th>Qty</th><th>Total Cost</th><th>Cost/Unit</th><th>Date</th><th>Notes</th></tr></thead>
    <tbody>${costsData.map((c,i)=>{const cpu=c.qty&&c.totalCost?Math.round(c.totalCost/c.qty):0;return`<tr>
      <td style="color:#999">${i+1}</td><td><strong>${escH(c.item)}</strong></td><td>${c.type||'purchase'}</td>
      <td>${escH(c.cat)}</td><td>${c.qty}</td><td class="red">${fmtN(c.totalCost)}</td>
      <td>${cpu?fmtN(cpu):'—'}</td><td style="color:#666">${c.date}</td><td>${escH(c.notes)||'—'}</td>
    </tr>`;}).join('')}</tbody></table>
  </body></html>`);
  w.document.close();toast('PDF report opened — use Ctrl+P to save as PDF','success');
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  loadConfig();
  if(!cfg.clientId||!cfg.sheetId){showScreen('setup');}
  else{populateAuthScreen();initTokenClient();showScreen('auth');}
  populateCatSelects();
});
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));
document.addEventListener('click',e=>{
  const pop=$('color-popover');
  if(pop&&pop.classList.contains('open')&&!pop.contains(e.target)&&!e.target.closest('[onclick*="openColorPicker"]')){
    pop.classList.remove('open');_cpCat=null;
  }
});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='n'&&currentPage==='sales'){e.preventDefault();openAddSale();}
  if(e.key==='Escape')document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
});

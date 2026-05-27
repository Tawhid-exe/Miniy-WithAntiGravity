import sys

with open(r'd:\Antigravity\BMS\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Scripts
content = content.replace('<script src="https://accounts.google.com/gsi/client" async></script>', '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>')

# 2. Setup screen HTML
content = content.replace('<label class="form-label">Google OAuth Client ID</label>', '<label class="form-label">Supabase Project URL</label>')
content = content.replace('placeholder="xxxxxxxxx.apps.googleusercontent.com"', 'placeholder="https://xxxx.supabase.co"')
content = content.replace('<label class="form-label">Google Sheet ID</label>', '<label class="form-label">Supabase Anon Key</label>')
content = content.replace('placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"', 'placeholder="eyJh..."')
content = content.replace('From your Sheet URL — the long ID in the middle', 'From your Supabase API settings')

# 3. Auth screen HTML
content = content.replace('<span class="auth-info-label">Client ID</span>', '<span class="auth-info-label">Project URL</span>')
content = content.replace('<span class="auth-info-label">Sheet ID</span>', '<span class="auth-info-label">Anon Key</span>')
content = content.replace('Connect with Google Sheets', 'Connect to Supabase')
content = content.replace('Data lives in your Google Sheet', 'Data lives in your Supabase DB')
content = content.replace('<div class="conn-val" id="conn-sheet-label">Google Sheets</div>', '<div class="conn-val" id="conn-sheet-label">Supabase DB</div>')
content = content.replace('this.style.display=\\\'none\\\';this.parentElement.innerHTML=\\\'✦\\\';', 'this.style.display=\'none\';this.parentElement.innerHTML=\'✦\';')

# 4. JS Replace
import re

js_to_replace = """// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let cfg = {clientId:'',sheetId:''};
let accessToken = '';
let tokenClient = null;"""

js_new = """// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let cfg = {clientId:'',sheetId:''};
let supabase = null;"""

content = content.replace(js_to_replace, js_new)

js_to_replace2 = """// ══════════════════════════════════════════════════════════
// CONFIG + AUTH
// ══════════════════════════════════════════════════════════
function loadConfig(){cfg.clientId=localStorage.getItem('bms_client_id')||'';cfg.sheetId=localStorage.getItem('bms_sheet_id')||'';}
function saveSetup(){
  const cid=$('inp-client-id').value.trim();const sid=$('inp-sheet-id').value.trim();
  if(!cid||!sid){showErr('setup-err','Fill in both fields.');return;}
  localStorage.setItem('bms_client_id',cid);localStorage.setItem('bms_sheet_id',sid);
  cfg.clientId=cid;cfg.sheetId=sid;hideErr('setup-err');initTokenClient();showScreen('auth');populateAuthScreen();
}
function populateAuthScreen(){const t=s=>s.length>30?s.slice(0,16)+'…'+s.slice(-8):s;$('disp-client-id').textContent=t(cfg.clientId);$('disp-sheet-id').textContent=t(cfg.sheetId);}
function resetSetup(){accessToken='';tokenClient=null;showScreen('auth');populateAuthScreen();}
function showErr(id,msg){const e=$(id);e.style.display='block';e.textContent=msg;}
function hideErr(id){$(id).style.display='none';}

function initTokenClient(){
  if(!cfg.clientId||typeof google==='undefined'){setTimeout(initTokenClient,200);return;}
  tokenClient=google.accounts.oauth2.initTokenClient({client_id:cfg.clientId,scope:'https://www.googleapis.com/auth/spreadsheets',callback:onToken});
}
async function signIn(){
  hideErr('auth-err');const btn=$('btn-signin');btn.disabled=true;
  btn.innerHTML='<div class="spinner" style="border-color:rgba(0,0,0,.2);border-top-color:#0a0808"></div> Connecting…';
  try{if(!tokenClient){initTokenClient();await new Promise(r=>setTimeout(r,500));}tokenClient.requestAccessToken({prompt:''});}
  catch(e){btn.disabled=false;btn.innerHTML='Connect with Google Sheets';showErr('auth-err','Auth failed: '+e.message);}
}
async function onToken(resp){
  const btn=$('btn-signin');btn.disabled=false;btn.innerHTML='Connect with Google Sheets';
  if(resp.error){showErr('auth-err','Google auth error: '+resp.error);return;}
  accessToken=resp.access_token;$('loading').classList.remove('hidden');
  try{await ensureSheets();await Promise.all([fetchSales(),fetchCosts()]);initApp();showScreen('app');}
  catch(e){$('loading').classList.add('hidden');showErr('auth-err','Could not load data: '+e.message);}
}

// ══════════════════════════════════════════════════════════
// SHEETS API
// ══════════════════════════════════════════════════════════
async function sheetsReq(path,method='GET',body=null){
  const opts={method,headers:{Authorization:`Bearer ${accessToken}`}};
  if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  const r=await fetch(`${BASE}/${cfg.sheetId}${path}`,opts);
  if(!r.ok){const err=await r.json().catch(()=>({error:{message:r.statusText}}));throw new Error(err.error?.message||r.statusText);}
  return r.json();
}

async function ensureSheets(){
  // Ensure Sales tab
  const sd=await sheetsReq(`/values/${SALES_TAB}!A1:A1`).catch(()=>null);
  if(!sd||!sd.values||sd.values[0]?.[0]!=='id'){
    await sheetsReq(`/values/${SALES_TAB}!A1:M1?valueInputOption=RAW`,'PUT',{range:`${SALES_TAB}!A1:M1`,values:[SALE_HEADERS]});
  }
  // Ensure Costs tab
  const cd=await sheetsReq(`/values/${COSTS_TAB}!A1:A1`).catch(()=>null);
  if(!cd||!cd.values||cd.values[0]?.[0]!=='id'){
    await sheetsReq(`/values/${COSTS_TAB}!A1:J1?valueInputOption=RAW`,'PUT',{range:`${COSTS_TAB}!A1:J1`,values:[COST_HEADERS]});
  }
}

async function fetchSales(){
  const d=await sheetsReq(`/values/${SALES_TAB}`);
  const rows=d.values||[];
  if(rows.length<=1){sales=SAMPLE_SALES;await bulkWriteSales();return;}
  sales=rows.slice(1).map((r,i)=>({_row:i+2,id:r[0]||uid(),item:r[1]||'',cat:r[2]||'Rings',customer:r[3]||'',qty:+r[4]||1,rev:+r[5]||0,cost:+r[6]||0,date:r[7]||'',pay:r[8]||'Paid',due:+r[9]||0,ord:r[10]||'Completed',disc:+r[11]||0,notes:r[12]||'',batchRef:r[13]||''}));
}

async function fetchCosts(){
  const d=await sheetsReq(`/values/${COSTS_TAB}`).catch(()=>({values:[]}));
  const rows=d.values||[];
  if(rows.length<=1){costsData=SAMPLE_COSTS;await bulkWriteCosts();return;}
  costsData=rows.slice(1).map((r,i)=>({_row:i+2,id:r[0]||uid(),item:r[1]||'',cat:r[2]||'Other',qty:+r[3]||1,totalCost:+r[4]||0,date:r[5]||'',notes:r[6]||'',type:r[7]||'purchase',missingFromBox:+r[8]||0,refundReceived:+r[9]||0,batchNum:+r[10]||0}));
}

async function refreshData(){showSync(true);try{await Promise.all([fetchSales(),fetchCosts()]);renderCurrentPage();toast('Refreshed','success');}catch(e){toast('Refresh failed: '+e.message,'error');}showSync(false);}

async function bulkWriteSales(){
  const rows=sales.map(s=>SALE_HEADERS.map(h=>s[h]??''));
  await sheetsReq(`/values/${SALES_TAB}!A2:M${rows.length+1}?valueInputOption=RAW`,'PUT',{range:`${SALES_TAB}!A2:M${rows.length+1}`,values:rows});
  await fetchSales();
}
async function bulkWriteCosts(){
  const rows=costsData.map(c=>COST_HEADERS.map(h=>c[h]??''));
  await sheetsReq(`/values/${COSTS_TAB}!A2:H${rows.length+1}?valueInputOption=RAW`,'PUT',{range:`${COSTS_TAB}!A2:H${rows.length+1}`,values:rows});
  await fetchCosts();
}

async function appendRow(tab,headers,obj){
  await sheetsReq(`/values/${tab}!A:${String.fromCharCode(64+headers.length)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,'POST',{values:[headers.map(h=>obj[h]??'')]});
}
async function updateRow(tab,row,headers,obj){
  const range=`${tab}!A${row}:${String.fromCharCode(64+headers.length)}${row}`;
  await sheetsReq(`/values/${range}?valueInputOption=RAW`,'PUT',{range,values:[headers.map(h=>obj[h]??'')]});
}
async function deleteRow(rowIndex){
  await sheetsReq('/:batchUpdate','POST',{requests:[{deleteDimension:{range:{sheetId:0,dimension:'ROWS',startIndex:rowIndex-1,endIndex:rowIndex}}}]});
}
async function deleteRowInSheet(sheetName,rowIndex){
  // Get sheet id for name
  const meta = await sheetsReq('');
  const sheet = meta.sheets?.find(s=>s.properties?.title===sheetName);
  const sheetId = sheet?.properties?.sheetId ?? 0;
  await sheetsReq('/:batchUpdate','POST',{requests:[{deleteDimension:{range:{sheetId,dimension:'ROWS',startIndex:rowIndex-1,endIndex:rowIndex}}}]});
}"""

js_new2 = """// ══════════════════════════════════════════════════════════
// CONFIG + AUTH
// ══════════════════════════════════════════════════════════
function loadConfig(){cfg.clientId=localStorage.getItem('bms_client_id')||'';cfg.sheetId=localStorage.getItem('bms_sheet_id')||'';}
function saveSetup(){
  const cid=$('inp-client-id').value.trim();const sid=$('inp-sheet-id').value.trim();
  if(!cid||!sid){showErr('setup-err','Fill in both fields.');return;}
  localStorage.setItem('bms_client_id',cid);localStorage.setItem('bms_sheet_id',sid);
  cfg.clientId=cid;cfg.sheetId=sid;hideErr('setup-err');initTokenClient();showScreen('auth');populateAuthScreen();
}
function populateAuthScreen(){const t=s=>s.length>30?s.slice(0,16)+'…'+s.slice(-8):s;$('disp-client-id').textContent=t(cfg.clientId);$('disp-sheet-id').textContent=t(cfg.sheetId);}
function resetSetup(){supabase=null;showScreen('auth');populateAuthScreen();}
function showErr(id,msg){const e=$(id);e.style.display='block';e.textContent=msg;}
function hideErr(id){$(id).style.display='none';}

function initTokenClient(){
  if(!cfg.clientId||!cfg.sheetId) return;
  supabase=window.supabase.createClient(cfg.clientId,cfg.sheetId);
}
async function signIn(){
  hideErr('auth-err');const btn=$('btn-signin');btn.disabled=true;
  btn.innerHTML='<div class="spinner" style="border-color:rgba(0,0,0,.2);border-top-color:#0a0808"></div> Connecting…';
  try{
    if(!supabase)initTokenClient();
    $('loading').classList.remove('hidden');
    await Promise.all([fetchSales(),fetchCosts()]);
    initApp();showScreen('app');
  }catch(e){
    $('loading').classList.add('hidden');
    btn.disabled=false;btn.innerHTML='Connect to Supabase';
    showErr('auth-err','Could not load data. Check URL and Key. Error: '+e.message);
  }
}

// ══════════════════════════════════════════════════════════
// SUPABASE API
// ══════════════════════════════════════════════════════════
async function fetchSales(){
  const {data,error}=await supabase.from('bms_sales').select('*').order('date',{ascending:true});
  if(error)throw new Error(error.message);
  sales=data.map((r,i)=>({_row:i+2,id:r.id,item:r.item||'',cat:r.cat||'Rings',customer:r.customer||'',qty:+r.qty||1,rev:+r.rev||0,cost:+r.cost||0,date:r.date||'',pay:r.pay||'Paid',due:+r.due||0,ord:r.ord||'Completed',disc:+r.disc||0,notes:r.notes||'',batchRef:r.batch_ref||''}));
}

async function fetchCosts(){
  const {data,error}=await supabase.from('bms_costs').select('*').order('date',{ascending:true});
  if(error)throw new Error(error.message);
  costsData=data.map((r,i)=>({_row:i+2,id:r.id,item:r.item||'',cat:r.cat||'Other',qty:+r.qty||1,totalCost:+r.total_cost||0,date:r.date||'',notes:r.notes||'',type:r.type||'purchase',missingFromBox:+r.missing_from_box||0,refundReceived:+r.refund_received||0,batchNum:+r.batch_num||0}));
}

async function refreshData(){showSync(true);try{await Promise.all([fetchSales(),fetchCosts()]);renderCurrentPage();toast('Refreshed','success');}catch(e){toast('Refresh failed: '+e.message,'error');}showSync(false);}

async function appendRow(tab,headers,obj){
  let dbObj = {};
  if(tab === SALES_TAB) {
    dbObj = {id:obj.id, item:obj.item, cat:obj.cat, customer:obj.customer, qty:obj.qty, rev:obj.rev, cost:obj.cost, date:obj.date, pay:obj.pay, due:obj.due, ord:obj.ord, disc:obj.disc, notes:obj.notes, batch_ref:obj.batchRef};
  } else {
    dbObj = {id:obj.id, item:obj.item, cat:obj.cat, qty:obj.qty, total_cost:obj.totalCost, date:obj.date, notes:obj.notes, type:obj.type, missing_from_box:obj.missingFromBox, refund_received:obj.refundReceived, batch_num:obj.batchNum};
  }
  const t = tab === SALES_TAB ? 'bms_sales' : 'bms_costs';
  const {error} = await supabase.from(t).insert([dbObj]);
  if(error) throw new Error(error.message);
}

async function updateRow(tab,row,headers,obj){
  let dbObj = {};
  if(tab === SALES_TAB) {
    dbObj = {item:obj.item, cat:obj.cat, customer:obj.customer, qty:obj.qty, rev:obj.rev, cost:obj.cost, date:obj.date, pay:obj.pay, due:obj.due, ord:obj.ord, disc:obj.disc, notes:obj.notes, batch_ref:obj.batchRef};
  } else {
    dbObj = {item:obj.item, cat:obj.cat, qty:obj.qty, total_cost:obj.totalCost, date:obj.date, notes:obj.notes, type:obj.type, missing_from_box:obj.missingFromBox, refund_received:obj.refundReceived, batch_num:obj.batchNum};
  }
  const t = tab === SALES_TAB ? 'bms_sales' : 'bms_costs';
  const {error} = await supabase.from(t).update(dbObj).eq('id', obj.id);
  if(error) throw new Error(error.message);
}

async function deleteRowInSheet(tab, rowIdx, id){
  const t = tab === SALES_TAB ? 'bms_sales' : 'bms_costs';
  const {error} = await supabase.from(t).delete().eq('id', id);
  if(error) throw new Error(error.message);
}"""

content = content.replace(js_to_replace2, js_new2)

# Update delete confirm buttons
content = content.replace("deleteRowInSheet(SALES_TAB,pendingDeleteRow);", "deleteRowInSheet(SALES_TAB,pendingDeleteRow,pendingDeleteId);")
content = content.replace("deleteRowInSheet(COSTS_TAB,pendingDeleteRow);", "deleteRowInSheet(COSTS_TAB,pendingDeleteRow,pendingDeleteId);")

# Update INIT function
js_init_old = """  loadConfig();
  if(!cfg.clientId||!cfg.sheetId){showScreen('setup');}
  else{populateAuthScreen();initTokenClient();showScreen('auth');}"""
js_init_new = """  loadConfig();
  if(!cfg.clientId||!cfg.sheetId){showScreen('setup');}
  else{populateAuthScreen();initTokenClient();showScreen('auth');setTimeout(()=>$('btn-signin').click(),100);}"""
content = content.replace(js_init_old, js_init_new)

with open(r'd:\Antigravity\BMS\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

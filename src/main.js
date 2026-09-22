import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><div><span class="eyebrow">EXCELSIOR'26</span><h1>ADMIN PORTAL</h1></div><div class="status">LIVE CONTROL</div></header>
    <section class="hero"><p>Participant & event command centre</p><div class="hero-actions"><button id="refresh">Refresh data</button><button id="email">Compose email</button></div></section>
    <nav class="tabs"><button class="active" data-tab="participants">Participants</button><button data-tab="events">Events</button><button data-tab="teams">Teams</button><button data-tab="abstracts">Abstracts</button></nav>
    <section class="content"><div class="toolbar"><input id="search" placeholder="Search Master ID, name, email or event…"/><span id="count">Loading…</span></div><div id="table"></div></section>
    <dialog id="mail"><form method="dialog" class="mail-card"><button class="close">×</button><span class="eyebrow">RESEND</span><h2>Send participant email</h2><input id="to" type="email" placeholder="Recipient email" required/><input id="subject" placeholder="Subject" value="EXCELSIOR'26 Registration Update"/><textarea id="body" rows="9" placeholder="Write your message…"></textarea><div class="preview">Preview is editable before sending.</div><button id="send" value="default">Send email</button><p id="mailStatus"></p></form></dialog>
  </main>`;

let data={participants:[],events:[],teams:[],abstracts:[]}; let tab='participants';
async function load(){
 if(!supabase){ document.querySelector('#table').innerHTML='<div class="empty">Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to load data.</div>'; document.querySelector('#count').textContent='ENV required'; return; }
 const [p,e,t,a]=await Promise.all([
  supabase.from('master_registrations').select('*').order('created_at',{ascending:false}),
  supabase.from('event_registrations').select('*').order('created_at',{ascending:false}),
  supabase.from('event_team_members').select('*').order('created_at',{ascending:false}),
  supabase.from('abstract_submissions').select('*').order('created_at',{ascending:false})
 ]);
 data={participants:p.data||[],events:e.data||[],teams:t.data||[],abstracts:a.data||[]}; render();
}
function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#92;'}[c]));}
function rows(){if(tab==='participants')return data.participants.map(x=>[x.master_id,x.full_name,x.email,x.phone,x.year,x.pre_registration_status]); if(tab==='events')return data.events.map(x=>[x.master_id,x.name,x.event,x.event_code,x.fee,x.payment_status,x.status]); if(tab==='teams')return data.teams.map(x=>[x.registrant_master_id||x.master_id,x.master_id,x.event_key,x.event_code,x.created_at]); return data.abstracts.map(x=>[x.master_id,x.event_title||x.event_key,x.title,x.file_name,x.status,x.submitted_at]);}
const heads={participants:['Master ID','Name','Email','Phone','Year','Status'],events:['Registrant Master ID','Name','Event','Event/Team code','Fee','Payment','Status'],teams:['Registrant Master ID','Member Master ID','Event','Team number','Created'],abstracts:['Master ID','Event','Title','File','Status','Submitted']};
function render(){const q=document.querySelector('#search').value.toLowerCase();const rs=rows().filter(r=>r.join(' ').toLowerCase().includes(q));document.querySelector('#count').textContent=`${rs.length} records`;document.querySelector('#table').innerHTML=`<table><thead><tr>${heads[tab].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rs.map(r=>`<tr>${r.map((c,i)=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');tab=b.dataset.tab;render();});document.querySelector('#search').oninput=render;document.querySelector('#refresh').onclick=load;document.querySelector('#email').onclick=()=>document.querySelector('#mail').showModal();document.querySelector('.close').onclick=()=>document.querySelector('#mail').close();document.querySelector('#send').onclick=async(e)=>{e.preventDefault();const status=document.querySelector('#mailStatus');status.textContent='Sending…';try{const res=await fetch('/api/send-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:document.querySelector('#to').value,subject:document.querySelector('#subject').value,html:`<p>${esc(document.querySelector('#body').value).replace(/\n/g,'<br>')}</p>`})});if(!res.ok)throw new Error(await res.text());status.textContent='Sent successfully.';}catch(err){status.textContent=`Send failed: ${err.message}`;}};
load();
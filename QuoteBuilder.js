import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, Button, Alert, Switch, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';

const MATERIALS_FILE = FileSystem.documentDirectory + 'materials.json';
const JOBS_FILE = FileSystem.documentDirectory + 'jobs.json';
const CLIENTS_FILE = FileSystem.documentDirectory + 'clients.json';
const PROPOSALS_DIR = FileSystem.documentDirectory + 'proposals/';
const SELECTED_CLIENT_FILE = FileSystem.documentDirectory + 'selected_client.json';
const API_FILE = FileSystem.documentDirectory + 'api.json';
const BUNDLE_API = FileSystem.bundleDirectory + 'data/api.json';

function b64(str){ return Buffer.from(str, 'utf8').toString('base64'); }

async function loadApiBase(){
  try{
    const info = await FileSystem.getInfoAsync(API_FILE);
    if(!info.exists){
      const txt = await FileSystem.readAsStringAsync(BUNDLE_API);
      await FileSystem.writeAsStringAsync(API_FILE, txt);
    }
    const data = JSON.parse(await FileSystem.readAsStringAsync(API_FILE));
    return data.baseUrl || 'http://127.0.0.1:8000';
  }catch(e){ return 'http://127.0.0.1:8000'; }
}

export default function QuoteBuilder(){
  const [crew, setCrew] = useState({lead:1, experienced:1, helper:1});
  const [hours, setHours] = useState(1);
  const [materials, setMaterials] = useState(0);
  const [overheadPct, setOverheadPct] = useState(0.15);
  const [profitPct, setProfitPct] = useState(0.25);
  const [tier, setTier] = useState('Standard');
  const [existingCustomer, setExistingCustomer] = useState(false);
  const [client, setClient] = useState('Client');
  const [clientEmail, setClientEmail] = useState('client@example.com');
  const [apiBase, setApiBase] = useState('http://127.0.0.1:8000');
  const [addons, setAddons] = useState([
    {name:'Aeration', price:150, unit:'acre'},
    {name:'Mulch install', price:120, unit:'yd'},
    {name:'Weed control (promo)', price:0, unit:'spray'}
  ]);

  useEffect(()=>{ (async()=>{
    try{
      // ensure proposals dir
      try{ const info = await FileSystem.getInfoAsync(PROPOSALS_DIR); if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true}); }catch(e){}

      const info = await FileSystem.getInfoAsync(MATERIALS_FILE);
      if(info.exists){
        const m = JSON.parse(await FileSystem.readAsStringAsync(MATERIALS_FILE));
        setMaterials(Number(m.total||0));
      }
    }catch(e){}
    setApiBase(await loadApiBase());
  })(); }, []);

  useEffect(()=>{ (async()=>{
    try{
      // ensure proposals dir
      try{ const info = await FileSystem.getInfoAsync(PROPOSALS_DIR); if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true}); }catch(e){}

      const info = await FileSystem.getInfoAsync(SELECTED_CLIENT_FILE);
      if(info.exists){
        const c = JSON.parse(await FileSystem.readAsStringAsync(SELECTED_CLIENT_FILE));
        if(c.name) setClient(c.name);
        if(c.email) setClientEmail(c.email);
      }
    }catch(e){}
  })(); }, []);

  const rate = { lead:20, experienced:20, helper:15 };
  const wagesPerHour = crew.lead*rate.lead + crew.experienced*rate.experienced + crew.helper*rate.helper;
  const laborCost = wagesPerHour * hours;
  const overhead = (laborCost + Number(materials)) * overheadPct;
  const cost = laborCost + Number(materials) + overhead;
  const suggested = cost * (1 + profitPct);
  const finalPrice = existingCustomer ? suggested * 0.85 : suggested;

  const seasonalSell = () => {
    const m = new Date().getMonth()+1;
    if(m>=8 && m<=10) return 'Fall clean-up, aeration & overseeding, and leaf removal scheduling available now.';
    if(m>=3 && m<=5) return 'Spring bed refresh, mulch install, and pre-emergent weed control are in season.';
    if(m>=6 && m<=7) return 'Mid-season edging, irrigation checks, and drought-friendly mowing plans.';
    return 'Winter pruning, debris haul-off, and storm-readiness checks.';
  };

  const problemsYouMightSee = [
    'Compacted soil near drive/traffic areas — aeration recommended',
    'Thin turf in shade — overseed with tall fescue blend',
    'Mulch decomposed <2" — top off beds to 3" depth',
    'Downspout washouts — add splash blocks or #57 rock'
  ];

  const yardHealthNotes = [
    'Mowing height 3.5" to 4" for fescue; sharpen blades monthly.',
    'Fertilize 3x annually; spot-spray weeds every 4–6 weeks.',
    'Mulch beds to 2–3" to retain moisture and suppress weeds.'
  ];

  const saveJob = async ()=>{
    let jobs = [];
    try{
      // ensure proposals dir
      try{ const info = await FileSystem.getInfoAsync(PROPOSALS_DIR); if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true}); }catch(e){}

      const info = await FileSystem.getInfoAsync(JOBS_FILE);
      if(info.exists){
        jobs = JSON.parse(await FileSystem.readAsStringAsync(JOBS_FILE));
      }
    }catch(e){}
    jobs.push({
      date: new Date().toISOString(),
      client,
      clientEmail,
      hours,
      materials,
      laborCost,
      overhead,
      price: finalPrice,
      profitPct
    });
    await FileSystem.writeAsStringAsync(JOBS_FILE, JSON.stringify(jobs));

    // store client for reuse
    let clients = [];
    try{
      // ensure proposals dir
      try{ const info = await FileSystem.getInfoAsync(PROPOSALS_DIR); if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true}); }catch(e){}

      const info = await FileSystem.getInfoAsync(CLIENTS_FILE);
      if(info.exists) clients = JSON.parse(await FileSystem.readAsStringAsync(CLIENTS_FILE));
    }catch(e){}
    if(!clients.find(c=>c.email===clientEmail)){
      clients.push({name: client, email: clientEmail});
      await FileSystem.writeAsStringAsync(CLIENTS_FILE, JSON.stringify(clients));
    }

    Alert.alert('Saved', 'Quote saved to jobs.');
  };

  const buildHtml = () => {
    const currency = (n)=>'$'+Number(n||0).toFixed(2);
    const addonsHtml = addons.map(a=>`<li>${a.name} — ${a.price>0?('$'+a.price+'/'+a.unit):'FREE'}</li>`).join('');
    const problemsHtml = problemsYouMightSee.map(p=>`<li>${p}</li>`).join('');
    const yardHtml = yardHealthNotes.map(p=>`<li>${p}</li>`).join('');
    return `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>Scenic Roots Proposal - ${client}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; margin:24px; color:#222;}
  .brand{font-size:24px; font-weight:800; letter-spacing:0.5px;}
  .muted{color:#666;}
  .card{border:1px solid #e5e5e5; padding:16px; border-radius:8px; margin:16px 0;}
  .price{font-size:20px; font-weight:700;}
  h2{margin:18px 0 8px}
</style>
</head><body>
  <div class="brand">Scenic Roots Lawn Care & Landscaping</div>
  <div class="muted">615‑308‑8477 • scenicroots.net</div>
  <hr/>
  <h1>Proposal for ${client}</h1>
  <div class="card">
    <h2>Investment</h2>
    <div>Tier: {tier} @ ${(profitPct*100).toFixed(0)}%</div>
    <div class="price">${currency(finalPrice)} ${existingCustomer ? '(includes 15% existing-customer discount)' : ''}</div>
    <div>Breakdown: Labor ${currency(laborCost)} • Materials ${currency(materials)} • Overhead ${currency(overhead)}</div>
    <div>Target margin: ${(profitPct*100).toFixed(0)}%</div>
  </div>
  <div class="card">
    <h2>Add-Ons</h2>
    <ul>${addonsHtml}</ul>
  </div>
  <div class="card">
    <h2>Yard Health Report</h2>
    <ul>${yardHtml}</ul>
  </div>
  <div class="card">
    <h2>Problems You Might See</h2>
    <ul>${problemsHtml}</ul>
  </div>
  <div class="card">
    <h2>Seasonal Sell</h2>
    <p>${seasonalSell()}</p>
  </div>
  <p class="muted">Thank you for considering Scenic Roots — we treat every property like our own.</p>
</body></html>`;
  };

  const sendProposal = async ()=>{
    const html = buildHtml();
    try{
      // ensure proposals dir
      try{ const info = await FileSystem.getInfoAsync(PROPOSALS_DIR); if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true}); }catch(e){}

      // get PDF from backend
      let pdf_b64 = null;
      try{
      // ensure proposals dir
      try{ const info = await FileSystem.getInfoAsync(PROPOSALS_DIR); if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true}); }catch(e){}

        const pdfRes = await fetch(`${apiBase}/render_pdf`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ html })
        });
        const pj = await pdfRes.json();
        pdf_b64 = pj.pdf_b64 || null;
      }catch(e){}

      // save local copies
      const ts = new Date().toISOString().replace(/[:.]/g,'-');
      const htmlPath = PROPOSALS_DIR + `${client}-${ts}.html`;
      const pdfPath = PROPOSALS_DIR + `${client}-${ts}.pdf`;
      await FileSystem.writeAsStringAsync(htmlPath, html);

      // get PDF from backend
      let pdf_b64 = null;
      try{
        const pdfRes = await fetch(`${apiBase}/render_pdf`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ html }) });
        const pj = await pdfRes.json();
        pdf_b64 = pj.pdf_b64 || null;
        if(pdf_b64){ await FileSystem.writeAsStringAsync(pdfPath, pdf_b64, {encoding: FileSystem.EncodingType.Base64}); }
      }catch(e){}

      const res = await fetch(`${apiBase}/email`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          to: clientEmail,
          subject: `Scenic Roots Proposal for ${client}`,
          html,
          attachments: [
            { filename: 'proposal.html', mime: 'text/html', content_b64: b64(html) },
            ...(pdf_b64 ? [{ filename: 'proposal.pdf', mime: 'application/pdf', content_b64: pdf_b64 }] : [])
          ]
        })
      });
      const j = await res.json();
      // write metadata for Proposals screen
      const meta = { ts: ts, client, email: clientEmail, subject: `Scenic Roots Proposal for ${client}`, htmlPath, pdfPath: pdf_b64 ? pdfPath : null };
      await FileSystem.writeAsStringAsync(PROPOSALS_DIR + `${client}-${ts}.meta.json`, JSON.stringify(meta));
      Alert.alert('Sent', `Saved EML: ${j.saved_eml} — sent: ${j.sent}`);
    }catch(e){
      Alert.alert('Email Error', String(e));
    }
  };

  return (
    <ScrollView>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Quote Builder</Text>
      <Text>Client</Text>
      <TextInput placeholder='Client name' onChangeText={setClient} />
      <Text>Client Email</Text>
      <TextInput placeholder='client@example.com' autoCapitalize='none' keyboardType='email-address' onChangeText={setClientEmail} />
      <Text>Hours</Text>
      <TextInput keyboardType='numeric' placeholder='1' onChangeText={v=>setHours(Number(v||0))} />
      <Text>Materials ($)</Text>
      <TextInput keyboardType='numeric' value={String(materials)} onChangeText={v=>setMaterials(Number(v||0))} />
      <Text>Overhead % (e.g., 0.15)</Text>
      <TextInput keyboardType='numeric' placeholder='0.15' onChangeText={v=>setOverheadPct(Number(v||0))} />
      <Text>Profit % (e.g., 0.25)</Text>
      <TextInput keyboardType='numeric' placeholder='0.25' onChangeText={v=>setProfitPct(Number(v||0))} />
      <View style={{flexDirection:'row', justifyContent:'space-around', marginVertical:6}}>
        <Button title='Budget' onPress={()=>{setTier('Budget'); setProfitPct(0.20);}} />
        <Button title='Standard' onPress={()=>{setTier('Standard'); setProfitPct(0.25);}} />
        <Button title='Premium' onPress={()=>{setTier('Premium'); setProfitPct(0.30);}} />
      </View>
      <View style={{flexDirection:'row', alignItems:'center', marginVertical:6}}>
        <Switch value={existingCustomer} onValueChange={setExistingCustomer} />
        <Text>Existing customer 15% off</Text>
      </View>
      <Text>Labor: ${laborCost.toFixed(2)}</Text>
      <Text>Overhead: ${overhead.toFixed(2)}</Text>
      <Text>Total Cost: ${ (laborCost + Number(materials) + overhead).toFixed(2)}</Text>
      <Text>Suggested @ {Math.round(profitPct*100)}% margin: ${ (cost * (1 + profitPct)).toFixed(2)}</Text>
      <Text>Tier: {tier} @ {Math.round(profitPct*100)}% target</Text>
      <Text>Final Price: ${finalPrice.toFixed(2)}</Text>
      <Button title='Save Quote' onPress={saveJob} />
      <View style={{height:8}} />
      <Button title='Send Proposal via Email' onPress={sendProposal} />
      <Text style={{marginTop:8}}>API: {apiBase}</Text>
    </ScrollView>
  );
}

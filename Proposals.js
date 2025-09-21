import React, {useEffect, useState} from 'react';
import { View, Text, Button, Alert, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';

const PROPOSALS_DIR = FileSystem.documentDirectory + 'proposals/';
const API_FILE = FileSystem.documentDirectory + 'api.json';
const BUNDLE_API = FileSystem.bundleDirectory + 'data/api.json';

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

function b64(str){ return Buffer.from(str, 'utf8').toString('base64'); }

export default function Proposals(){
  const [items, setItems] = useState([]);
  const [apiBase, setApiBase] = useState('http://127.0.0.1:8000');

  const scan = async ()=>{
    const list = [];
    try{
      const dir = await FileSystem.readDirectoryAsync(PROPOSALS_DIR);
      for(const name of dir){
        if(name.endsWith('.meta.json')){
          const meta = JSON.parse(await FileSystem.readAsStringAsync(PROPOSALS_DIR + name));
          list.push(meta);
        }
      }
      // newest first
      list.sort((a,b)=> (b.ts||'').localeCompare(a.ts||''));
    }catch(e){}
    setItems(list);
  };

  useEffect(()=>{ (async()=>{
    try{
      const info = await FileSystem.getInfoAsync(PROPOSALS_DIR);
      if(!info.exists) await FileSystem.makeDirectoryAsync(PROPOSALS_DIR, {intermediates:true});
    }catch(e){}
    setApiBase(await loadApiBase());
    await scan();
  })(); }, []);

  const resend = async (meta)=>{
    try{
      const html = await FileSystem.readAsStringAsync(meta.htmlPath);
      let attachments = [{ filename:'proposal.html', mime:'text/html', content_b64: b64(html) }];
      try{
        const info = await FileSystem.getInfoAsync(meta.pdfPath);
        if(info.exists){
          const pdfb = await FileSystem.readAsStringAsync(meta.pdfPath, {encoding: FileSystem.EncodingType.Base64});
          attachments.push({ filename:'proposal.pdf', mime:'application/pdf', content_b64: pdfb });
        }
      }catch(e){}
      const res = await fetch(`${apiBase}/email`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ to: meta.email, subject: meta.subject || `Scenic Roots Proposal for ${meta.client}`, html, attachments })
      });
      const j = await res.json();
      Alert.alert('Re-sent', `Saved EML: ${j.saved_eml} — sent: ${j.sent}`);
    }catch(e){
      Alert.alert('Error', String(e));
    }
  };

  return (
    <ScrollView>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Saved Proposals</Text>
      {items.length===0 ? <Text>No saved proposals yet.</Text> : items.map((m,idx)=>(
        <View key={idx} style={{marginVertical:8, borderBottomWidth:1, borderColor:'#ddd', paddingBottom:8}}>
          <Text>{m.ts} — {m.client} — {m.email}</Text>
          <Text>HTML: {m.htmlPath.replace(PROPOSALS_DIR,'')}</Text>
          <Text>PDF: {m.pdfPath ? m.pdfPath.replace(PROPOSALS_DIR,'') : 'n/a'}</Text>
          <Button title='Re-send' onPress={()=>resend(m)} />
        </View>
      ))}
      <Text style={{marginTop:12}}>API: {apiBase}</Text>
    </ScrollView>
  );
}

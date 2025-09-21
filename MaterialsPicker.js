import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

const MATERIALS_FILE = FileSystem.documentDirectory + 'materials.json';
const BUNDLE_CSV = FileSystem.bundleDirectory + 'data/materials.csv';

function parseCSV(txt){
  const lines = txt.split(/\r?\n/).filter(l=>l && !l.trim().startsWith('#'));
  const out = [];
  const header = lines.shift().split(',').map(s=>s.trim());
  for(const line of lines){
    const cols = line.split(',').map(s=>s.trim());
    const row = {};
    header.forEach((h,i)=> row[h]=cols[i]);
    if(row.item){
      out.push({name: row.item, cost: Number(row.unit_cost||0), unit: row.unit||'ea', qty: 0});
    }
  }
  return out;
}

export default function MaterialsPicker(){
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(()=>{ (async()=>{
    try{
      const csv = await FileSystem.readAsStringAsync(BUNDLE_CSV);
      const list = parseCSV(csv);
      setItems(list);
    }catch(e){
      setItems([{name:'Screened Topsoil (yd)', cost:80, unit:'yd', qty:0}]);
    }
  })(); }, []);

  useEffect(()=>{
    setTotal(items.reduce((s,i)=> s + (i.cost * (i.qty||0)), 0));
  }, [items]);

  const exportToQuote = async () => {
    await FileSystem.writeAsStringAsync(MATERIALS_FILE, JSON.stringify({items, total}));
    Alert.alert('Exported', 'Materials exported to Quote Builder.');
  };

  return (
    <View>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Materials Picker</Text>
      {items.map((i,idx)=>(
        <View key={idx} style={{marginVertical:6}}>
          <Text>{i.name} — ${i.cost}/{i.unit}</Text>
          <TextInput keyboardType='numeric' placeholder='0' onChangeText={v=>{
            const a=[...items]; a[idx].qty=Number(v||0); setItems(a);
          }} />
        </View>
      ))}
      <Text style={{marginTop:8}}>Materials total: ${total.toFixed(2)}</Text>
      <Button title='Export to Quote' onPress={exportToQuote} />
    </View>
  );
}

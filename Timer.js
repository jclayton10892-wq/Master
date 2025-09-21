import React, {useEffect, useState} from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';

async function loadCrew(){
  try{
    const res = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + 'crew.json'
    );
    return JSON.parse(res);
  }catch(e){
    // fall back to bundled asset path if copied on first run
    return {"members":[{"id":"lead1","name":"Lead","rate":20},{"id":"exp1","name":"Experienced Hand","rate":20},{"id":"helper1","name":"Helper","rate":15}],"default_overhead_pct":0.15,"default_profit_pct":0.25};
  }
}

export default function Timer(){
  const [crewData, setCrewData] = useState({members:[], default_overhead_pct:0.15, default_profit_pct:0.25});
  const [selected, setSelected] = useState([]);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [materials, setMaterials] = useState(0);

  useEffect(()=>{ (async()=>{
    try{
      // copy from app bundle data folder to doc dir on first run
      const src = FileSystem.bundleDirectory + 'data/crew.json';
      const dst = FileSystem.documentDirectory + 'crew.json';
      const info = await FileSystem.getInfoAsync(dst);
      if(!info.exists){
        const file = await FileSystem.readAsStringAsync(src);
        await FileSystem.writeAsStringAsync(dst, file);
      }
    }catch(e){}
    const data = await loadCrew();
    setCrewData(data);
  })(); }, []);

  useEffect(()=>{
    if(!running) return;
    const id = setInterval(()=> setSeconds(s=>s+1), 1000);
    return ()=>clearInterval(id);
  },[running]);

  const hourly = selected.reduce((s,m)=> s + (m.rate||0), 0);
  const hours = seconds/3600.0;
  const labor = hourly * hours;
  const overhead = (labor + Number(materials||0)) * (crewData.default_overhead_pct||0);
  const cost = labor + Number(materials||0) + overhead;
  const suggested = cost * (1 + (crewData.default_profit_pct||0));

  const toggleMember = (m)=>{
    const idx = selected.findIndex(x=>x.id===m.id);
    if(idx>=0){
      const a=[...selected]; a.splice(idx,1); setSelected(a);
    }else{
      setSelected([...selected, m]);
    }
  };

  return (
    <View>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Crew Time Clock & Live Cost Burn</Text>
      <Text>Tap to assign crew:</Text>
      <FlatList
        horizontal
        data={crewData.members}
        keyExtractor={item=>item.id}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>toggleMember(item)} style={{padding:8, margin:4, borderWidth:1, borderColor: selected.find(s=>s.id===item.id)?'black':'#ccc'}}>
            <Text>{item.name} (${item.rate}/hr)</Text>
          </TouchableOpacity>
        )}
      />
      <Text>Materials ($):</Text>
      <TextInput keyboardType='numeric' placeholder='0' onChangeText={v=>setMaterials(Number(v||0))} />
      <View style={{marginVertical:8}}>
        <Button title={running ? 'Stop' : 'Start'} onPress={()=>setRunning(r=>!r)} />
        <Text style={{marginTop:8}}>Elapsed: {seconds}s | Crew hourly: ${hourly.toFixed(2)}</Text>
        <Text>Labor burned: ${labor.toFixed(2)}</Text>
        <Text>Overhead (15% default): ${overhead.toFixed(2)}</Text>
        <Text>Total cost so far: ${cost.toFixed(2)}</Text>
        <Text>Suggested price @25% margin: ${suggested.toFixed(2)}</Text>
      </View>
    </View>
  );
}

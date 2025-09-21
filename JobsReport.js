import React, {useEffect, useState} from 'react';
import { View, Text } from 'react-native';
import * as FileSystem from 'expo-file-system';
const JOBS_FILE = FileSystem.documentDirectory + 'jobs.json';

export default function JobsReport(){
  const [jobs, setJobs] = useState([]);
  useEffect(()=>{ (async()=>{
    try{
      const info = await FileSystem.getInfoAsync(JOBS_FILE);
      if(info.exists){
        const j = JSON.parse(await FileSystem.readAsStringAsync(JOBS_FILE));
        setJobs(j.reverse());
      }
    }catch(e){}
  })(); }, []);
  return (
    <View>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Completed/Saved Quotes</Text>
      {jobs.length === 0 ? <Text>No jobs yet.</Text> : jobs.map((j,idx)=>(
        <View key={idx} style={{marginVertical:6, borderBottomWidth:1, borderColor:'#ddd', paddingBottom:6}}>
          <Text>{new Date(j.date).toLocaleString()} — {j.client}</Text>
          <Text>Price: ${Number(j.price||0).toFixed(2)} | Materials: ${Number(j.materials||0).toFixed(2)}</Text>
          <Text>Labor: ${Number(j.laborCost||0).toFixed(2)} | Overhead: ${Number(j.overhead||0).toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}

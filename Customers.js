import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

const CLIENTS_FILE = FileSystem.documentDirectory + 'clients.json';
const SELECTED_CLIENT_FILE = FileSystem.documentDirectory + 'selected_client.json';

export default function Customers(){
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const load = async ()=>{
    try{
      const info = await FileSystem.getInfoAsync(CLIENTS_FILE);
      if(info.exists){
        const c = JSON.parse(await FileSystem.readAsStringAsync(CLIENTS_FILE));
        setClients(c);
      }
    }catch(e){}
  };
  useEffect(()=>{ load(); }, []);

  const add = async ()=>{
    const c = [...clients, {name, email}];
    setClients(c);
    await FileSystem.writeAsStringAsync(CLIENTS_FILE, JSON.stringify(c));
    setName(''); setEmail('');
    Alert.alert('Added','Client saved.');
  };

  const selectClient = async (c)=>{
    await FileSystem.writeAsStringAsync(SELECTED_CLIENT_FILE, JSON.stringify(c));
    Alert.alert('Selected', `${c.name} set as active. Open Quote to use.`);
  };

  return (
    <View>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Customers</Text>
      <Text style={{marginTop:8}}>Add New</Text>
      <TextInput placeholder='Name' value={name} onChangeText={setName} />
      <TextInput placeholder='Email' autoCapitalize='none' value={email} onChangeText={setEmail} />
      <Button title='Add' onPress={add} />
      <Text style={{marginTop:12, fontWeight:'bold'}}>Saved Clients</Text>
      {clients.length===0 ? <Text>No clients yet.</Text> : clients.map((c,idx)=>(
        <View key={idx} style={{marginVertical:6, borderBottomWidth:1, borderColor:'#ddd', paddingBottom:6}}>
          <Text>{c.name}</Text>
          <Text>{c.email}</Text>
          <Button title='Select for Quote' onPress={()=>selectClient(c)} />
        </View>
      ))}
    </View>
  );
}

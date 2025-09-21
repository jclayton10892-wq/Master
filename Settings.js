import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

const API_FILE = FileSystem.documentDirectory + 'api.json';
const BUNDLE_API = FileSystem.bundleDirectory + 'data/api.json';

export default function Settings(){
  const [url, setUrl] = useState('http://127.0.0.1:8000');

  useEffect(()=>{ (async()=>{
    try{
      const info = await FileSystem.getInfoAsync(API_FILE);
      if(!info.exists){
        const txt = await FileSystem.readAsStringAsync(BUNDLE_API);
        await FileSystem.writeAsStringAsync(API_FILE, txt);
      }
      const data = JSON.parse(await FileSystem.readAsStringAsync(API_FILE));
      setUrl(data.baseUrl || 'http://127.0.0.1:8000');
    }catch(e){}
  })(); }, []);

  const save = async ()=>{
    await FileSystem.writeAsStringAsync(API_FILE, JSON.stringify({baseUrl:url}));
    Alert.alert('Saved', 'API base URL updated.');
  };

  return (
    <View>
      <Text style={{fontSize:18, fontWeight:'bold'}}>Settings</Text>
      <Text>Backend API Base URL</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize='none' autoCorrect={false} />
      <Button title='Save' onPress={save} />
      <Text style={{marginTop:10}}>Tip: If you run the backend on another device/network, update the URL here.</Text>
    </View>
  );
}

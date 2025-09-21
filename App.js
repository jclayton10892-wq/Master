import React, {useState} from 'react';
    import { View, Text, Button, ScrollView } from 'react-native';
    import Timer from './src/screens/Timer';
    import QuoteBuilder from './src/screens/QuoteBuilder';
    import MaterialsPicker from './src/screens/MaterialsPicker';
    import JobsReport from './src/screens/JobsReport';
    import Settings from './src/screens/Settings';
    import Proposals from './src/screens/Proposals';
    import Customers from './src/screens/Customers';
    
    export default function App() {
      const [tab, setTab] = useState('Timer');
      const tabs = ['Timer','Quote','Materials','Report','Customers','Proposals','Settings'];
      const render = () => {
        switch(tab){
          case 'Timer': return <Timer />;
          case 'Quote': return <QuoteBuilder />;
          case 'Materials': return <MaterialsPicker />;
          case 'Report': return <JobsReport />;
          case 'Settings': return <Settings />;
          case 'Proposals': return <Proposals />;
          case 'Customers': return <Customers />;
          default: return <Timer />;
        }
      };
      return (
        <View style={{flex:1, paddingTop: 40}}>
          <View style={{flexDirection:'row', justifyContent:'space-around', paddingVertical:10}}>
            {tabs.map(t => <Button key={t} title={t} onPress={()=>setTab(t)} />)}
          </View>
          <ScrollView style={{flex:1, padding:16}}>{render()}</ScrollView>
        </View>
      );
    }

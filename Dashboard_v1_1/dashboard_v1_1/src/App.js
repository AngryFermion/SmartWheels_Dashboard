import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

import {  connect } from "mqtt"





function App() {


  const [MessageToSend, setMessageToSend] = useState('');

  const [value, SetValues] = useState({
    message: 'Hello'
  })
  var [MessageFromServer, setMessageFromServer] = useState('');

  const [data, setData] = useState(null);



  function SendMessage(Message){
    console.log(Message)
    
  
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({message:Message})
    };
  
   
    fetch("/api_send", requestOptions)
        .then(response => response.json())
        .catch(err=>console.log(err));
  
   
  }

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));

      
  }, []);


 









  return (
    
    <div className="App">
      <div className="content">
        <h1 > SmartWheels Dashboard </h1>
      </div>
      <div className="Input"> 
        <label> Message: 
          <input value= {MessageToSend}
          onChange={e=>setMessageToSend(e.target.value)}
          />
          
        </label>

        <button onClick={()=>SendMessage(MessageToSend)}> 
          Send </button>
        
      </div>
      <div className='ServerResponse'>

        <h1> Message From Server: {data}</h1>

      </div>
    </div>

    
  );
}

export default App;

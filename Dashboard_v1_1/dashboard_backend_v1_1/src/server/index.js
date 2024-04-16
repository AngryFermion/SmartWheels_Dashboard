const express = require("express");
var bodyParser = require('body-parser');
var Mongoclient = require('mongodb').MongoClient;
var multer = require('multer');


var CONNECION_STRING="mongodb+srv://smartwheels:smartwheels@cluster0.tnjxq72.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
var DATABASE_NAME="Telemetry";
var database;


const mqtt = require("mqtt");

const path = require('path');

const cors = require('cors');
const { error } = require("console");



const PORT = process.env.PORT || 3001;
const DB_PORT = process.env.PORT || 5038;

const app = express();
app.use(cors());

// NOTE: Install mongo DB 4.1.0 since latest version has some issue
// and does not connect to the DB.
app.listen(PORT,()=>{
  console.log('IN')
  Mongoclient.connect(CONNECION_STRING,(error,client)=>{
    database = client.db(DATABASE_NAME);
    console.log("Mongo DB connection successful\n")
    console.log('Database:', database)
    insertData('150')
  })
  
})

//

function insertData(val){

  console.log('Inserting new telemetry')
  database.collection("Telemetrycollection").count({},function(error,numberOfDocs){
    database.collection("Telemetrycollection").insertOne({
    id: (numberOfDocs + 1).toString(),
    telemetryName: "Vehicle Speed",
    telemetryValue: val
    })

  });
}

app.use(cors());
var jsonParser = bodyParser.json()
var counter = 1;


app.use(express.static(path.resolve(__dirname, '../dashboard_v1_1/build')));

// MQTT send to server API

function MQTT_post(message){
    var client = mqtt.connect('mqtt://broker.emqx.io');
    console.log('Running MQTT...\n')
    client.on("connect",function(){
    
        
            
            client.publish('AliceToBob',message)
            
            console.log('Publishing...\n')
       
    
        
    });
}


    var dataFromServer = ''
    var client = mqtt.connect('mqtt://broker.emqx.io');
    data = []
    topic = 'BobToAlice';
    console.log('Subscribing...\n')
    client.subscribe(topic, () => {
        console.log(`Subscribe to topic '${topic}'`)
      })

      client.on('message', (topic, payload) => {
        console.log('Received Message:', topic, payload.toString())
        dataFromServer = payload.toString();
      })
      





// Creating API endpoint
app.get("/api", (req, res) => {
    counter = counter + 1
    res.json({ message: dataFromServer });
    insertData(dataFromServer)
    

    
  });

app.post("/api_send",jsonParser,(req,res)=>{
    var data = []
    data = req.body
    console.log('ENDPOINT HIT:',req.body.message);


    // send this message to MQTT server

    MQTT_post(req.body.message)
});

// app.listen(PORT, () => {
//   console.log(`Server listening on ${PORT}`);
// });





  

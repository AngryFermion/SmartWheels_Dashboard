// const express = require("express");
// var bodyParser = require('body-parser');
// var Mongoclient = require('mongodb').MongoClient;
// var multer = require('multer');


// var CONNECION_STRING="mongodb+srv://smartwheels:smartwheels@cluster0.tnjxq72.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// var DATABASE_NAME="Telemetry";
// var database;


// const mqtt = require("mqtt");

// const path = require('path');

// const cors = require('cors');
// const { error } = require("console");



// const PORT = process.env.PORT || 3001;


// const app = express();
// app.use(cors());

// // NOTE: Install mongo DB 4.1.0 since latest version has some issue
// // and does not connect to the DB.
// app.listen(PORT,()=>{
//   console.log('IN')
//   Mongoclient.connect(CONNECION_STRING,(error,client)=>{
//     database = client.db(DATABASE_NAME);
//     console.log("Mongo DB connection successful\n")
//     console.log('Database:', database)
//     insertData('150')
//   })
  
// })

// //

// function insertData(val){

//   console.log('Inserting new telemetry')
//   database.collection("Telemetrycollection").count({},function(error,numberOfDocs){
//     database.collection("Telemetrycollection").insertOne({
//     id: (numberOfDocs + 1).toString(),
//     telemetryName: "Vehicle Speed",
//     telemetryValue: val
//     })

//   });
// }

// app.use(cors());
// var jsonParser = bodyParser.json()
// var counter = 1;


// app.use(express.static(path.resolve(__dirname, '../dashboard_v1_1/build')));

// // MQTT send to server API

// function MQTT_post(message){
//     var client = mqtt.connect('mqtt://broker.emqx.io');
//     console.log('Running MQTT...\n')
//     client.on("connect",function(){
    
        
            
//             client.publish('AliceToBob',message)
            
//             console.log('Publishing...\n')
       
    
        
//     });
// }


//     var dataFromServer = ''
//     var client = mqtt.connect('mqtt://broker.emqx.io');
//     data = []
//     topic = 'BobToAlice';
//     console.log('Subscribing...\n')
//     client.subscribe(topic, () => {
//         console.log(`Subscribe to topic '${topic}'`)
//       })

//       client.on('message', (topic, payload) => {
//         console.log('Received Message:', topic, payload.toString())
//         dataFromServer = payload.toString();
//       })
      





// // Creating API endpoint
// app.get("/api", (req, res) => {
//     counter = counter + 1
//     res.json({ message: dataFromServer });
//     insertData(dataFromServer)
    

    
//   });

// app.post("/api_send",jsonParser,(req,res)=>{
//     var data = []
//     data = req.body
//     console.log('ENDPOINT HIT:',req.body.message);


//     // send this message to MQTT server

//     MQTT_post(req.body.message)
// });

// // app.listen(PORT, () => {
// //   console.log(`Server listening on ${PORT}`);
// // });





  
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


const fs = require('node:fs');
const PORT = process.env.PORT || 3001;



// variables for Software Update
var file_content = [];
var test_buffer_data = [];
var read_file_flag = 0;
var file_index = 0;
var file_row_index = 0;
var fota_cmd = '';
var Topic_UpdateMaster = 'UpdateMaster';
var file_line_number = 0;
var writeStart = 0;
var ping = 0;
var test_buffer_type = Buffer.from("S0");
var test_buffer_BMS_command = [];
const CmdStartFirmwareWrite = '0x00000007';
const CmdJumpToApp  = '0x00000008';
const CmdJumpToBootloader = '0x00000006';
const CmdDelBmsError = '0x0000EE00';
const CmdFetchDeviceFirmware = '0x0000FF00';
const CmdClearDTC = '0x00000D00' // Cell_max_Vltg -> Ble_Fsm.c Ble_PackBmsData()
var client = mqtt.connect('mqtt://broker.emqx.io');


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

function MQTT_post(message,topic){
  //if(writeStart == 0){
    //writeStart  = 1
    // var client = mqtt.connect('mqtt://broker.emqx.io');
    // console.log('Running MQTT...\n')

  //}
    
    
    
        
            
            client.publish(topic,message);
            
            console.log('Publishing...\n');

            
       
            
        
    

    
}


    var dataFromServer = ''
    var client = mqtt.connect('mqtt://broker.emqx.io');
    data = []
    UpdateTopic = 'UpdateSlave';
    TelemetryTopic = 'BobToAlice';
    console.log('Subscribing...\n')
    client.subscribe(UpdateTopic, () => {
        console.log(`Subscribe to topic '${UpdateTopic}'`)
      })


    client.subscribe(TelemetryTopic, () => {
        console.log(`Subscribe to topic '${TelemetryTopic}'`)
      })

      client.on('message', (Topic, payload) => {
        console.log('Received Message:',Topic)

        switch(Topic){
          case "UpdateSlave":
            console.log("Message received from Dummy ESP32:",payload.toString())
            if(payload.toString() == "65"){
              console.log('Write OK. Sending Next line\n');
              
              file_line_number = file_line_number + 1
              StartUpdate(file_line_number);
              //MQTT_post('Hello',Topic_UpdateMaster);
            }
            else if(payload.toString() == "69"){
              console.log('Write FAILED.\n');

            }
            else if(payload.toString() == "0.0.0.0"){

              console.log('Device Active...');
              ping = 1

            }
            break;
          case "BobToAlice":
            dataFromServer = payload.toString();
            break;
          default:
            break;
        }
        
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

    //MQTT_post(req.body.message)
});




const Read_SrecFile=()=>{

  try {
    const data = fs.readFileSync('../SREC/BLE_appl_1_42000.srec', 'utf8');
    return data;
  } catch (err) {
    console.error(err);
  }

  


  
}

// function sleep(ms) {
//   return new Promise<void>(resolve => setTimeout(resolve, ms));
// }


function convertToHex(num) {
 
  switch(num){
    case 'A':
        return 0x0A;
    case 'B':
        return 0x0B;
    case 'C':
        return 0x0C;
    case 'D':
        return 0x0D;
    case 'E':
        return 0x0E;
    case 'F':
        return 0x0F;
    default:
        return Number(num);
  }
 
  return 0
}
async function packCommand(command) {
 
 
  console.log('Packing command....\n')

  var i = 2;     


  while(i<10){

    test_buffer_BMS_command.push(  convertToHex(command[i]) << 4 | convertToHex(command[i+1])  )
    i = i + 2

 
}
}


const StartUpdate=(linenumber,topic)=>{
 
  //+sleep(100);
 
  test_buffer_data = [];
  console.log("LINE NUMBER: ",linenumber)


  // check if line number value is -2.
  // a value of -2 indicates that end of file has reached.
  // if the end of file of file is detected
  // remove the modal responsible for showing progress
  // reset the Bms progress value to zero
  // wait for 4 seconds and retrieve the BMS version of the 
  // new application from the MCU.

  if(linenumber == -2){
    // update process complete
   
    // display = false;
    // setDisplay(display);
    // setModalProgressVisible(false);

    // // dialog pop-up to tell the users that the update is complete.

    

    // versionRequestCount = 0;
    // BmsRequestCount = 0;
    // StopUpdate = 0; // not needed anymore.
    // BmsProgress = 0;
    // setProgress(BmsProgress);
    // SetStopUpdate(StopUpdate);


    // // setTimeout(()=>{GetBmsVersion(),4000});
    // setUpdateModalText('Restarting the BMS. Wait for few seconds');
    // SetUpdateCompleteDialogVisible(true); // making the dialog box visible.

    // setTimeout(() => {

    //   GetBmsVersion();

      
    // }, 10000);


    

      
    

    




    


    // Look for updates again

   
    //LookForUpdates(true); // start looking for updates again with 
                          // a frequency of 30 seconds. Modifiable.
   

   
   

    console.log('Update Complete...\n');
  }


// Increasing the Bms Progress circle by the slice amount.
 
//  BmsProgress += progressSlice;


//  setProgress(BmsProgress);


  // End of line condition also added in the Update feature.

  // at the end of each line read_file_flag is set to zero.
   while((!read_file_flag) && (linenumber != -1)){
     
   
     // file_index moves through each charcter of the entire file
     // file_row_index moves through each row and is reset at the end of each row
     // contents buffer contains the entire .srec file.
     if(file_content[file_index] == '\n'|| file_content[file_index] == '\r'){

       // read_file_flag set to 1 so that while loop exit occurs.
       read_file_flag =1

       // incrementing the file_index so that the file_index pointer reaches the next line.
       file_index ++;
       
     
     }


     else{

      // looking for the the characters S and 0,3,5 from the .srec file.
      // depending of the type the test_buffer_type is populated with the 2 bytes

       if(file_row_index == 0){



         file_index; // not needed
         if(file_content[file_index] == "S"){
           if(file_content[file_index + 1] == "0"){


            // command is set to command start firmware write

             fota_cmd = CmdStartFirmwareWrite

             // payload test_buffer_type populated with 2 character S0
            
             test_buffer_type = Buffer.from("S0")


           }
           else if(file_content[file_index + 1] == "3"){

              // command is set to command start firmware write

             fota_cmd = CmdStartFirmwareWrite
             
             // payload test_buffer_type populated with 2 character S3
             test_buffer_type = Buffer.from("S3")
           }
           else if(file_content[file_index + 1] == "5"){

           
              // if S5 is detected then the end of file has reached and the smartphone app
              // has to tell the BMS MCU to jump to the newly written application.

             fota_cmd = CmdJumpToApp;

             

             // payload test_buffer_type populated with 2 character S3
             test_buffer_type = Buffer.from("S5")

             // Code to show that update is complete

             file_line_number = -3  // so that the file reading stops.

        


           }
         }




       }

       // populating the byte size, address, data and checksum from the srec file
     

       if(file_row_index >= 2){
         if(file_row_index%2 == 0){


           // test_buffer_data array is populated.
           // contents array consist of characters, 2 characters form 1 byte
           // after conversion to hex.


           test_buffer_data.push((convertToHex(file_content[file_index])<<4)|(convertToHex(file_content[file_index+1])))

         
         }
       
       
       }

     }


     // incrementing file_index and file_row_index to read the next set of characters in the same line of .srec file.
     file_index++;
     file_row_index++;
   
   
   
   }


   read_file_flag = 0;
   file_row_index = 0; // file_row_index is reset and is ready to traverse through the next row of Srec file 


   

     // Send lines and receive the error code

     var UpdateMessage = '';
     
     packCommand(fota_cmd)
     UpdateMessage = test_buffer_BMS_command + test_buffer_type + test_buffer_data;

     test_buffer_BMS_command = [];
     test_buffer_data = [];
     console.log('Line ',linenumber,' message:',UpdateMessage);

     MQTT_post(UpdateMessage,Topic_UpdateMaster);
   
 }














function StartUpdate_MQTT(){

      topic = 'UpdateMaster';
      console.log('Reading SREC file....\n');
      
      
      file_content = Read_SrecFile();

      console.log('SREC file contents:\n',file_content);

      StartUpdate(0,Topic_UpdateMaster);

      //console.log( 'Publishing data on topic:',topic);

      //MQTT_post("Hello, let's start update process",topic);
}

app.post("/StartUpdate",jsonParser,(req,res)=>{
  var data = []
  data = req.body
  console.log('ENDPOINT HIT:',req.body.message);
  res.send("Firmware Update Started...");
  console.log('\n starting software update...');
  StartUpdate_MQTT();

 // setInterval(()=>MQTT_post('Hello',Topic_UpdateMaster),2000);
  
});


function PingDevice(){
  fota_cmd = packCommand(CmdFetchDeviceFirmware);
  var Message = '';
  Message = test_buffer_BMS_command;
  var i=0;
  while (i<5){
    console.log('MQTT Sending Command: ',Message.toString());

    MQTT_post(Message.toString(),Topic_UpdateMaster);
    i = i + 1
  }
  test_buffer_BMS_command = [];

  

}

// Endpoint to ping the S32K144 Smartwheel device.

app.post("/PingDevice",jsonParser,(req,res)=>{

  PingDevice();

  if (ping == 1){
    res.send('Device Ready');
    ping = 0;
  }
  else{
    res.send('Device Inactive');
    
  }
});



// app.listen(PORT, () => {
//   console.log(`Server listening on ${PORT}`);
// });





  

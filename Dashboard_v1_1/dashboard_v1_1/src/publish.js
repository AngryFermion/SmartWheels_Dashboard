
const mqtt = require("mqtt");
var client = mqtt.connect('mqtt://broker.emqx.io');



var MessageToSend = 'Hello Bob, Alice from Node!'


client.on("connect",function(){
    
    setInterval(function(){
        if(MessageToSend != ''){
            client.publish('AliceToBob',MessageToSend)
        }
        console.log('Publishing...\n')
    },3000)

    
});
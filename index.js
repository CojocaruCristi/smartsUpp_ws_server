const express = require('express');
const cors = require('cors');
const http = require('http');
const Socket = require('ws');
const {createVisitorClient} = require('smartsupp-websocket');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new Socket.Server({ server });

wss.on('connection', (ws, req) => {
    console.log('WebSocket connected');

  const data = {
    key: process.env.API_KEY,
    id: req.headers?.email,
    email: req.headers?.email,
    phone: req.headers?.phone,
    name: `${req.headers?.name}`,
    };

    const client = createVisitorClient({
        data,
    })
    

    client.connect().then((data) => {
        console.log('SmartsUpp connected==========>');
    }).catch((error) => console.log('Error on SmartsUp connection ==>', error))

    client.on("chat.message_received", (data) => {
        console.log("chat.message_received");


        const message = {
            id: data.message.id,
            type: data.message.content.type,
            subType: data.message.subType,
            text: data.message.content.text,
            data: data.message.content.data,
            createdAt: new Date(data.message.createdAt),
            attachments: data.message.attachments,
            direction: Boolean(data.message.agentId) || data.message.subType === 'bot' ? "received" : "sent"
        };

     

        ws.send(JSON.stringify(message));
    });


  ws.on('message', (message) => {
    console.log('Received message from SmartSupp:');

    try {
        client.chatMessage({
            content: {
                type: "text",
                text: message.toString('utf8')
            }
        });
    } catch (error) {
        console.log('Error on send message to smartsUpp=======>', error);
    }

  });


  ws.on('close', () => {
    console.log('WebSocket disconnected');

    client.disconnect();
  });
});
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Node.js server started on port ${PORT}`);
});
import express from 'express';
import http from 'http';
import * as WebSocket from 'ws';

const port = 6000;

const app = express()
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('../../client/dist'))

wss.on('connection', (socket) => {
  
})


app.listen(port, '192.168.7.131', () => {
  console.log('Listening... ', `http://192.168.7.131:${port}`);
});
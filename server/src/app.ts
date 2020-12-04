import express from 'express';
import http from 'http';
import { Socket, Server as ServerIO } from 'socket.io';
import { normalize, resolve } from 'path';
import { ExpressPeerServer } from 'peer';
import cors from 'cors';
const port = 4200;

const app = express();

app.use(cors({ origin: true }));
const server = http.createServer(app);

const io = new ServerIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const peerServer = ExpressPeerServer(server);

app.use(express.static(normalize(resolve(__dirname, '../../client/dist'))));
app.use('/peerjs', peerServer);

io.on('connection', (socket: Socket) => {
  socket.on('join-room', (roomId: string, userId: string) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);
    console.log('JOIN ROOM', roomId, userId);
    socket.on('disconnect', () => {
      console.log('DISCONNECT ROOM', roomId, userId);
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
    socket.on('message', (msg) => {
      socket.to(roomId).broadcast.emit('message', msg);
    });
  });
});

server.listen(port, '192.168.7.131', () => {
  console.log('Listening... ', `http://192.168.7.131:${port}`);
});

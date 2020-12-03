import './index.sass';
import Peer, { MediaConnection } from 'peerjs';
import { Socket } from 'socket.io-client';

class Chat {
  vidContainer = document.createElement('div');
  messageContainer = document.createElement('div');
  peers: { [key: string]: MediaConnection } = {};
  peerConnection = new Peer(undefined, {
    host: '192.168.7.131',
    port: 4200,
    path: '/peerjs',
  });

  roomId = 'all';

  messages: string[] = [];

  constructor() {
    this.start();
  }

  async start() {
    document.body.appendChild(this.vidContainer);
    document.body.appendChild(this.messageContainer);

    const IO = (
      await import(
        //@ts-ignore
        'socket.io-client/dist/socket.io.js'
      )
    ).default as typeof import('socket.io-client');

    const video = document.createElement('video');
    video.muted = true;

    const socket = IO.io('192.168.7.131:4200/', {});

    const inp = document.createElement('input');
    const send = document.createElement('button');
    send.textContent = 'sendMessage';

    send.addEventListener('click', () => {
      const message = inp.value;
      inp.value = '';
      this.messages.push(message);
      socket.emit('message', message);
      this.renderMessages();
    });

    document.body.appendChild(inp);
    document.body.appendChild(send);

    const stream = await this.getOwnStream();
    this.addVideoStream(video, stream);

    this.peerConnection.on('open', (id) => this.onOpen(id, socket));

    socket.on('user-connected', (userId: string) => this.onUserConnected(userId, stream));

    socket.on('user-disconnected', this.onUserDisconnected);

    socket.on('message', (msg: string) => {
      this.messages.push(msg);
      this.renderMessages();
    });

    this.peerConnection.on('call', (call) => this.onCall(call, stream));
  }

  renderMessages() {
    this.messageContainer.innerHTML = '';
    this.messages.forEach((msg) => {
      const m = document.createElement('div');
      m.textContent = msg;
      this.messageContainer.appendChild(m);
    });
  }

  private onOpen(id: string, socket: Socket) {
    console.log('PEER: open,', id);
    socket.emit('join-room', this.roomId, id);
  }

  private onUserConnected(userId: string, stream: MediaStream) {
    console.log('USER CONNECTED', userId);

    this.connectToNewUser(userId, stream);
  }

  onCall(call: Peer.MediaConnection, stream: MediaStream) {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
      this.addVideoStream(video, userVideoStream);
    });
  }

  onUserDisconnected(userId: string) {
    console.log('USER Disconnected', userId);
    if (this.peers[userId]) this.peers[userId].close();
  }

  connectToNewUser(userId: string, stream: MediaStream) {
    console.log('CONNECT TO NEW USER', userId);
    const call = this.peerConnection.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
      this.addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      video.remove();
    });
    this.peers[userId] = call;
  }

  async getOwnStream() {
    const audioStream = await this.getStream('audio');
    const videoStream = await this.getStream('video');

    const aTrack = audioStream ? audioStream.getTracks() : [];
    const vTrack = videoStream ? videoStream.getTracks() : [];

    const stream = new MediaStream([...aTrack, ...vTrack]);
    return stream;
  }

  async getStream(type: 'audio' | 'video') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        [type]: true,
      });
      return stream;
    } catch {}
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    this.vidContainer.appendChild(video);
  }
}
new Chat();

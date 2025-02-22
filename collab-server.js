const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let sharedDoc = "Start typing...";
let cursorPositions = {};

io.on('connection', (socket) => {
  socket.emit('doc:sync', sharedDoc);
  socket.emit('cursor:sync', cursorPositions);

  socket.on('doc:update', (newContent) => {
    sharedDoc = newContent;
    socket.broadcast.emit('doc:sync', sharedDoc);
  });

  socket.on('cursor:update', (cursorData) => {
    cursorPositions[cursorData.userId] = cursorData.cursorOffset;
    socket.broadcast.emit('cursor:update', cursorData);
  });

  socket.on('disconnect', () => {
    delete cursorPositions[socket.id];
    socket.broadcast.emit('cursor:remove', socket.id);
  });
});

server.listen(3000);

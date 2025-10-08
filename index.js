const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir le fichier index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Écoute des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // rejoindre un salon
  socket.on('join room', (data) => {
    const username = String(data?.username || '').trim();
    const room = String(data?.room || '').trim();
    if (!username || !room) return;

    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    // Notifie tous les membres du salon (y compris le nouveau)
    io.to(room).emit('room message', { message: `${username} a rejoint le salon ${room}.` });
    console.log(`${username} a rejoint le salon ${room}`);
  });

  // messages de salon
  socket.on('chat message', (data) => {
    const username = String(data?.username || '').trim();
    const room = String(data?.room || '').trim();
    const message = String(data?.message || '').trim();
    if (!username || !room || !message) return;

    io.to(room).emit('chat message', { username, room, message });
    console.log(`[${room}] ${username}: ${message}`);
  });

  // déconnexion
  socket.on('disconnect', () => {
    console.log('Un utilisateur est déconnecté');
    const username = socket.data?.username;
    const room = socket.data?.room;
    if (username && room) {
      // Notifie les AUTRES membres du salon
      socket.to(room).emit('room message', {
        message: `${username} a quitté le salon ${room}.`,
      });
      console.log(`${username} a quitté le salon ${room}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});

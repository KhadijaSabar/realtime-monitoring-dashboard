// Gestionnaire WebSocket - Gère la communication temps réel avec le frontend
// Ce fichier configure Socket.io et gère les événements WebSocket

const setupSocketHandlers = (io) => {
  // Connexion d'un nouveau client
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Événement: Client s'abonne aux updates d'un serveur spécifique
    socket.on('join-server', (data) => {
      const { serverId } = data;
      
      if (!serverId) {
        socket.emit('error', { message: 'Server ID is required' });
        return;
      }
      
      // Joindre une "room" spécifique au serveur
      // Permet d'envoyer des updates seulement aux clients qui surveillent ce serveur
      const roomName = `server-${serverId}`;
      socket.join(roomName);
      
      console.log(`Client ${socket.id} joined room ${roomName}`);
      
      // Confirmer au client qu'il a rejoint la room
      socket.emit('joined-server', {
        serverId,
        message: `Subscribed to updates for server ${serverId}`,
      });
    });
    
    // Événement: Client se désabonne des updates d'un serveur
    socket.on('leave-server', (data) => {
      const { serverId } = data;
      
      if (!serverId) {
        return;
      }
      
      const roomName = `server-${serverId}`;
      socket.leave(roomName);
      
      console.log(`Client ${socket.id} left room ${roomName}`);
      
      socket.emit('left-server', {
        serverId,
        message: `Unsubscribed from updates for server ${serverId}`,
      });
    });
    
    // Événement: Client demande la liste des rooms auxquelles il est abonné
    socket.on('get-subscriptions', () => {
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      socket.emit('subscriptions', { rooms });
    });
    
    // Déconnexion du client
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
    
    // Gestion des erreurs WebSocket
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Fonction helper pour émettre des métriques à tous les clients d'un serveur
  // Appelée depuis le contrôleur des métriques
  io.emitMetricsUpdate = (serverId, metrics) => {
    const roomName = `server-${serverId}`;
    io.to(roomName).emit('metrics-update', {
      server_id: serverId,
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  };
  
  // Fonction helper pour émettre un changement de statut serveur
  io.emitServerStatus = (serverId, isActive) => {
    const roomName = `server-${serverId}`;
    io.to(roomName).emit('server-status', {
      server_id: serverId,
      is_active: isActive,
      timestamp: new Date().toISOString(),
    });
  };
  
  // Fonction helper pour émettre une alerte
  io.emitAlert = (serverId, alertData) => {
    const roomName = `server-${serverId}`;
    io.to(roomName).emit('alert', {
      server_id: serverId,
      ...alertData,
      timestamp: new Date().toISOString(),
    });
  };
  
  console.log('WebSocket handlers initialized');
};

module.exports = setupSocketHandlers;

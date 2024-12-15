const WebSocketServer = require('ws').Server;
const socket = new WebSocketServer({ 
    port: 3000, 
});

var clients = new Map();

socket.on('connection', (ws) => {

});
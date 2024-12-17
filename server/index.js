const WebSocketServer = require('ws').Server;
const socket = new WebSocketServer({ 
    port: 3000, 
});

var clients = new Map();
const width = 128;
const height = 128;
var tiles = Array.from({ length: width }, () => Array(height).fill(Math.floor(Math.random() * 8)));


socket.on('connection', (ws) => {
    console.log("Client conncted");
    console.log("Sending client full canvas");
    ws.send(jsonMessage('fullcanvas', jsonCanvas(tiles, width, height)));
});

function jsonCanvas(tiles, width, height) {
    return JSON.stringify({
        tiles: tiles,
        width: width,
        height: height
    })
}
function jsonMessage(type, data) {
    return JSON.stringify({
        type: type,
        data: data
    });
}
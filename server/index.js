const WebSocketServer = require('ws').Server;
const socket = new WebSocketServer({ 
    port: 3000, 
});

var clients = new Map();
const width = 128;
const height = 128;
var tiles = Array.from({ length: width }, () => Array(height).fill(0));


socket.on('connection', (ws) => {
    clients.set(ws, Date.now());
    console.log("Client conncted");
    console.log("Sending client full canvas");
    ws.send(jsonMessage('fullcanvas', jsonCanvas(tiles, width, height)));

    ws.on('message', (message) => {
        try {
            const messageStr = message instanceof Buffer ? message.toString() : message;
            const messageJSON = JSON.parse(messageStr);

            if (messageJSON.type === 'pixelchange') {
                const data = JSON.parse(messageJSON.data);
                const pixelPosition = data.position;
                const pixelColor = data.color;
                if (pixelPosition[0] < 0 || pixelPosition[0] >= width || pixelPosition[1] < 0 || pixelPosition[1] >= height) {
                    throw new Error("Invalid pixel position");
                }
                if (pixelColor < 0 || pixelColor > 7) {
                    throw new Error("Invalid pixel color");
                }
                tiles[pixelPosition[0]][pixelPosition[1]] = pixelColor;
                broadcast(jsonMessage('pixelchange', jsonPixel(pixelPosition[0], pixelPosition[1], pixelColor)));
            }


        } catch (error) {
            console.log(error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error(`Error on channel ${clients.get(ws)}: ${error.message}`);
    });

});

function broadcast(message) {
    var count = 0;
    clients.forEach((value, client) => {
        try {
            client.send(message);
            count++;
        } catch (error) {
            console.log(error);
        }
    })
    console.log(`Broadcasted to ${count} clients`);
}


function jsonMessage(type, data) {
    return JSON.stringify({
        type: type,
        data: data
    });
}

function jsonCanvas(tiles, width, height) {
    return JSON.stringify({
        tiles: tiles,
        width: width,
        height: height
    })
}

function jsonPixel(x, y, color) {
    return JSON.stringify({
        position: [x, y],
        color: color
    });
}
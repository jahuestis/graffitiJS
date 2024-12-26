const fs = require('fs');
const path = require('path');
const WebSocketServer = require('ws').Server;
const socket = new WebSocketServer({ 
    port: 3000, 
});

const cooldown = 0;
var clients = new Map();
var width;
var height;
var tiles;

function loadTiles() {
    try {
        const filePath = path.join(__dirname, 'canvas.json');
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const canvasData = JSON.parse(data);
            tiles = canvasData.tiles;
            width = canvasData.width;
            height = canvasData.height;
        } else {
            throw new Error("Canvas file not found");
        }
    } catch (error) {
        console.error(error);
        width = 128;
        height = 128;
        tiles = Array.from({ length: width }, () => Array(height).fill(0));
    }
}

function writeTiles() {
    try {
        const filePath = path.join(__dirname, 'canvas.json');
        const data = JSON.stringify({
            tiles: tiles, 
            width: width, 
            height: height
        });
        fs.writeFileSync(filePath, data);
        console.log("Canvas saved");
    } catch (error) {
        console.error(error);
    }
}

loadTiles();

// Server Behavior

socket.on('connection', (ws) => {
    ws.send(jsonMessage('requestClient', 0));

    ws.on('message', (message) => {
        try {
            const messageStr = message instanceof Buffer ? message.toString() : message;
            const messageJSON = JSON.parse(messageStr);
            if (messageJSON.application === 'graffitijs') {
                if (messageJSON.type === 'confirmClient') {
                    clients.set(ws, Date.now());
                    console.log("Client conncted");
                    console.log("Sending client full canvas");
                    ws.send(jsonCanvas(tiles, width, height));
                } else if (messageJSON.type === 'pixelchange') {
                    const remainingCooldown = clients.get(ws) + cooldown - Date.now();
                    if (remainingCooldown <= 0) {
                        const data = messageJSON.data;
                        const pixelPosition = data.position;
                        const pixelColor = data.color;
                        if (pixelPosition[0] < 0 || pixelPosition[0] >= width || pixelPosition[1] < 0 || pixelPosition[1] >= height) {
                            throw new Error("Invalid pixel position");
                        }
                        if (pixelColor < 0 || pixelColor > 10) {
                            throw new Error("Invalid pixel color");
                        }
                        tiles[pixelPosition[0]][pixelPosition[1]] = pixelColor;
                        clients.set(ws, Date.now());
                        broadcast(jsonPixel(pixelPosition[0], pixelPosition[1], pixelColor));
                    } else {
                        ws.send(jsonCooldown(remainingCooldown));
                        throw new Error("Client attempted to change pixel within Cooldown period");
                    }
                    
                }
            } else {
                console.log(messageJSON.application)
            }
            
        } catch (error) {
            console.log(error);
        }
    });

    ws.on('close', () => {
        if (clients.has(ws)) {
            clients.delete(ws);
            console.log('Client disconnected');
            writeTiles();
        }

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
        application: 'graffitijs',
        type: type,
        data: data
    });
}

function jsonCanvas(tiles, width, height) {
    return jsonMessage('fullcanvas', {
        tiles: tiles,
        width: width,
        height: height
    });
}

function jsonPixel(x, y, color) {
    return jsonMessage('pixelchange', {
        position: [x, y],
        color: color
    });
}

function jsonCooldown(cooldown) {
    return jsonMessage('cooldown', {
        cooldown: cooldown
    });
}
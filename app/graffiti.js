var canvas;
var context;
var tiles;

var canvasLoaded = false;

const colors = ['black', 'red', 'orange', 'yellow', 'lime', 'cyan', 'magenta', 'white'];
var mouseX = 0;
var mouseY = 0;

// -- Server/Client handling -- 
const socket = new WebSocket('ws://localhost:3000')

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'fullcanvas') { 
        data = JSON.parse(message.data);
        canvas.width = data.width;
        canvas.height = data.height;
        for (let x = 0; x < data.width; x++) {
            for (let y = 0; y < data.height; y++) {
                drawPixel(x, y, data.tiles[x][y]);
            }
        }
        canvasLoaded = true;
    }
    if (message.type === 'pixelchange') {
        const data = JSON.parse(message.data);
        const pixelPosition = data.position;
        const pixelColor = data.color;
        drawPixel(pixelPosition[0], pixelPosition[1], pixelColor);
    }
});



// -- Front End --

document.addEventListener('mousemove', function(event) {
    bounds = canvas.getBoundingClientRect();
    scaleX = canvas.width / bounds.width;
    scaleY = canvas.height / bounds.height;
    mouseX = Math.floor((event.clientX - bounds.left) * scaleX);
    mouseY = Math.floor((event.clientY - bounds.top) * scaleY);
});

window.onload = () => {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    requestAnimationFrame(update);
}

function update() {
    //console.log(`mouse: ${mouseX}, ${mouseY}`);

    // update on next frame
    requestAnimationFrame(update);
}

function drawPixel(x, y, color) {
    context.fillStyle = colors[color];
    context.fillRect(x, y, 1, 1);
}
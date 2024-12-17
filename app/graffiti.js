var canvas;
var context;
var tiles;

var canvasLoaded = false;

const colors = ['black', 'red', 'orange', 'yellow', 'lime', 'cyan', 'magenta', 'white'];
var mouseX = 0;
var mouseY = 0;

const colorButtons = Array.from(document.getElementsByName("color"));
var colorSelected = Math.floor(Math.random() * colors.length);
colorButtons.forEach(color => {
    console.log(color.value);
    if (color.value == colorSelected) {
        color.checked = true;
    }
    color.addEventListener('change', function() {
        colorSelected = this.value;
        console.log(colorSelected);
    });
});
console.log(colorSelected);


// -- Server/Client handling -- 
const socket = new WebSocket('ws://localhost:3000')

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const messageType = message.type;

    if (messageType === 'fullcanvas') { 
        data = JSON.parse(message.data);
        canvas.width = data.width;
        canvas.height = data.height;
        for (let x = 0; x < data.width; x++) {
            for (let y = 0; y < data.height; y++) {
                drawPixel(x, y, data.tiles[x][y]);
            }
        }
        canvasLoaded = true;
    } else if (messageType === 'pixelchange') {
        const data = JSON.parse(message.data);
        const pixelPosition = data.position;
        const pixelColor = data.color;

        console.log(`pixelchange: ${pixelPosition[0]}, ${pixelPosition[1]}, ${pixelColor}`);

        drawPixel(pixelPosition[0], pixelPosition[1], pixelColor);
    } else {
        console.log(event.data);
    }
});

function jsonMessage(type, data) {
    return JSON.stringify({
        type: type,
        data: data
    });
}

function jsonPixel(x, y, color) {
    return JSON.stringify({
        position: [x, y],
        color: color
    });
}



// -- Front End --

window.onload = () => {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    requestAnimationFrame(update);
}

document.addEventListener('mousemove', function(event) {
    bounds = canvas.getBoundingClientRect();
    scaleX = canvas.width / bounds.width;
    scaleY = canvas.height / bounds.height;
    mouseX = Math.floor((event.clientX - bounds.left) * scaleX);
    mouseY = Math.floor((event.clientY - bounds.top) * scaleY);
});

function update() {
    //console.log(`mouse: ${mouseX}, ${mouseY}`);

    // update on next frame
    requestAnimationFrame(update);
}

function drawPixel(x, y, color) {
    context.fillStyle = colors[color];
    context.fillRect(x, y, 1, 1);
}

document.addEventListener('click', function(event) {
    if (canvasLoaded && mouseX >= 0 && mouseX < canvas.width && mouseY >= 0 && mouseY < canvas.height) {
        console.log(jsonPixel(mouseX, mouseY, parseInt(colorSelected)));
        socket.send(jsonMessage('pixelchange', jsonPixel(mouseX, mouseY, parseInt(colorSelected))));
    }
});
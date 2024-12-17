var canvas;
var context;
var tiles;

var pixels;
var width;
var height;
var canvasLoaded = false;
const upscale = 10;
var canvasPosition = [0, 0];

const colors = ['black', 'red', 'orange', 'yellow', 'lime', 'cyan', 'magenta', 'white'];
var mouseX = 0;
var mouseY = 0;
var zoom = 1;

const colorButtons = Array.from(document.getElementsByName("color"));
var colorSelected = Math.floor(Math.random() * colors.length);
colorButtons.forEach(color => {
    if (color.value == colorSelected) {
        color.checked = true;
    }
    color.addEventListener('change', function() {
        colorSelected = this.value;
    });
});


// -- Server/Client handling -- 
const socket = new WebSocket('ws://localhost:3000')

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const messageType = message.type;

    if (messageType === 'fullcanvas') { 
        data = JSON.parse(message.data);
        pixels = data.tiles;
        width = data.width;
        height = data.height;
        canvas.width = width * upscale;
        canvas.height = height * upscale;
        canvasLoaded = true;
    } else if (messageType === 'pixelchange') {
        const data = JSON.parse(message.data);
        const pixelPosition = data.position;
        const pixelColor = data.color;

        console.log(`pixelchange: ${pixelPosition[0]}, ${pixelPosition[1]}, ${pixelColor}`);
        pixels[pixelPosition[0]][pixelPosition[1]] = pixelColor;
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

    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();

        if (event.deltaY < 0) {
            zoom = Math.min(zoom * 1.2, 10); // Increase zoom by 10% (max zoom is 5x)
        } else {
            zoom = Math.max(zoom * 0.8, 1); // Decrease zoom by 10% (min zoom is 0.1x)
        }

        console.log(`Zoom: ${zoom}`);

    }, { passive: false });

    canvas.addEventListener('click', function(event) {
        if (canvasLoaded && mouseX >= 0 && mouseX < canvas.width && mouseY >= 0 && mouseY < canvas.height) {
            socket.send(jsonMessage('pixelchange', jsonPixel(mouseX, mouseY, parseInt(colorSelected))));
        }
    });

    requestAnimationFrame(update);
}

document.addEventListener('mousemove', function(event) {
    bounds = canvas.getBoundingClientRect();
    scaleX = canvas.width / bounds.width;
    scaleY = canvas.height / bounds.height;
    mouseX = Math.floor((event.clientX - bounds.left) * scaleX / zoom / upscale);
    mouseY = Math.floor((event.clientY - bounds.top) * scaleY / zoom / upscale);
});

function update() {
    if (canvasLoaded) {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                drawPixel(x, y, pixels[x][y]);
            }
        }
    }

    // update on next frame
    requestAnimationFrame(update);
}

function drawPixel(x, y, color) {
    context.fillStyle = colors[color];
    context.fillRect(x * zoom * upscale, y * zoom * upscale, zoom * upscale, zoom * upscale);
}




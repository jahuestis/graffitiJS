var canvas;
var context;
var tiles;

var pixels;
var width;
var height;
var canvasLoaded = false;
const upscale = 8;
var canvasOffset = [0, 0];

const colors = ['black', 'red', 'orange', 'yellow', 'lime', 'dodgerblue', 'magenta', 'white', 'gray', 'brown', 'pink'];
var mouseXPrev = 0;
var mouseYPrev = 0;
var mouseX = 0;
var mouseY = 0;
var gridX = 0;
var gridY = 0;
var zoom = 1;
var zoomTargetX = 0;
var zoomTargetY = 0;
var offsetting = false;

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

const alertElement = document.getElementById('alert');
const cooldownElement = document.getElementById('cooldown');

// -- Server/Client handling -- 
const socket = new WebSocket('wss://node.beanswithwater.net/graffiti')

socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const application = message.application;
    const messageType = message.type;
    const data = message.data;
    
    if (application === 'graffitijs') {
        if (messageType === 'requestClient'){   
            socket.send(jsonMessage('confirmClient', 0));
    
        } else if (messageType === 'fullcanvas') {
            pixels = data.tiles;
            width = data.width;
            height = data.height;
            canvas.width = width * upscale;
            canvas.height = height * upscale;
            canvasLoaded = true;
        } else if (messageType === 'pixelchange') {
            alertElement.style.display = 'none';
            const pixelPosition = data.position;
            const pixelColor = data.color;
    
            //console.log(`pixelchange: ${pixelPosition[0]}, ${pixelPosition[1]}, ${pixelColor}`);
            pixels[pixelPosition[0]][pixelPosition[1]] = pixelColor;
        } else if (messageType ==='cooldown') {
            const cooldown = data.cooldown;
            cooldownElement.textContent = `cooldown: ${Math.ceil(cooldown / 1000)} seconds`;
            cooldownElement.style.display = 'block';
            setTimeout(endCooldown, cooldown);
        } else if (messageType === 'alert') {
            alertElement.textContent = data.text;
            alertElement.style.display = 'block';
        } else {
            console.log(event.data);
        }
    }
});

function jsonMessage(type, data) {
    return JSON.stringify({
        application: 'graffitijs',
        type: type,
        data: data
    });
}

function jsonPixel(x, y, color) {
    return jsonMessage('pixelchange', {
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
            zoom = Math.min(zoom * 1.25, 10); // Increase zoom by 10% (max zoom is 5x)
        } else {
            zoom = Math.max(zoom * 0.75, 1); // Decrease zoom by 10% (min zoom is 0.1x)
        }

        zoomTargetX = mouseX;
        zoomTargetY = mouseY;

        //console.log(`Zoom: ${zoom}`);

    }, { passive: false });

    canvas.addEventListener('click', function(event) {
        if (canvasLoaded && mouseX >= 0 && mouseX < canvas.width && mouseY >= 0 && mouseY < canvas.height) {
            socket.send(jsonPixel(gridX, gridY, parseInt(colorSelected)));
        }
    });

    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault(); // Disable the default right-click menu
    });

    alertElement.style.display = 'none';
    cooldownElement.style.display = 'none';
    requestAnimationFrame(update);
}

document.addEventListener('mousedown', function(event) {
    if (event.button === 2) {
        offsetting = true;
    }
})

document.addEventListener('mouseup', function(event) {
    if (event.button === 2) {
        offsetting = false;
    }
})

document.addEventListener('mousemove', function(event) {
    bounds = canvas.getBoundingClientRect();
    scaleX = canvas.width / bounds.width;
    scaleY = canvas.height / bounds.height;
    mouseX = (event.clientX - bounds.left) * scaleX;
    mouseY = (event.clientY - bounds.top) * scaleY;
    gridX = Math.floor((mouseX - (canvasOffset[0] + (canvas.width / 2) - (canvas.width / 2) * zoom)) / zoom / upscale)
    gridY = Math.floor((mouseY - (canvasOffset[1] + (canvas.height / 2) - (canvas.height / 2) * zoom)) / zoom / upscale)
    //console.log(`Mouse: ${mouseX}, ${mouseY}, ${gridX}, ${gridY}`);
});

function update() {
    // Offset canvas
    if (offsetting) {
        canvasOffset[0] += (mouseX - mouseXPrev);
        canvasOffset[1] += (mouseY - mouseYPrev);
    }
    // Horizontal bounds
    if (canvasOffset[0] < canvas.width / 2 - (canvas.width / 2) * zoom) {
        canvasOffset[0] = canvas.width / 2 - (canvas.width / 2) * zoom; // Right bound
    } else if (canvasOffset[0] > -(canvas.width / 2 - (canvas.width / 2) * zoom)) {
        canvasOffset[0] = -(canvas.width / 2 - (canvas.width / 2) * zoom); // Left bound
    }

    // Vertical bounds
    if (canvasOffset[1] < canvas.height / 2 - (canvas.height / 2) * zoom) {
        canvasOffset[1] = canvas.height / 2 - (canvas.height / 2) * zoom; // Bottom bound
    } else if (canvasOffset[1] > -(canvas.height / 2 - (canvas.height / 2) * zoom)) {
        canvasOffset[1] = -(canvas.height / 2 - (canvas.height / 2) * zoom); // Top bound
    }

    //console.log(`Offset: ${canvasOffset[0]}, ${canvasOffset[1]}`);

    // draw canvas
    drawBackground();
    if (canvasLoaded) {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                drawPixel(x, y, pixels[x][y]);
            }
        }
    }

    // update on next frame
    requestAnimationFrame(update);
    mouseXPrev = mouseX;
    mouseYPrev = mouseY;
}

function drawBackground() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPixel(x, y, color) {
    context.fillStyle = colors[color];
    context.fillRect(
        x * zoom * upscale + (canvasOffset[0] + (canvas.width / 2) - (canvas.width / 2) * zoom), 
        y * zoom * upscale + (canvasOffset[1] + (canvas.width / 2) - (canvas.height / 2) * zoom), 
        zoom * upscale, 
        zoom * upscale
    );
}

function endCooldown() {
    cooldownElement.style.display = 'none';
}

document.getElementById('download').addEventListener('click', downloadCanvas);

function downloadCanvas() {
    const downloadCanvas = document.createElement('canvas')
    downloadCanvas.height = height * upscale;
    downloadCanvas.width = width * upscale;
    
    const downloadContext = downloadCanvas.getContext('2d');
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            downloadContext.fillStyle = colors[pixels[x][y]];
            downloadContext.fillRect(x * upscale, y * upscale, upscale, upscale);
        }
    }
    const link = document.createElement('a');
    link.download = 'graffitiJS.png';
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
}



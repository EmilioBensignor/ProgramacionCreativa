const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const eases = require('eases');

// CONFIGURACIÓN PRINCIPAL
// Modifica las dimensiones para cambiar el tamaño del canvas
const settings = {
    dimensions: [1200, 400], // [ancho, alto] de la franja
    animate: true,
};

const particles = [];
const cursor = { x: 9999, y: 9999 };

// PALETA DE COLORES
const pomegranateColors = [
    'rgba(168, 28, 28, 0.9)',    // Rojo oscuro
    'rgba(196, 33, 33, 0.9)',    // Rojo medio
    'rgba(220, 48, 48, 0.9)',    // Rojo brillante
    'rgba(232, 78, 78, 0.9)',    // Rojo claro
    'rgba(147, 24, 24, 0.9)',    // Rojo profundo
];

let elCanvas;

const sketch = ({ width, height, canvas }) => {
    let x, y, particle;

    // CONFIGURACIÓN DE PARTÍCULAS
    const particleRadius = 10;    // Tamaño de las partículas (antes 6)
    const numCols = 45;          // Número de columnas (antes 60)
    const numRows = 15;          // Número de filas (antes 15)

    // CONFIGURACIÓN DE DISTRIBUCIÓN
    const marginX = 0;           // Margen horizontal (0 para ocupar todo el ancho)
    const marginY = 0;           // Margen vertical (0 para ocupar todo el alto)
    const randomPosition = 5;    // Cantidad de posición aleatoria (antes 3)

    elCanvas = canvas;
    canvas.addEventListener('mouseenter', onMouseDown);

    // Crear grid de partículas
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            // Distribuir partículas uniformemente
            x = (width * marginX) + (j * (width * (1 - 2 * marginX) / (numCols - 1)));
            y = (height * marginY) + (i * (height * (1 - 2 * marginY) / (numRows - 1)));

            // Añadir aleatoriedad a la posición
            // Aumenta o disminuye randomPosition para más o menos aleatoriedad
            x += random.range(-randomPosition, randomPosition);
            y += random.range(-randomPosition, randomPosition);

            // Seleccionar color aleatorio de la paleta
            const color = random.pick(pomegranateColors);

            particle = new Particle({
                x,
                y,
                radius: particleRadius,
                color,
                // CONFIGURACIÓN DE COMPORTAMIENTO DE PARTÍCULAS
                // Estos valores afectan cómo reaccionan las partículas al mouse
                minDist: random.range(100, 200),    // Distancia de influencia del cursor (antes 50, 100)
                pushFactor: random.range(0.015, 0.03),  // Qué tanto se alejan del cursor
                pullFactor: random.range(0.01, 0.01),   // Qué tan rápido vuelven a su posición
                dampFactor: random.range(0.90, 0.92),   // Qué tanto mantienen su movimiento
            });

            particles.push(particle);
        }
    }

    // CONFIGURACIÓN DEL FONDO
    return ({ context, width, height }) => {
        context.fillStyle = 'transparent';  // Color de fondo
        context.fillRect(0, 0, width, height);

        particles.forEach(particle => {
            particle.update();
            particle.draw(context);
        });
    };
};

// Manejo de eventos del mouse
const onMouseDown = (e) => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    onMouseMove(e);
};

const onMouseMove = (e) => {
    const x = (e.offsetX / elCanvas.offsetWidth) * elCanvas.width;
    const y = (e.offsetY / elCanvas.offsetHeight) * elCanvas.height;
    cursor.x = x;
    cursor.y = y;
};

const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    cursor.x = 9999;
    cursor.y = 9999;
};

const start = async () => {
    canvasSketch(sketch, settings);
};

start();

class Particle {
    constructor({ x, y, radius, color, minDist, pushFactor, pullFactor, dampFactor }) {
        // Posición
        this.x = x;
        this.y = y;
        this.ix = x;  // Posición inicial X
        this.iy = y;  // Posición inicial Y

        // Física
        this.ax = 0;  // Aceleración X
        this.ay = 0;  // Aceleración Y
        this.vx = 0;  // Velocidad X
        this.vy = 0;  // Velocidad Y

        // Apariencia
        this.radius = radius;
        this.color = color;

        // Comportamiento
        this.minDist = minDist;       // Distancia de influencia del cursor
        this.pushFactor = pushFactor; // Fuerza de repulsión
        this.pullFactor = pullFactor; // Fuerza de atracción a posición original
        this.dampFactor = dampFactor; // Factor de amortiguación
    }

    update() {
        let dx, dy, dd, distDelta;

        // Fuerza de atracción al punto original
        dx = this.ix - this.x;
        dy = this.iy - this.y;
        dd = Math.sqrt(dx * dx + dy * dy);

        this.ax = dx * this.pullFactor;
        this.ay = dy * this.pullFactor;

        // Fuerza de repulsión del cursor
        dx = this.x - cursor.x;
        dy = this.y - cursor.y;
        dd = Math.sqrt(dx * dx + dy * dy);

        distDelta = this.minDist - dd;

        if (dd < this.minDist) {
            this.ax += (dx / dd) * distDelta * this.pushFactor;
            this.ay += (dy / dd) * distDelta * this.pushFactor;
        }

        // Aplicar fuerzas
        this.vx += this.ax;
        this.vy += this.ay;

        this.vx *= this.dampFactor;
        this.vy *= this.dampFactor;

        this.x += this.vx;
        this.y += this.vy;
    }

    draw(context) {
        context.save();
        context.translate(this.x, this.y);
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(0, 0, this.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}
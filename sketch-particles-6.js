const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const eases = require('eases');

// Resetear estilos CSS por defecto del navegador
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

// CONFIGURACIÓN PRINCIPAL
const settings = {
    dimensions: [window.innerWidth, 400],
    animate: true,
    styleCanvas: false, // Desactivar estilos automáticos
    // Configuración específica del canvas
    attributes: {
        style: [
            'display: block',
            'margin: 0',
            'padding: 0',
            'position: fixed',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 400px',
            'box-shadow: none'
        ].join(';')
    }
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

// Función para manejar el redimensionamiento de la ventana
const onWindowResize = () => {
    if (elCanvas) {
        const width = window.innerWidth;
        elCanvas.width = width;
        elCanvas.style.width = '100%';
        // Asegurarnos de que los estilos se mantengan
        elCanvas.style.margin = '0';
        elCanvas.style.display = 'block';
        elCanvas.style.boxShadow = 'none';
    }
};

const sketch = ({ width, height, canvas }) => {
    let x, y, particle;

    // CONFIGURACIÓN DE PARTÍCULAS
    const particleRadius = 10;
    const numCols = 45;
    const numRows = 15;

    // CONFIGURACIÓN DE DISTRIBUCIÓN
    const marginX = 0;
    const marginY = 0;
    const randomPosition = 5;

    elCanvas = canvas;

    // Asegurarnos de que los estilos se apliquen correctamente
    canvas.style.margin = '0';
    canvas.style.display = 'block';
    canvas.style.boxShadow = 'none';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '400px';

    canvas.addEventListener('mouseenter', onMouseDown);
    window.addEventListener('resize', onWindowResize);

    // Limpiar partículas existentes
    particles.length = 0;

    // Crear grid de partículas
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            x = (width * marginX) + (j * (width * (1 - 2 * marginX) / (numCols - 1)));
            y = (height * marginY) + (i * (height * (1 - 2 * marginY) / (numRows - 1)));

            x += random.range(-randomPosition, randomPosition);
            y += random.range(-randomPosition, randomPosition);

            const color = random.pick(pomegranateColors);

            particle = new Particle({
                x,
                y,
                radius: particleRadius,
                color,
                minDist: random.range(100, 200),
                pushFactor: random.range(0.015, 0.03),
                pullFactor: random.range(0.01, 0.01),
                dampFactor: random.range(0.90, 0.92),
            });

            particles.push(particle);
        }
    }

    return ({ context, width, height }) => {
        context.fillStyle = 'white';
        context.fillRect(0, 0, width, height);

        particles.forEach(particle => {
            particle.update();
            particle.draw(context);
        });
    };
};

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

// Iniciar después de que el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    canvasSketch(sketch, settings);
});
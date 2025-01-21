const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
};

const particles = [];
const cursor = { x: 9999, y: 9999 };

let elCanvas;

// Agregamos las funciones de manejo de eventos del mouse
const onMouseDown = (e) => {
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  onMouseMove(e);
};

const onMouseMove = (e) => {
  const rect = elCanvas.getBoundingClientRect();

  cursor.x = e.clientX - rect.left;
  cursor.y = e.clientY - rect.top;
};

const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  cursor.x = 9999;
  cursor.y = 9999;
};

const sketch = ({ width, height, canvas }) => {
  let x, y, particle;
  let pos = [];

  elCanvas = canvas;
  canvas.addEventListener('mousedown', onMouseDown);

  // Aumentamos el número de partículas para mayor densidad
  for (let i = 0; i < 250; i++) {
    x = width * 0.5;
    y = height * 0.5;

    // Reducimos el radio del círculo para que las partículas estén más juntas
    random.insideCircle(300, pos);
    x += pos[0];
    y += pos[1];

    // Agregamos variación en el tamaño de las partículas
    const radius = random.range(8, 12);
    particle = new Particle({ x, y, radius });

    particles.push(particle);
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

class Particle {
  constructor({ x, y, radius = 10 }) {
    this.x = x;
    this.y = y;
    this.ax = 0;
    this.ay = 0;
    this.vx = 0;
    this.vy = 0;
    this.ix = x;
    this.iy = y;
    this.radius = radius;
    this.rotation = random.range(0, Math.PI * 2);
    this.minDist = 80;
    this.pushFactor = 0.015;
    this.pullFactor = 0.003;
    this.dampFactor = 0.95;

    // Color base para los arilos
    this.baseHue = random.range(350, 355); // Rojo granada
    this.baseSaturation = random.range(85, 95);
    this.baseLightness = random.range(45, 55);
  }

  update() {
    let dx, dy, dd, distDelta;

    dx = this.ix - this.x;
    dy = this.iy - this.y;

    this.ax = dx * this.pullFactor;
    this.ay = dy * this.pullFactor;

    dx = this.x - cursor.x;
    dy = this.y - cursor.y;
    dd = Math.sqrt(dx * dx + dy * dy);

    distDelta = this.minDist - dd;

    if (dd < this.minDist) {
      this.ax += (dx / dd) * distDelta * this.pushFactor;
      this.ay += (dy / dd) * distDelta * this.pushFactor;
    }

    this.vx += this.ax;
    this.vy += this.ay;

    this.vx *= this.dampFactor;
    this.vy *= this.dampFactor;

    this.x += this.vx;
    this.y += this.vy;

    // Actualizar rotación suavemente
    this.rotation += this.vx * 0.1;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.rotation);

    // Color principal del arilo
    context.fillStyle = `hsl(${this.baseHue}, ${this.baseSaturation}%, ${this.baseLightness}%)`;

    // Dibujamos una forma más orgánica para el arilo
    context.beginPath();
    context.moveTo(0, -this.radius);

    // Crear una forma más irregular y orgánica
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const randomRadius = this.radius * random.range(0.8, 1.2);
      const x = Math.cos(angle) * randomRadius;
      const y = Math.sin(angle) * randomRadius;

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        const cp1x = Math.cos(angle - 0.2) * randomRadius * 1.2;
        const cp1y = Math.sin(angle - 0.2) * randomRadius * 1.2;
        context.quadraticCurveTo(cp1x, cp1y, x, y);
      }
    }

    context.closePath();
    context.fill();

    // Agregar un brillo
    const gradient = context.createRadialGradient(
      -this.radius * 0.3, -this.radius * 0.3, 0,
      0, 0, this.radius
    );
    gradient.addColorStop(0, `hsla(${this.baseHue}, ${this.baseSaturation}%, ${this.baseLightness + 20}%, 0.5)`);
    gradient.addColorStop(1, `hsla(${this.baseHue}, ${this.baseSaturation}%, ${this.baseLightness}%, 0)`);

    context.fillStyle = gradient;
    context.fill();

    context.restore();
  }
}

canvasSketch(sketch, settings);
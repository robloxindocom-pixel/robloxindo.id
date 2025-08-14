// Tunggu DOM sepenuhnya siap
document.addEventListener('DOMContentLoaded', () => {
  // Ambil elemen setelah DOM siap
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  const textElement = document.getElementById('text-effect');

  // Set ukuran canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Variabel
  let particles = [];
  let textParticles = [];
  let formingText = false;
  let textFormed = false;
  let explosionDone = false;

  // Mouse interaction
  let mouse = {
    x: undefined,
    y: undefined,
    radius: 150
  };

  // 🔊 Suara ledakan (hanya sekali)
  const explosionSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-whoosh-whoosh-3000.mp3');
  const clickSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-small-impact-674.mp3');

  function playExplosion() {
    explosionSound.currentTime = 0;
    explosionSound.play().catch(e => console.log("Suara ledakan diblokir"));
  }

  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.log("Suara klik diblokir"));
  }

  // Event: mouse move
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });

  // Event: klik → ledakan kecil (opsional, bisa dihapus)
  window.addEventListener('click', (e) => {
    playClick();
    for (let i = 0; i < 150; i++) {
      const hue = Math.random() * 20 + 20;
      const color = `hsl(${hue}, 100%, 65%)`;
      const size = Math.random() * 5 + 1;
      particles.push(new Particle(e.x, e.y, color, size));
    }
  });

  // Class Partikel (harus didefinisikan SEBELUM digunakan)
  class Particle {
    constructor(x, y, color = 'orange', size = 2) {
      this.x = x;
      this.y = y;
      this.originX = x;
      this.originY = y;
      this.size = size;
      this.color = color;
      this.speedX = 0;
      this.speedY = 0;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    update() {
      // 1. Berkumpul ke posisi teks
      if (formingText && !textFormed) {
        const dx = this.originX - this.x;
        const dy = this.originY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
          this.x += dx * 0.05;
          this.y += dy * 0.05;
        }
      }
      // 2. Meledak: gunakan kecepatan tinggi
      else if (!explosionDone) {
        if (this.speedX === 0 && this.speedY === 0) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 3;
          this.speedX = Math.cos(angle) * speed;
          this.speedY = Math.sin(angle) * speed;
        }
        this.x += this.speedX;
        this.y += this.speedY;
      }
      // 3. Setelah meledak → interaksi + gerakan santai
      else {
        // Tarik ke mouse
        if (mouse.x && mouse.y) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const strength = (1 - force) * 3;
            this.speedX -= dx * force * 0.06 * strength;
            this.speedY -= dy * force * 0.06 * strength;
          }
        }

        // Gerakan santai
        this.speedX += (Math.random() - 0.5) * 0.2;
        this.speedY += (Math.random() - 0.5) * 0.2;

        // Batasi kecepatan
        if (this.speedX > 4) this.speedX = 4;
        if (this.speedX < -4) this.speedX = -4;
        if (this.speedY > 4) this.speedY = 4;
        if (this.speedY < -4) this.speedY = -4;

        this.x += this.speedX;
        this.y += this.speedY;

        // Loop di layar
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
    }
  }

  // Ambil posisi dari teks
  function createTextParticles() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.font = 'bold 70px Arial';
    tempCtx.fillStyle = 'white';
    const text = textElement.textContent;
    const metrics = tempCtx.measureText(text);
    const x = (canvas.width - metrics.width) / 2;
    const y = canvas.height / 2;

    tempCtx.fillText(text, x, y);

    const pixels = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let y = 0; y < canvas.height; y += 6) {
      for (let x = 0; x < canvas.width; x += 6) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] > 0) {
          textParticles.push({ x, y });
        }
      }
    }

    // Acak urutan
    textParticles.sort(() => Math.random() - 0.5);

    // Buat 500 partikel AWAL dari luar layar
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * canvas.width * 3 - canvas.width;
      const y = Math.random() * canvas.height * 3 - canvas.height;
      const hue = Math.random() * 20 + 20;
      const size = Math.random() * 5 + 1;
      particles.push(new Particle(x, y, `hsl(${hue}, 100%, 65%)`, size));
    }
  }

  // Animasi utama
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Cek apakah semua partikel sudah dekat posisi teks
    if (formingText && !textFormed) {
      const allClose = particles.every(p => {
        const dx = p.originX - p.x;
        const dy = p.originY - p.y;
        return Math.sqrt(dx * dx + dy * dy) < 8;
      });

      if (allClose && !explosionDone) {
        textFormed = true;
        textElement.style.opacity = 1;
        playExplosion(); // 🔊 Suara ledakan
        explosionDone = true; // Mulai ledakan
      }
    }

    requestAnimationFrame(animate);
  }

  // Resize
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Inisialisasi
  createTextParticles();

  // Mulai bentuk teks setelah 1 detik
  setTimeout(() => {
    formingText = true;
    for (let i = 0; i < Math.min(particles.length, textParticles.length); i++) {
      particles[i].originX = textParticles[i].x;
      particles[i].originY = textParticles[i].y;
    }
  }, 1000);

  // Jalankan animasi
  animate();
});
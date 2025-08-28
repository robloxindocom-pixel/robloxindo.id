<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>3D Particle: noobs market</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background-color: #000;
      font-family: Arial, sans-serif;
    }
    #text-effect {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 24px;
      opacity: 0;
      transition: opacity 1s;
      z-index: 10;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="text-effect">noobs market</div>
  <script type="module">
    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
    import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/loaders/FontLoader.js';
    import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/geometries/TextGeometry.js';

    // Suara
    const explosionSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-whoosh-whoosh-3000.mp3');
    const clickSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-small-impact-674.mp3');
    explosionSound.preload = 'auto';
    clickSound.preload = 'auto';

    function playExplosion() {
      explosionSound.currentTime = 0;
      explosionSound.play().catch(e => console.log("Suara ledakan diblokir:", e));
    }

    function playClick() {
      clickSound.currentTime = 0;
      clickSound.play().catch(e => console.log("Suara klik diblokir:", e));
    }

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 50;

    // Mouse
    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', () => {
      playClick();
      // Bisa tambah efek klik di sini (misal: partikel tambahan)
    });

    // Partikel
    let particles = [];
    let particlePositions = [];
    let formingText = false;
    let textFormed = false;
    let explosionDone = false;

    // Material partikel
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.4,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Font loader
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
      const textGeometry = new TextGeometry('noobs market', {
        font: font,
        size: 5,
        height: 0.5,
        curveSegments: 6,
        bevelEnabled: false
      });

      textGeometry.computeBoundingBox();
      const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);

      const positions = [];
      textGeometry.translate(centerOffset, 0, 0);

      const textVertices = textGeometry.attributes.position.array;
      for (let i = 0; i < textVertices.length; i += 3) {
        positions.push(
          textVertices[i] + (Math.random() - 0.5),
          textVertices[i + 1] + (Math.random() - 0.5),
          textVertices[i + 2] + (Math.random() - 0.5)
        );
      }

      // Acak posisi
      particlePositions = positions.sort(() => Math.random() - 0.5);

      // Inisialisasi partikel dari luar area
      const initialPositions = [];
      for (let i = 0; i < particlePositions.length; i += 3) {
        initialPositions.push(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
      }

      particleGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(initialPositions, 3)
      );

      // Mulai formasi setelah 1 detik
      setTimeout(() => {
        formingText = true;
        document.getElementById('text-effect').style.opacity = 1;
      }, 1000);
    });

    // Update posisi partikel
    function animateParticles() {
      if (!formingText || explosionDone) return;

      const positions = particleGeometry.attributes.position.array;

      let allClose = true;
      const threshold = 0.5;

      for (let i = 0; i < positions.length; i += 3) {
        const targetX = particlePositions[i];
        const targetY = particlePositions[i + 1];
        const targetZ = particlePositions[i + 2];

        const dx = targetX - positions[i];
        const dy = targetY - positions[i + 1];
        const dz = targetZ - positions[i + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > threshold) {
          allClose = false;
          positions[i] += dx * 0.03;
          positions[i + 1] += dy * 0.03;
          positions[i + 2] += dz * 0.03;
        } else {
          positions[i] = targetX;
          positions[i + 1] = targetY;
          positions[i + 2] = targetZ;
        }
      }

      if (allClose && !textFormed) {
        textFormed = true;
        playExplosion();
        explosionDone = true;
      }

      particleGeometry.attributes.position.needsUpdate = true;
    }

    // Animasi utama
    function animate(time) {
      requestAnimationFrame(animate);

      // Update partikel
      if (formingText) {
        animateParticles();
      }

      // Interaksi mouse (jika sudah meledak)
      if (explosionDone && particleSystem.geometry.attributes.position) {
        const positions = particleSystem.geometry.attributes.position.array;
        const timeFactor = time * 0.0005;

        for (let i = 0; i < positions.length; i += 3) {
          // Gerakan halus + noise
          positions[i] += Math.sin(timeFactor + i) * 0.01;
          positions[i + 1] += Math.cos(timeFactor + i) * 0.01;

          // Tarik ke arah mouse
          const worldX = positions[i] + camera.position.x;
          const worldY = positions[i + 1] + camera.position.y;
          const dx = mouse.x * 20 - worldX;
          const dy = mouse.y * 20 - worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 15) {
            const force = (15 - dist) / 15;
            positions[i] += dx * force * 0.02;
            positions[i + 1] += dy * force * 0.02;
          }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
      }

      // Rotasi halus kamera
      camera.position.x += (mouse.x * 5 - camera.position.x) * 0.01;
      camera.position.y += (mouse.y * 5 - camera.position.y) * 0.01;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Mulai
    animate();
  </script>
</body>
</html>

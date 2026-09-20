/**
 * Ambient Three.js background — subtle ember particles + geometric lattice.
 * Honors prefers-reduced-motion; never blocks pointer events or readability.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("scene-canvas");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof THREE === "undefined") {
    canvas.style.display = "none";
    return;
  }

  let renderer, scene, camera, particles, lattice, animId;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function init() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.z = 14;

    // Ember / ember-orange particle field
    const count = Math.min(180, Math.floor((width * height) / 9000));
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      // Ember palette: deep orange → amber
      const t = Math.random();
      colors[i * 3] = 0.85 + t * 0.15;
      colors[i * 3 + 1] = 0.25 + t * 0.35;
      colors[i * 3 + 2] = 0.02 + t * 0.08;
      sizes[i] = 0.04 + Math.random() * 0.12;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Sparse geometric lattice (wireframe box grid)
    const latticeGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x3a4558,
      transparent: true,
      opacity: 0.22,
    });

    const spacing = 4;
    const extent = 2;
    for (let x = -extent; x <= extent; x++) {
      for (let y = -extent; y <= extent; y++) {
        const pts = [
          new THREE.Vector3(x * spacing, y * spacing, -extent * spacing),
          new THREE.Vector3(x * spacing, y * spacing, extent * spacing),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        latticeGroup.add(new THREE.Line(geo, lineMat));
      }
    }
    for (let z = -extent; z <= extent; z++) {
      for (let y = -extent; y <= extent; y++) {
        const pts = [
          new THREE.Vector3(-extent * spacing, y * spacing, z * spacing),
          new THREE.Vector3(extent * spacing, y * spacing, z * spacing),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        latticeGroup.add(new THREE.Line(geo, lineMat));
      }
    }

    lattice = latticeGroup;
    lattice.rotation.x = 0.35;
    lattice.rotation.y = 0.4;
    scene.add(lattice);

    window.addEventListener("resize", onResize, { passive: true });
    animate();
  }

  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
  }

  let t0 = performance.now();
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = (performance.now() - t0) * 0.00015;

    if (particles) {
      particles.rotation.y = t * 0.4;
      particles.rotation.x = Math.sin(t * 0.5) * 0.08;
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += Math.sin(t * 2 + i) * 0.0015;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    if (lattice) {
      lattice.rotation.y = 0.4 + t * 0.15;
      lattice.rotation.x = 0.35 + Math.sin(t * 0.7) * 0.05;
    }

    renderer.render(scene, camera);
  }

  // Pause when tab hidden
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    } else if (!animId && renderer) {
      t0 = performance.now();
      animate();
    }
  });

  try {
    init();
  } catch (err) {
    console.warn("Scene init failed:", err);
    canvas.style.display = "none";
  }
})();

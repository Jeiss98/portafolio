/* =========================================================
   1. APARICIÓN AL HACER SCROLL
   Los elementos de cada sección se deslizan al entrar en pantalla
   ========================================================= */

// ¿La persona pidió reducir animaciones en su sistema?
const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducirMovimiento) {
  // Elementos que queremos animar
  const elementos = document.querySelectorAll(
    ".seccion .etiqueta, .seccion h2, .seccion > p, .tarjeta, .proyecto, .etiquetas, .seccion .botones"
  );

  // El "observador" avisa cuando un elemento entra en la pantalla
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add("visible"); // lo muestra
        observador.unobserve(entrada.target);    // ya no hace falta vigilarlo
      }
    });
  }, { threshold: 0.15 }); // se activa cuando se ve el 15% del elemento

  elementos.forEach((el) => {
    el.classList.add("reveal"); // lo oculta al inicio
    observador.observe(el);     // empieza a vigilarlo
  });
}

/* =========================================================
   2. OBJETO 3D: moneda con tu logo (Three.js)
   ========================================================= */
(function () {
  const contenedor = document.getElementById("hero-3d");

  // Si no existe el contenedor o Three.js no cargó, no hacemos nada
  if (!contenedor || typeof THREE === "undefined") return;

  // ----- AJUSTES QUE PUEDES CAMBIAR -----
  const RUTA_LOGO = "img/Logo.png";   // exactamente como se llama tu archivo
  const COLOR_DISCO = 0x161616;       // color de la moneda (pon uno claro si tu logo es oscuro)
  const COLOR_BORDE = 0xc9a566;       // dorado del borde
  const TAMANO_LOGO = 2.3;            // tamaño del logo sobre la moneda

  // ----- ESCENA, CÁMARA Y RENDERIZADOR -----
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camara.position.z = 7;

  // alpha: true = fondo transparente, se ve el fondo de la página
  const renderizador = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // nitidez sin gastar de más
  renderizador.outputEncoding = THREE.sRGBEncoding;                  // colores correctos
  contenedor.appendChild(renderizador.domElement);

  // ----- LUCES -----
  escena.add(new THREE.AmbientLight(0xffffff, 0.6));   // luz suave general

  const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.1);
  luzPrincipal.position.set(3, 4, 5);
  escena.add(luzPrincipal);

  const luzDorada = new THREE.PointLight(COLOR_BORDE, 1.5, 20); // brillo cálido lateral
  luzDorada.position.set(-4, -2, 3);
  escena.add(luzDorada);

  // ----- LA MONEDA -----
  const moneda = new THREE.Group(); // grupo: se mueve todo junto

  // Disco: cilindro delgado (radio 1.6, grosor 0.3)
  const disco = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.3, 64),
    new THREE.MeshStandardMaterial({ color: COLOR_DISCO, metalness: 0.6, roughness: 0.35 })
  );
  disco.rotation.x = Math.PI / 2; // lo "pone de pie" mirando a la cámara
  moneda.add(disco);

  // Borde dorado: un anillo alrededor del disco
  const borde = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.07, 24, 96),
    new THREE.MeshStandardMaterial({ color: COLOR_BORDE, metalness: 0.9, roughness: 0.25 })
  );
  moneda.add(borde);

  // ----- EL LOGO como textura sobre dos planos (cara y reverso) -----
  const textura = new THREE.TextureLoader().load(RUTA_LOGO);
  textura.encoding = THREE.sRGBEncoding;
  textura.anisotropy = 8; // más nítido al verlo inclinado

  const materialLogo = new THREE.MeshBasicMaterial({
    map: textura,
    transparent: true // respeta el fondo transparente del PNG
  });

  const geometriaLogo = new THREE.PlaneGeometry(TAMANO_LOGO, TAMANO_LOGO);

  // Cara frontal (0.16 = mitad del grosor + un poquito para que no parpadee)
  const logoFrente = new THREE.Mesh(geometriaLogo, materialLogo);
  logoFrente.position.z = 0.16;
  moneda.add(logoFrente);

  // Reverso: girado 180° para que también se lea bien
  const logoReverso = new THREE.Mesh(geometriaLogo, materialLogo);
  logoReverso.position.z = -0.16;
  logoReverso.rotation.y = Math.PI;
  moneda.add(logoReverso);

  escena.add(moneda);

  // ----- INTERACCIÓN CON EL MOUSE -----
  const mouse = { x: 0, y: 0 }; // valores entre -1 y 1

  window.addEventListener("mousemove", (evento) => {
    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (evento.clientY / window.innerHeight) * 2 - 1;
  });

  // ----- TAMAÑO: se adapta al contenedor -----
  function ajustarTamano() {
    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    if (!ancho || !alto) return; // contenedor oculto (celular): no hacemos nada
    renderizador.setSize(ancho, alto);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  }
  ajustarTamano();
  window.addEventListener("resize", ajustarTamano);

  // ----- ANIMACIÓN (se repite ~60 veces por segundo) -----
  const reloj = new THREE.Clock();

  function animar() {
    requestAnimationFrame(animar);
    if (!contenedor.clientWidth) return; // oculto: no dibujamos

    const t = reloj.getElapsedTime();

    if (reducirMovimiento) {
      moneda.rotation.set(0, 0.3, 0); // posición fija, sin movimiento
    } else {
      // Objetivo: balanceo suave + seguir al mouse
      const objetivoY = Math.sin(t * 0.6) * 0.5 + mouse.x * 0.6;
      const objetivoX = mouse.y * 0.35;

      // El 0.06 hace el movimiento suave (se acerca poco a poco al objetivo)
      moneda.rotation.y += (objetivoY - moneda.rotation.y) * 0.06;
      moneda.rotation.x += (objetivoX - moneda.rotation.x) * 0.06;

      // Flotar arriba y abajo
      moneda.position.y = Math.sin(t * 1.2) * 0.12;
    }

    renderizador.render(escena, camara);
  }
  animar();
})();
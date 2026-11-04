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
   2. OBJETO 3D: moneda premium con tu logo (Three.js)
   Interacciones: arrastrar, hover, clic y seguimiento del mouse
   ========================================================= */
(function () {
  const contenedor = document.getElementById("hero-3d");

  // Si no existe el contenedor o Three.js no cargó, no hacemos nada
  if (!contenedor || typeof THREE === "undefined") return;

  // ----- AJUSTES QUE PUEDES CAMBIAR -----
  const RUTA_LOGO = "img/Logo.png";  // exactamente como se llama tu archivo
  const COLOR_DISCO = 0x161616;      // color de la moneda (si tu logo es oscuro, prueba 0xd9d4c7)
  const COLOR_ORO = 0xc9a566;        // dorado del borde
  const TAMANO_LOGO = 2.5;           // tamaño del logo sobre la moneda

  // ----- RENDERIZADOR -----
  // alpha: true = fondo transparente, se ve el fondo de la página
  const renderizador = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // nítido sin gastar de más
  renderizador.outputEncoding = THREE.sRGBEncoding;                  // colores correctos
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;           // contraste cinematográfico
  renderizador.toneMappingExposure = 1.15;                           // brillo general
  const lienzo = renderizador.domElement;                            // el <canvas> que se crea
  contenedor.appendChild(lienzo);

  // ----- ESCENA Y CÁMARA -----
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camara.position.z = 6.4;

  // ----- REFLEJOS: un "estudio fotográfico" invisible -----
  // El metal solo se ve premium si tiene algo que reflejar.
  // Construimos una escena aparte con paneles de luz y la convertimos en mapa de reflejos.
  const estudio = new THREE.Scene();
  estudio.background = new THREE.Color(0x0a0a0a);

  // Crea un panel luminoso (ancho, alto, posición) que mira al centro
  function panelDeLuz(color, intensidad, ancho, alto, x, y, z) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensidad), // intensidad > 1 = muy brillante
      side: THREE.DoubleSide
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), material);
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    estudio.add(panel);
  }

  panelDeLuz(0xffffff, 6, 10, 4, 0, 8, 2);     // panel grande arriba
  panelDeLuz(0xffe2b0, 4, 4, 10, -8, 0, 2);    // panel cálido a la izquierda
  panelDeLuz(0xdde8ff, 3, 4, 10, 8, 0, -2);    // panel frío a la derecha

  const generador = new THREE.PMREMGenerator(renderizador);
  escena.environment = generador.fromScene(estudio, 0.04).texture; // los materiales lo usan solos
  generador.dispose();

  // ----- LUCES -----
  escena.add(new THREE.AmbientLight(0xffffff, 0.25));

  const luzPrincipal = new THREE.DirectionalLight(0xffffff, 0.9);
  luzPrincipal.position.set(3, 4, 5);
  escena.add(luzPrincipal);

  // Luz dorada lateral: se intensifica al pasar el mouse
  const luzDorada = new THREE.PointLight(COLOR_ORO, 1.5, 20);
  luzDorada.position.set(-4, -2, 3);
  escena.add(luzDorada);

  // ----- LA MONEDA -----
  const moneda = new THREE.Group(); // un grupo: todo se mueve junto

  // Disco: metal oscuro con barniz brillante (clearcoat)
  const disco = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.3, 96),
    new THREE.MeshPhysicalMaterial({
      color: COLOR_DISCO,
      metalness: 0.85,
      roughness: 0.28,
      clearcoat: 1,            // capa de barniz
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.1
    })
  );
  disco.rotation.x = Math.PI / 2; // lo "pone de pie" mirando a la cámara
  moneda.add(disco);

  // Material dorado pulido (se reutiliza en los dos anillos)
  const materialOro = new THREE.MeshStandardMaterial({
    color: COLOR_ORO,
    metalness: 1,
    roughness: 0.18,
    envMapIntensity: 1.3
  });

  // Borde exterior dorado
  moneda.add(new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.09, 32, 128), materialOro));

  // Anillo interior fino, como un grabado
  moneda.add(new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.025, 16, 128), materialOro));

  // ----- EL LOGO sobre dos planos (cara y reverso) -----
  const textura = new THREE.TextureLoader().load(RUTA_LOGO);
  textura.encoding = THREE.sRGBEncoding;
  textura.anisotropy = renderizador.capabilities.getMaxAnisotropy(); // máxima nitidez al verlo inclinado

  const materialLogo = new THREE.MeshBasicMaterial({
    map: textura,
    transparent: true,   // respeta el fondo transparente del PNG
    toneMapped: false    // el logo conserva sus colores reales (no se "lava" con el tono)
  });

  const geometriaLogo = new THREE.PlaneGeometry(TAMANO_LOGO, TAMANO_LOGO);

  const logoFrente = new THREE.Mesh(geometriaLogo, materialLogo);
  logoFrente.position.z = 0.16;       // justo delante del disco
  moneda.add(logoFrente);

  const logoReverso = new THREE.Mesh(geometriaLogo, materialLogo);
  logoReverso.position.z = -0.16;
  logoReverso.rotation.y = Math.PI;   // girado 180° para que también se lea bien
  moneda.add(logoReverso);

  escena.add(moneda);

  // ----- ESTADO DE LA INTERACCIÓN -----
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mouse = { x: 0, y: 0 };  // posición del mouse en la ventana (-1 a 1)
  let giroY = 0;                 // giro horizontal acumulado (por arrastre)
  let giroX = 0;                 // inclinación vertical acumulada (por arrastre)
  let velY = 0;                  // velocidad de giro (da el efecto de inercia)
  let inclinacionX = 0;          // seguimiento suave del mouse
  let inclinacionY = 0;
  let escalaActual = 1;          // escala animada (crece en hover)
  let arrastrando = false;
  let sobreMoneda = false;
  let movido = 0;                // cuánto se movió el puntero durante el clic
  let ultimoX = 0;
  let ultimoY = 0;
  let enPantalla = true;         // false cuando la portada no se ve

  // ----- DETECTAR SI EL PUNTERO ESTÁ SOBRE LA MONEDA (rayo invisible) -----
  const rayo = new THREE.Raycaster();
  const puntero = new THREE.Vector2();

  function revisarHover(evento) {
    const caja = lienzo.getBoundingClientRect();
    // Convierte la posición del mouse a coordenadas de -1 a 1 dentro del lienzo
    puntero.x = ((evento.clientX - caja.left) / caja.width) * 2 - 1;
    puntero.y = -((evento.clientY - caja.top) / caja.height) * 2 + 1;
    rayo.setFromCamera(puntero, camara);
    sobreMoneda = rayo.intersectObject(moneda, true).length > 0; // ¿el rayo toca la moneda?
  }

  // ----- ARRASTRAR -----
  lienzo.addEventListener("pointerdown", (evento) => {
    arrastrando = true;
    movido = 0;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    lienzo.setPointerCapture(evento.pointerId); // sigue el arrastre aunque el puntero salga del lienzo
    contenedor.classList.add("agarrando");      // cambia el cursor a manito cerrada
  });

  lienzo.addEventListener("pointermove", (evento) => {
    if (!arrastrando) {
      revisarHover(evento);
      return;
    }
    const dx = evento.clientX - ultimoX;
    const dy = evento.clientY - ultimoY;
    movido += Math.abs(dx) + Math.abs(dy);
    giroY += dx * 0.012;
    giroX += dy * 0.012;
    giroX = Math.max(-0.9, Math.min(0.9, giroX)); // limita la inclinación vertical
    velY = dx * 0.012;                            // guarda la velocidad para la inercia
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
  });

  // Al soltar: si casi no se movió, fue un CLIC y damos un giro completo
  function soltar() {
    if (!arrastrando) return;
    arrastrando = false;
    contenedor.classList.remove("agarrando");
    if (movido < 4) velY = 0.4;
  }
  lienzo.addEventListener("pointerup", soltar);
  lienzo.addEventListener("pointercancel", soltar);
  lienzo.addEventListener("pointerleave", () => { sobreMoneda = false; });

  // Seguimiento del mouse por toda la ventana (inclinación suave)
  window.addEventListener("pointermove", (evento) => {
    mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (evento.clientY / window.innerHeight) * 2 - 1;
  });

  // ----- PAUSAR CUANDO NO SE VE (ahorra batería) -----
  new IntersectionObserver((entradas) => {
    enPantalla = entradas[0].isIntersecting;
  }).observe(contenedor);

  // ----- TAMAÑO: se adapta al contenedor -----
  function ajustarTamano() {
    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    if (!ancho || !alto) return; // contenedor oculto (celular)
    renderizador.setSize(ancho, alto, false); // false: el tamaño visual lo controla el CSS
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  }
  ajustarTamano();
  window.addEventListener("resize", ajustarTamano);

  // ----- ANIMACIÓN (se repite ~60 veces por segundo) -----
  const reloj = new THREE.Clock();

  function animar() {
    requestAnimationFrame(animar);
    if (!enPantalla || !contenedor.clientWidth) return; // no dibujamos si no se ve

    const t = reloj.getElapsedTime();

    // Inercia: sigue girando un rato después de soltar y se va frenando
    if (!arrastrando) {
      if (!reducirMovimiento) giroY += velY;
      velY *= 0.94;

      // Cuando casi se detuvo, regresa suavemente a mostrar una cara del logo
      if (Math.abs(velY) < 0.01) {
        const meta = Math.round(giroY / Math.PI) * Math.PI; // la cara más cercana
        giroY += (meta - giroY) * 0.04;
        giroX += (0 - giroX) * 0.04;
      }
    }

    // Inclinación hacia el mouse (se desactiva al arrastrar)
    const quieto = arrastrando || reducirMovimiento;
    inclinacionY += ((quieto ? 0 : mouse.x * 0.4) - inclinacionY) * 0.06;
    inclinacionX += ((quieto ? 0 : mouse.y * 0.3) - inclinacionX) * 0.06;

    // Balanceo suave y flotación
    const balanceo = reducirMovimiento ? 0 : Math.sin(t * 0.6) * 0.3;
    moneda.rotation.y = giroY + balanceo + inclinacionY;
    moneda.rotation.x = giroX + inclinacionX;
    moneda.position.y = reducirMovimiento ? 0 : Math.sin(t * 1.2) * 0.1;

    // Hover: la moneda crece un poco y la luz dorada se intensifica
    const hover = sobreMoneda && !arrastrando;
    escalaActual += ((hover ? 1.07 : 1) - escalaActual) * 0.1;
    moneda.scale.setScalar(escalaActual);
    luzDorada.intensity += ((hover ? 3.2 : 1.5) - luzDorada.intensity) * 0.1;

    renderizador.render(escena, camara);
  }
  animar();
})();
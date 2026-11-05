/* =====================================================================
   AVATAR INTERACTIVO (js/avatar.js)
   Se carga DESPUÉS de main.js, al final del <body>.
   ===================================================================== */
(function () {
  const svg = document.getElementById("avatar");
  if (!svg) return;

  // ----- AJUSTES -----
  const RUTA_LOGO = "img/Logo.png";   // exactamente como se llama tu archivo

  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- PIEZAS DEL PERSONAJE -----
  const cabeza  = svg.querySelector("#cabeza");
  const pupilas = svg.querySelectorAll(".pupila");
  const ojos    = svg.querySelectorAll(".ojo");
  const personaje = svg.querySelector("#personaje");

  /* ---------------------------------------------------------
     1. LOGO EN LA CAMISA
     Prueba cargar tu logo. Si existe, reemplaza la marca provisional "JP".
     --------------------------------------------------------- */
  const imagenLogo = svg.querySelector("#logoCamisaImg");
  const marcaLogo  = svg.querySelector("#logoCamisaMarca");
  const prueba = new Image();
  prueba.onload = () => {
    imagenLogo.setAttribute("href", RUTA_LOGO);   // pone tu logo
    imagenLogo.removeAttribute("display");        // lo muestra
    marcaLogo.setAttribute("display", "none");    // oculta la marca provisional
  };
  prueba.src = RUTA_LOGO; // si el archivo no existe, no pasa nada: queda la marca "JP"

  /* ---------------------------------------------------------
     2. MIRADA Y CABEZA SIGUEN AL PUNTERO
     --------------------------------------------------------- */
  // Punto que el avatar mira, en coordenadas de pantalla
  const objetivo = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  window.addEventListener("pointermove", (e) => {
    objetivo.x = e.clientX;
    objetivo.y = e.clientY;
  });

  // Al pasar sobre una tarjeta, mira al centro de esa tarjeta
  svg.querySelectorAll(".av-tarjeta").forEach((tarjeta) => {
    tarjeta.addEventListener("pointerenter", () => {
      const caja = tarjeta.getBoundingClientRect();
      objetivo.x = caja.left + caja.width / 2;
      objetivo.y = caja.top + caja.height / 2;
    });
  });

  // Valores suavizados de -1 a 1 (así el movimiento no es brusco)
  let sx = 0;
  let sy = 0;

  function limitar(valor, min, max) {
    return Math.max(min, Math.min(max, valor));
  }

  // Pausa cuando el avatar no se ve en pantalla (ahorra batería)
  let visible = true;
  new IntersectionObserver((entradas) => {
    visible = entradas[0].isIntersecting;
  }).observe(svg);

  function animar() {
    requestAnimationFrame(animar);
    if (!visible) return;

    // Centro de la cabeza en pantalla (en el dibujo está en x=400, y=450)
    const caja = svg.getBoundingClientRect();
    const escala = caja.width / 800;
    const cx = caja.left + 400 * escala;
    const cy = caja.top + 450 * escala;

    // Distancia al objetivo, normalizada de -1 a 1
    const dx = limitar((objetivo.x - cx) / (caja.width * 0.6), -1, 1);
    const dy = limitar((objetivo.y - cy) / (caja.height * 0.6), -1, 1);

    // Se acerca poco a poco al objetivo (0.08 = suavidad)
    sx += (dx - sx) * 0.08;
    sy += (dy - sy) * 0.08;

    // Cabeza: se inclina y se desplaza un poco hacia el objetivo
    cabeza.style.transform =
      `rotate(${sx * 5}deg) translate(${sx * 6}px, ${sy * 4}px)`;

    // Pupilas: se mueven dentro del ojo (hasta 4 px a los lados, 3 px arriba/abajo)
    pupilas.forEach((p) => {
      p.style.transform = `translate(${sx * 4}px, ${sy * 3}px)`;
    });
  }

  // Si la persona pidió menos movimiento, el avatar no sigue el puntero
  if (!reducirMovimiento) animar();

  /* ---------------------------------------------------------
     3. PARPADEO ALEATORIO (cada 2.5 a 6 segundos)
     --------------------------------------------------------- */
  function parpadear() {
    ojos.forEach((o) => o.classList.add("cerrado"));
    setTimeout(() => ojos.forEach((o) => o.classList.remove("cerrado")), 140);
    setTimeout(parpadear, 2500 + Math.random() * 3500);
  }
  if (!reducirMovimiento) setTimeout(parpadear, 2000);

  /* ---------------------------------------------------------
     4. CLIC EN EL PERSONAJE: sonrisa grande, rebote y destellos
     --------------------------------------------------------- */
  let temporizador;
  personaje.addEventListener("click", () => {
    svg.classList.add("feliz");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => svg.classList.remove("feliz"), 1400);
  });
})();

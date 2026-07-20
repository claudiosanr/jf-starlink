(function () {
  "use strict";

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("copy", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) { e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });

  var WHATSAPP_NUMBER = "5595981056184"; // (95) 98105-6184, com DDI 55

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header encolhe em pill flutuante depois de rolar um pouco
  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var onHeaderScroll = function () {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 50);
    };
    onHeaderScroll();
    window.addEventListener("scroll", onHeaderScroll, { passive: true });
  }

  // Monta os links de WhatsApp a partir do número + mensagem, evitando encoding manual no HTML
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    var msg = el.getAttribute("data-wa-msg") || "";
    el.setAttribute(
      "href",
      "https://wa.me/" + WHATSAPP_NUMBER + (msg ? "?text=" + encodeURIComponent(msg) : "")
    );
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  // Menu mobile: abre/fecha, trava o scroll do body e fecha com ESC
  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (menuToggle && mobileNav) {
    function closeMenu() {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    function openMenu() {
      menuToggle.setAttribute("aria-expanded", "true");
      mobileNav.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(); else openMenu();
    });
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Scroll reveal simples nas seções de conteúdo
  var revealTargets = document.querySelectorAll(
    ".section .section-title, .section .section-lead, .card-row, .model-grid, .model-note, .step-list, .cta-title, .btn-large, .insta-link"
  );
  revealTargets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

  if (!reduceMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Controle central de pausa: as três animações de canvas da hero só
  // rodam com a hero visível e a aba em primeiro plano. Evita gastar
  // CPU/bateria depois que o usuário rolou pra frente (era a principal
  // causa da página ficar pesada, já que os três loops continuavam
  // rodando pra sempre, mesmo com a hero fora da tela).
  var heroSection = document.querySelector(".hero");
  var heroVisible = true;
  var animHandlers = [];
  function registerAnim(handlers) { animHandlers.push(handlers); }
  var animsRunning = true;
  function syncAnimState() {
    var shouldRun = heroVisible && !document.hidden;
    if (shouldRun === animsRunning) return;
    animsRunning = shouldRun;
    animHandlers.forEach(function (h) { shouldRun ? h.resume() : h.pause(); });
  }
  document.addEventListener("visibilitychange", syncAnimState);
  if (heroSection && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        heroVisible = entries[0].isIntersecting;
        syncAnimState();
      },
      { threshold: 0 }
    ).observe(heroSection);
  }

  // Campo de estrelas discreto no hero (pausa se o usuário preferir menos movimento)
  var canvas = document.querySelector(".starfield");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var starfieldRafId = null;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      var count = Math.round((rect.width * rect.height) / 14000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.7,
          r: Math.random() * 1.3 * dpr + 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.6
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(function (s) {
        var twinkle = reduceMotion ? 0.75 : 0.55 + 0.45 * Math.sin(t * 0.0006 * s.speed + s.phase);
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = "#e9eaf3";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      starfieldRafId = requestAnimationFrame(draw);
    }

    function startStarfield() {
      if (starfieldRafId != null || reduceMotion) return;
      starfieldRafId = requestAnimationFrame(draw);
    }
    function stopStarfield() {
      if (starfieldRafId == null) return;
      cancelAnimationFrame(starfieldRafId);
      starfieldRafId = null;
    }

    resize();
    window.addEventListener("resize", resize);
    startStarfield();
    registerAnim({ pause: stopStarfield, resume: startStarfield });
  }

  // Feixes de luz animados no fundo da hero
  var beamCanvas = document.querySelector(".beam-field");
  if (beamCanvas) {
    var bctx = beamCanvas.getContext("2d");
    var beams = [];
    var bdpr = Math.min(window.devicePixelRatio || 1, 2);
    var LAYERS = 3;
    var BEAMS_PER_LAYER = 3;
    var beamRafId = null;

    function makeBeam(w, h, layer) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        width: (14 + layer * 6) * bdpr,
        length: h * 2.2,
        angle: -35 + Math.random() * 12,
        speed: (0.15 + layer * 0.12 + Math.random() * 0.15) * bdpr,
        opacity: 0.05 + layer * 0.035 + Math.random() * 0.05,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.012,
        layer: layer
      };
    }

    function beamResize() {
      var rect = beamCanvas.parentElement.getBoundingClientRect();
      beamCanvas.width = rect.width * bdpr;
      beamCanvas.height = rect.height * bdpr;
      beamCanvas.style.width = rect.width + "px";
      beamCanvas.style.height = rect.height + "px";
      beams = [];
      for (var layer = 1; layer <= LAYERS; layer++) {
        for (var i = 0; i < BEAMS_PER_LAYER; i++) {
          beams.push(makeBeam(beamCanvas.width, beamCanvas.height, layer));
        }
      }
    }

    // Sem ctx.filter aqui de propósito: um blur de Canvas2D recalculado a
    // cada frame pra cada feixe era o maior custo de CPU/GPU da página
    // (12 feixes × blur gaussiano em retângulos grandes, todo frame). O
    // gradiente já entra e sai em 0 de opacidade, o que dá suavidade
    // visual parecida sem repetir esse trabalho a cada frame.
    function drawBeam(b) {
      bctx.save();
      bctx.translate(b.x, b.y);
      bctx.rotate((b.angle * Math.PI) / 180);
      var pulseOpacity = Math.min(1, b.opacity * (0.8 + Math.sin(b.pulse) * 0.4));
      var grad = bctx.createLinearGradient(0, 0, 0, b.length);
      grad.addColorStop(0, "rgba(79,166,255,0)");
      grad.addColorStop(0.15, "rgba(79,166,255," + pulseOpacity * 0.35 + ")");
      grad.addColorStop(0.5, "rgba(79,166,255," + pulseOpacity + ")");
      grad.addColorStop(0.85, "rgba(79,166,255," + pulseOpacity * 0.35 + ")");
      grad.addColorStop(1, "rgba(79,166,255,0)");
      bctx.fillStyle = grad;
      bctx.fillRect(-b.width / 2, 0, b.width, b.length);
      bctx.restore();
    }

    function beamDraw() {
      bctx.clearRect(0, 0, beamCanvas.width, beamCanvas.height);
      beams.forEach(function (b) {
        b.y -= b.speed * (b.layer / LAYERS + 0.5);
        b.pulse += b.pulseSpeed;
        if (b.y + b.length < -50) {
          b.y = beamCanvas.height + 50;
          b.x = Math.random() * beamCanvas.width;
        }
        drawBeam(b);
      });
      beamRafId = requestAnimationFrame(beamDraw);
    }

    function startBeams() {
      if (beamRafId != null || reduceMotion) return;
      beamRafId = requestAnimationFrame(beamDraw);
    }
    function stopBeams() {
      if (beamRafId == null) return;
      cancelAnimationFrame(beamRafId);
      beamRafId = null;
    }

    beamResize();
    window.addEventListener("resize", beamResize);
    if (reduceMotion) {
      beams.forEach(drawBeam);
    } else {
      startBeams();
      registerAnim({ pause: stopBeams, resume: startBeams });
    }
  }

  // Textura de grão sutil sobre a hero (recalcula um tile pequeno em vez de
  // repintar a tela inteira a cada frame, bem mais barato)
  var grainCanvas = document.querySelector(".grain");
  if (grainCanvas && !reduceMotion) {
    var gctx = grainCanvas.getContext("2d");
    var TILE = 120;
    var tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    var tctx = tile.getContext("2d");
    var grainIntervalId = null;

    function grainResize() {
      var rect = grainCanvas.parentElement.getBoundingClientRect();
      grainCanvas.width = rect.width;
      grainCanvas.height = rect.height;
      grainCanvas.style.width = rect.width + "px";
      grainCanvas.style.height = rect.height + "px";
    }

    function paintGrain() {
      var imgData = tctx.createImageData(TILE, TILE);
      for (var i = 0; i < imgData.data.length; i += 4) {
        var v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      tctx.putImageData(imgData, 0, 0);
      gctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
      gctx.fillStyle = gctx.createPattern(tile, "repeat");
      gctx.fillRect(0, 0, grainCanvas.width, grainCanvas.height);
    }

    function startGrain() {
      if (grainIntervalId != null) return;
      paintGrain();
      grainIntervalId = setInterval(paintGrain, 220);
    }
    function stopGrain() {
      if (grainIntervalId == null) return;
      clearInterval(grainIntervalId);
      grainIntervalId = null;
    }

    grainResize();
    window.addEventListener("resize", grainResize);
    startGrain();
    registerAnim({ pause: stopGrain, resume: startGrain });
  }

  // Palavra girando no título da hero: revenda / lojistas / revendedores / distribuidores
  var cycleWords = document.querySelectorAll(".cycle-word");
  if (cycleWords.length > 1 && !reduceMotion) {
    var cycleIndex = 0;
    setInterval(function () {
      cycleWords[cycleIndex].classList.remove("is-active");
      cycleIndex = (cycleIndex + 1) % cycleWords.length;
      cycleWords[cycleIndex].classList.add("is-active");
    }, 2600);
  }
})();

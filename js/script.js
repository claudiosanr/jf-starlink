(function () {
  "use strict";

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("copy", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) { e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });

  var WHATSAPP_NUMBER = "5595981056184"; // (95) 98105-6184, com DDI 55

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // Campo de estrelas discreto no hero (pausa se o usuário preferir menos movimento)
  var canvas = document.querySelector(".starfield");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      var count = Math.round((rect.width * rect.height) / 9000);
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
      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  }
})();

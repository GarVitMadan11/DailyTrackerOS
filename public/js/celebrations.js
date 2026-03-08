// ============================================
// pyTron — Celebrations & Visual Effects
// Canvas confetti, scroll reveal, ripple effects,
// and view illustration injection
// ============================================

class CelebrationManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animating = false;
    this.illustrationsApplied = {};
  }

  init() {
    // Create confetti canvas
    this.canvas = document.createElement("canvas");
    this.canvas.id = "confetti-canvas";
    this.canvas.style.cssText = `
      position: fixed; inset: 0; z-index: 99998;
      pointer-events: none; width: 100%; height: 100%;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Init scroll reveal
    this.initScrollReveal();

    // Init button ripples
    this.initRippleEffect();

    // Init checkbox celebrations
    this.initCheckboxCelebrations();

    // Init greeting icon
    this.initGreetingIcon();

    // Add illustration to initial dashboard view
    this.enhanceView("dashboard");
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  // ============================================
  // View Illustration System
  // Adds decorative illustrations to each view
  // ============================================
  enhanceView(viewName) {
    const config = {
      dashboard: null, // Dashboard uses greeting icon only
      tasks: null, // Tasks has empty-state illustration already wired in app.js
      daily: null, // View has hero card integrated in HTML
      analytics: null, // Analytics has empty-state illustration wired in analytics.js
      "ai-coach": {
        selector: "#view-dashboard", // AI Coach doesn't have its own view yet
        src: "/illustrations/ai-coach.png",
      },
      achievements: null, // View has hero card integrated in HTML
      settings: null, // View has hero card integrated in HTML
    };

    const viewConfig = config[viewName];
    if (!viewConfig || this.illustrationsApplied[viewName]) return;

    const container = document.querySelector(viewConfig.selector);
    if (!container) return;

    if (viewConfig.position === "header-right") {
      // Find the first heading area in the view and inject illustration
      const header = container.querySelector('.flex, h2, [class*="header"]');
      if (!header) return;

      const headerParent = header.parentElement || header;
      if (headerParent.querySelector(".view-illustration")) return;

      headerParent.style.position = "relative";
      headerParent.style.overflow = "hidden";

      const img = document.createElement("img");
      img.src = viewConfig.src;
      img.alt = "";
      img.className = "view-illustration";
      headerParent.appendChild(img);

      this.illustrationsApplied[viewName] = true;
    }
  }

  // --- Confetti System ---
  confetti(x, y, count = 50) {
    const colors = [
      "#D97741",
      "#C8652F",
      "#B8860B",
      "#6B8E23",
      "#DAA520",
      "#F4A460",
      "#E8B87A",
      "#90C67C",
    ];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x || this.canvas.width / 2,
        y: y || this.canvas.height / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 1) * 12 - 4,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rv: (Math.random() - 0.5) * 10,
        gravity: 0.3,
        friction: 0.99,
        opacity: 1,
        decay: Math.random() * 0.01 + 0.005,
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.animateConfetti();
    }
  }

  animateConfetti() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter((p) => {
      p.vx *= p.friction;
      p.vy += p.gravity;
      p.vy *= p.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rv;
      p.opacity -= p.decay;

      if (p.opacity <= 0) return false;

      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();

      return true;
    });

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Full screen celebration
  celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.confetti(this.canvas.width * 0.3, 0, 40);
    setTimeout(() => this.confetti(this.canvas.width * 0.7, 0, 40), 150);
    setTimeout(() => this.confetti(this.canvas.width * 0.5, 0, 30), 300);
  }

  // Small burst at a point
  burst(element) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    this.confetti(x, y, 15);
  }

  // --- Scroll Reveal ---
  initScrollReveal() {
    const mainContent = document.querySelector(".main-content");
    if (!mainContent) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      {
        root: mainContent,
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    const revealElements = document.querySelectorAll(
      ".chart-card, .pomodoro-widget, .settings-card",
    );
    revealElements.forEach((el) => {
      el.classList.add("reveal-on-scroll");
      observer.observe(el);
    });
  }

  // --- Ripple Effect ---
  initRippleEffect() {
    document.addEventListener("click", (e) => {
      const target = e.target.closest(".btn-primary, .btn-outline, .nav-item");
      if (!target) return;

      const ripple = document.createElement("span");
      ripple.classList.add("ripple-effect");

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      target.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  }

  // --- Checkbox Celebration Particles ---
  initCheckboxCelebrations() {
    document.addEventListener("change", (e) => {
      if (!e.target.classList.contains("task-checkbox")) return;
      if (!e.target.checked) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      this.burst(e.target);
    });
  }

  // --- Greeting Icon ---
  initGreetingIcon() {
    const welcomeMsg = document.getElementById("welcome-message");
    if (!welcomeMsg) return;

    const hour = new Date().getHours();
    let emoji;

    if (hour < 12) {
      emoji = "☀️";
    } else if (hour < 17) {
      emoji = "🌤️";
    } else {
      emoji = "🌙";
    }

    const firstText = welcomeMsg.childNodes[0];
    if (firstText && firstText.nodeType === 3) {
      firstText.textContent = emoji + " " + firstText.textContent.trimStart();
    }
  }
}

// --- Splash Screen ---
function hideSplashScreen() {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    setTimeout(() => {
      splash.classList.add("hidden");
      setTimeout(() => splash.remove(), 500);
    }, 800);
  }
}

// Initialize on DOM ready
const celebrationManager = new CelebrationManager();

document.addEventListener("DOMContentLoaded", () => {
  celebrationManager.init();
  hideSplashScreen();
});

// Expose globally for badge system & view switching
window.celebrationManager = celebrationManager;

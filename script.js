/**
 * 广汇龙电镀设备官网 - 交互脚本
 * Full Precision Animation Suite:
 * 1. Particle System (electroplating ion flow)
 * 2. Scroll-triggered reveal (IntersectionObserver)
 * 3. Counter animation (number counting)
 * 4. Header scroll effect + active nav tracking
 * 5. Smooth scroll navigation
 * 6. Parallax glow on mouse move (Hero)
 * 7. Contact form submission handling
 */

(function () {
  'use strict';

  // 标记 JS 已就绪，触发 CSS 动画模式（解决国内网络下文字不可见问题）
  document.documentElement.classList.add('js-ready');

  /* ============================================
     1. PARTICLE SYSTEM — 模拟电镀液离子流动
     ============================================ */
  const ParticleSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    mouseX: 0,
    mouseY: 0,
    rafId: null,

    init() {
      this.canvas = document.getElementById('particle-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.createParticles();
      this.bindEvents();
      this.animate();
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    createParticles(count = 90) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - .5) * .35,
          vy: (Math.random() - .5) * .35,
          radius: Math.max(.6, Math.random() * 1.8),
          alpha: Math.random() * .45 + .08,
          color: Math.random() > .65 ? '#2EA7FF' : Math.random() > .5 ? '#13DDC4' : '#9381FF',
        });
      }
    },

    bindEvents() {
      window.addEventListener('resize', () => { this.resize(); });
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });
    },

    animate() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Draw connections between nearby particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = dx * dx + dy * dy;

          if (dist < 14000) {
            const alpha = (.12 - (Math.sqrt(dist) / 120)) * p.alpha * 1.8;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(46,167,255,${alpha})`;
            ctx.lineWidth = .5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Mouse interaction: gentle attraction
        const mdx = this.mouseX - p.x;
        const mdy = this.mouseY - p.y;
        const mDist = mdx * mdx + mdy * mdy;
        if (mDist < 60000 && mDist > 1000) {
          p.vx += mdx * .00004;
          p.vy += mdy * .00004;
        }
      }

      // Update & draw particles
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Dampen velocity slightly
        p.vx *= .997;
        p.vy *= .997;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      this.rafId = requestAnimationFrame(() => this.animate());
    },
  };

  /* ============================================
     2. SCROLL-TRIGGERED REVEAL
     ============================================ */
  const ScrollReveal = {
    observer: null,

    init() {
      const options = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.08,
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, parseInt(delay));
            this.observer.unobserve(entry.target);
          }
        });
      }, options);

      // Observe all reveal elements (including timeline items)
      document.querySelectorAll('.reveal-up, .card-reveal, .timeline-item').forEach(el => {
        this.observer.observe(el);
      });

      // Observe stats for counter animation
      document.querySelectorAll('.stat-reveal').forEach(el => {
        this.observer.observe(el);
      });
    },
  };

  /* ============================================
     3. COUNTER ANIMATION
     ============================================ */
  const CounterAnimation = {
    init() {
      const statItems = document.querySelectorAll('.stat-item');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = 'true';
            this.animateCounter(entry.target);
          }
        });
      }, { threshold: .3 });

      statItems.forEach(item => observer.observe(item));
    },

    animateCounter(el) {
      const numEl = el.querySelector('.stat-number');
      const targetStr = numEl.dataset.value || '0';
      const targetNum = parseInt(targetStr);
      const suffixEl = el.querySelector('.stat-suffix');
      const duration = 2000;
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic for natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * targetNum);

        numEl.textContent = current.toLocaleString();

        if (progress < 1) requestAnimationFrame(tick);
        else {
          numEl.textContent = targetStr;
          // Pulse animation on completion
          numEl.style.transition = 'transform .25s ease';
          numEl.style.transform = 'scale(1.06)';
          setTimeout(() => { numEl.style.transform = 'scale(1)'; }, 250);
        }
      };

      requestAnimationFrame(tick);
    },
  };

  /* ============================================
     4. HEADER SCROLL EFFECT
     ============================================ */
  const HeaderScroll = {
    lastScroll: 0,
    ticking: false,

    init() {
      const header = document.getElementById('header');
      if (!header) return;

      window.addEventListener('scroll', () => {
        this.lastScroll = window.scrollY;
        if (!this.ticking) {
          requestAnimationFrame(() => {
            if (this.lastScroll > 60) {
              header.classList.add('scrolled');
            } else {
              header.classList.remove('scrolled');
            }
            this.ticking = false;
          });
          this.ticking = true;
        }
      }, { passive: true });
    },

    // Update active nav link based on section in view
    setActiveLink() {
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.nav-link');

      let current = '';
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 200) current = section.id;
      });

      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    },
  };

  /* ============================================
     5. SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  }

  /* ============================================
     6. PARALLAX GLOW ON MOUSE MOVE (Hero)
     ============================================ */
  const HeroParallax = {
    init() {
      const hero = document.querySelector('.hero-section');
      if (!hero) return;

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - .5;
        const cy = (e.clientY - rect.top) / rect.height - .5;

        const glows = hero.querySelectorAll('.hero-glow');
        glows.forEach((glow, i) => {
          const factor = (i === 0 ? 28 : 22);
          glow.style.transform = `translate(${cx * factor}px, ${cy * factor}px)`;
        });
      });

      hero.addEventListener('mouseleave', () => {
        hero.querySelectorAll('.hero-glow').forEach(glow => {
          glow.style.transform = 'translate(0,0)';
        });
      });
    },
  };

  /* ============================================
     7. CONTACT FORM HANDLING
     ============================================ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('formName').value.trim();
      const phone = document.getElementById('formPhone').value.trim();
      const company = document.getElementById('formCompany').value.trim();
      const message = document.getElementById('formMessage').value.trim();

      if (!name || !phone) {
        showFormMessage(form, '请填写姓名和联系电话', 'error');
        return;
      }

      // Construct mailto link as a simple submission method
      const subject = encodeURIComponent(`【网站咨询】${name} - 广汇龙电镀设备询价`);
      const body = encodeURIComponent(
        `姓名：${name}\n` +
        `电话：${phone}\n` +
        `公司：${company || '未填写'}\n` +
        `需求：${message || '未填写'}\n` +
        `\n（来自广汇龙官网在线咨询表单）`
      );

      // Open email client
      window.location.href = `mailto:705358887@qq.com?subject=${subject}&body=${body}`;

      // Show success message
      showFormMessage(form, '感谢您的咨询！正在为您打开邮件客户端...', 'success');
      form.reset();
    });
  }

  function showFormMessage(form, msg, type) {
    // Remove existing message
    const existing = form.querySelector('.form-message');
    if (existing) existing.remove();

    const msgEl = document.createElement('div');
    msgEl.className = `form-message form-message--${type}`;
    msgEl.textContent = msg;
    msgEl.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
      ${type === 'success'
        ? 'background: rgba(7,217,195,.1); color: #13DDC4; border: 1px solid rgba(7,217,195,.25);'
        : 'background: rgba(255,100,100,.1); color: #ff6464; border: 1px solid rgba(255,100,100,.25);'
      }
    `;
    form.appendChild(msgEl);

    setTimeout(() => {
      msgEl.remove();
    }, 5000);
  }

  /* ============================================
     INITIALIZE ALL MODULES
     ============================================ */
  function initAll() {
    ParticleSystem.init();
    ScrollReveal.init();
    CounterAnimation.init();
    HeaderScroll.init();
    initSmoothScroll();
    HeroParallax.init();
    initContactForm();

    // Active nav tracking on scroll
    window.addEventListener('scroll', () => HeaderScroll.setActiveLink(), { passive: true });
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();

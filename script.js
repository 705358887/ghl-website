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
     - POST to /api/contact (Cloudflare Pages Function)
     - Server generates Word doc and emails to 705358887@qq.com
     - Falls back to mailto if API is unavailable
     ============================================ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const name = document.getElementById('formName').value.trim();
      const phone = document.getElementById('formPhone').value.trim();
      const company = document.getElementById('formCompany').value.trim();
      const message = document.getElementById('formMessage').value.trim();

      if (!name || !phone) {
        showFormMessage(form, '请填写姓名和联系电话', 'error');
        return;
      }

      // Show loading state on submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '\u6b63\u5728\u53d1\u9001...';

      try {
        // POST form data to Cloudflare Pages Function
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, company, message }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showFormMessage(form, result.message || '\u611f\u8c22\u60a8\u7684\u54a8\u8be2\uff01\u4fe1\u606f\u5df2\u53d1\u9001\uff0c\u6211\u4eec\u5c06\u572824\u5c0f\u65f6\u5185\u4e0e\u60a8\u8054\u7cfb\u3002', 'success');
          form.reset();
        } else {
          throw new Error(result.message || '\u53d1\u9001\u5931\u8d25');
        }
      } catch (error) {
        // Fallback: if API is unavailable, use mailto to open email client
        const subject = encodeURIComponent('\u3010\u7f51\u7ad9\u54a8\u8be2\u3011' + name + ' - \u5e7f\u6c47\u9f99\u7535\u9540\u8bbe\u5907\u8be2\u4ef7');
        const body = encodeURIComponent(
          '\u59d3\u540d\uff1a' + name + '\n' +
          '\u7535\u8bdd\uff1a' + phone + '\n' +
          '\u516c\u53f8\uff1a' + (company || '\u672a\u586b\u5199') + '\n' +
          '\u9700\u6c42\uff1a' + (message || '\u672a\u586b\u5199') + '\n' +
          '\n\uff08\u6765\u81ea\u5e7f\u6c47\u9f99\u5b98\u7f51\u5728\u7ebf\u54a8\u8be2\u8868\u5355\uff09'
        );
        showFormMessage(form, '\u5728\u7ebf\u53d1\u9001\u5931\u8d25\uff0c\u6b63\u5728\u4e3a\u60a8\u6253\u5f00\u90ae\u4ef6\u5ba2\u6237\u7aef... \uff08\u6216\u76f4\u63a5\u81f4\u7535\uff1a189 2943 5843\uff09', 'error');
        window.location.href = 'mailto:705358887@qq.com?subject=' + subject + '&body=' + body;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
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

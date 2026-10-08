(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('[data-reveal]');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const parallaxLayers = document.querySelectorAll('[data-parallax]');
  const hero = document.querySelector('.hero');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduceMotion && finePointer && hero) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      hero.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
      hero.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.removeProperty('--pointer-x');
      hero.style.removeProperty('--pointer-y');
    });
  }

  const updateParallax = () => {
    const viewportHeight = window.innerHeight || 1;
    parallaxLayers.forEach((layer) => {
      const bounds = layer.getBoundingClientRect();
      const speed = Number(layer.dataset.parallax);
      if (Number.isFinite(speed)) {
        const offset = (bounds.top + bounds.height / 2 - viewportHeight / 2) * speed;
        layer.style.setProperty('--scroll-offset', `${offset.toFixed(1)}px`);
      }
    });
  };

  let scrollPending = false;
  const requestParallaxUpdate = () => {
    if (!scrollPending) {
      scrollPending = true;
      window.requestAnimationFrame(() => {
        updateParallax();
        scrollPending = false;
      });
    }
  };

  const updateScrollProgress = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    document.documentElement.style.setProperty('--scroll-progress', `${Math.min(1, Math.max(0, progress))}`);
  };

  let scrollProgressPending = false;
  const requestScrollProgressUpdate = () => {
    if (!scrollProgressPending) {
      scrollProgressPending = true;
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        scrollProgressPending = false;
      });
    }
  };

  updateScrollProgress();
  window.addEventListener('scroll', requestScrollProgressUpdate, { passive: true });
  window.addEventListener('resize', requestScrollProgressUpdate, { passive: true });

  if (parallaxLayers.length && !reduceMotion) {
    updateParallax();
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate, { passive: true });
  }

  const tiltCards = document.querySelectorAll('.tilt-card');
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        const rotateY = (x - 0.5) * 12;
        const rotateX = (0.5 - y) * 12;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  const canvas = document.querySelector('[data-particles]');
  const context = canvas && canvas.getContext('2d');
  if (!canvas || !context) {
    return;
  }

  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let isInView = true;
  let particles = [];
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const particleCount = Math.min(58, Math.max(24, Math.round((width * height) / 18000)));
    particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: 0.08 + Math.random() * 0.92,
      radius: 0.7 + Math.random() * 2,
      alpha: 0.18 + Math.random() * 0.42,
      vx: (Math.random() - 0.5) * 0.0015,
      vy: -0.0005 - Math.random() * 0.001
    }));
    drawParticles(false);
  };

  const drawParticles = (animate) => {
    context.clearRect(0, 0, width, height);
    const projected = particles.map((particle) => {
      if (animate) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += 0.0012;
        if (particle.x < -1.2) particle.x = 1.2;
        if (particle.x > 1.2) particle.x = -1.2;
        if (particle.y < -1.2) particle.y = 1.2;
        if (particle.z > 1) {
          particle.z = 0.08;
          particle.x = (Math.random() - 0.5) * 2;
          particle.y = 1.1;
        }
      }

      const depthScale = 0.24 + particle.z * 0.92;
      return {
        x: width / 2 + particle.x * width * depthScale / 2,
        y: height / 2 + particle.y * height * depthScale / 2,
        radius: particle.radius * depthScale,
        alpha: particle.alpha * (0.28 + particle.z * 0.72),
        z: particle.z
      };
    });

    projected.forEach((particle, index) => {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(32, 125, 75, ${particle.alpha})`;
      context.fill();

      for (let nextIndex = index + 1; nextIndex < projected.length; nextIndex += 1) {
        const other = projected[nextIndex];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 95 && Math.abs(particle.z - other.z) < 0.3) {
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(32, 125, 75, ${(1 - distance / 95) * 0.12 * particle.alpha})`;
          context.lineWidth = 0.7;
          context.stroke();
        }
      }
    });

    if (animate && isInView && !document.hidden) {
      animationFrame = window.requestAnimationFrame(() => drawParticles(true));
    }
  };

  const startParticles = () => {
    if (!reduceMotion && isInView && !document.hidden && !animationFrame) {
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        drawParticles(true);
      });
    }
  };

  const stopParticles = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      isInView = entries.some((entry) => entry.isIntersecting);
      if (isInView) {
        startParticles();
      } else {
        stopParticles();
      }
    }).observe(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopParticles();
    } else {
      startParticles();
    }
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!reduceMotion && isInView) {
      startParticles();
    }
  }, { passive: true });

  resizeCanvas();
  if (!reduceMotion) {
    startParticles();
  }
})();

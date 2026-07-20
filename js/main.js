(function () {
  'use strict';

  /* ---- Setup: Header / Navigation ---- */
  function setupHeader() {
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const header = document.getElementById('header');

    if (navToggle && mainNav) {
      navToggle.addEventListener('click', function () {
        const isOpen = mainNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      mainNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mainNav.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.header__link[href^="#"]');

    function setActiveNav() {
      const scrollY = window.scrollY + 120;

      sections.forEach(function (section) {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollY >= top && scrollY < top + height) {
          navLinks.forEach(function (link) {
            link.classList.remove('header__link--active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('header__link--active');
            }
          });
        }
      });
    }

    window.addEventListener('scroll', setActiveNav, { passive: true });

    if (header) {
      window.addEventListener(
        'scroll',
        function () {
          header.style.boxShadow =
            window.scrollY > 10
              ? '0 4px 20px rgba(62, 39, 35, 0.08)'
              : '0 1px 8px rgba(62, 39, 35, 0.04)';
        },
        { passive: true }
      );
    }
  }

  /* ---- Setup: Scroll Reveal ---- */
  function setupReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    if (!revealElements.length) return;

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

      revealElements.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      revealElements.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  /* ---- Setup: Build Sequence (GSAP + ScrollTrigger) ---- */
  function setupBuildSequence() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector('.build-sequence');
    const pinEl = section ? section.querySelector('.build-sequence__pin') : null;
    const video = section ? section.querySelector('.build-sequence__video') : null;
    const blocks = section ? gsap.utils.toArray('.build-sequence__block', section) : [];

    if (!section || !pinEl || !video) return;

    let sequenceTimeline = null;
    let refreshTimer = null;

    function getDuration() {
      const duration = video.duration;
      return duration && Number.isFinite(duration) ? duration : 0;
    }

    function getScrollDistance() {
      const duration = getDuration();
      return duration
        ? Math.max(window.innerHeight * 2.5, duration * 700)
        : window.innerHeight * 3;
    }

    function setVideoFromProgress(progress) {
      const duration = getDuration();
      if (!duration) return;

      const clamped = gsap.utils.clamp(0, 1, progress);
      const targetTime = duration * (1 - clamped);

      if (Math.abs(video.currentTime - targetTime) > 0.015) {
        video.currentTime = targetTime;
      }
    }

    function snapVideoToBoundary(progress) {
      const duration = getDuration();
      if (!duration) return;

      if (progress <= 0.001) {
        video.currentTime = duration;
      } else if (progress >= 0.999) {
        video.currentTime = 0;
      }
    }

    function syncAfterRefresh() {
      if (!sequenceTimeline || !sequenceTimeline.scrollTrigger) return;
      const st = sequenceTimeline.scrollTrigger;
      setVideoFromProgress(st.progress);
      snapVideoToBoundary(st.progress);
    }

    function destroySequence() {
      if (sequenceTimeline) {
        sequenceTimeline.scrollTrigger.kill();
        sequenceTimeline.kill();
        sequenceTimeline = null;
      }
    }

    function addBlockSequence(tl, block, startAt, fromX) {
      if (!block) return;

      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const enterX = isMobile ? 0 : fromX;
      const xPercent = isMobile ? -50 : 0;
      const fadeOutStart = startAt + 0.22;

      tl.fromTo(
        block,
        { autoAlpha: 0, x: enterX, xPercent: xPercent, yPercent: -50, y: 28 },
        {
          autoAlpha: 1,
          x: 0,
          xPercent: xPercent,
          yPercent: -50,
          y: 0,
          duration: 0.1,
          ease: 'power2.out',
        },
        startAt
      );

      tl.to(
        block,
        {
          autoAlpha: 0,
          x: enterX * 0.5,
          xPercent: xPercent,
          yPercent: -50,
          y: -18,
          duration: 0.1,
          ease: 'power2.in',
        },
        fadeOutStart
      );

      tl.set(block, { autoAlpha: 0 }, startAt + 0.32);
    }

    function initSequence() {
      destroySequence();

      const duration = getDuration();
      if (duration) {
        video.currentTime = duration;
      }

      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      gsap.set(blocks, {
        autoAlpha: 0,
        x: 0,
        xPercent: isMobile ? -50 : 0,
        yPercent: -50,
        y: 28,
      });

      sequenceTimeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'center center',
          end: function () {
            return '+=' + getScrollDistance();
          },
          pin: pinEl,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            setVideoFromProgress(self.progress);
          },
          onEnter: function (self) {
            setVideoFromProgress(self.progress);
          },
          onEnterBack: function (self) {
            setVideoFromProgress(self.progress);
          },
          onLeave: function () {
            if (getDuration()) {
              video.currentTime = 0;
            }
          },
          onLeaveBack: function () {
            if (getDuration()) {
              video.currentTime = getDuration();
            }
          },
        },
      });

      if (blocks.length >= 3) {
        addBlockSequence(sequenceTimeline, blocks[0], 0, -56);
        addBlockSequence(sequenceTimeline, blocks[1], 0.34, 56);
        addBlockSequence(sequenceTimeline, blocks[2], 0.68, -56);
      }

      ScrollTrigger.refresh();
      syncAfterRefresh();
    }

    function scheduleRefresh() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () {
        ScrollTrigger.refresh();
        syncAfterRefresh();
      }, 120);
    }

    function onVideoReady() {
      if (!getDuration()) return;

      if (!sequenceTimeline) {
        initSequence();
      } else {
        ScrollTrigger.refresh();
        syncAfterRefresh();
      }
    }

    video.addEventListener('loadedmetadata', onVideoReady);
    video.addEventListener('loadeddata', onVideoReady);

    video.addEventListener('error', function () {
      console.warn('[Build Sequence] Vídeo não carregou — verifique assets_/video-camadas.mp4');
    });

    if (getDuration()) {
      initSequence();
    } else {
      video.load();
    }

    window.addEventListener('load', scheduleRefresh);
    window.addEventListener('pageshow', scheduleRefresh);
    window.addEventListener('resize', scheduleRefresh);
  }

  /* ---- Video Player ---- */
  function setupVideoPlayer() {
    const videoPlayer = document.getElementById('videoPlayer');
    const processVideo = document.getElementById('processVideo');
    const videoPlayBtn = document.getElementById('videoPlayBtn');

    if (!videoPlayer || !processVideo || !videoPlayBtn) return;

    function playVideo() {
      processVideo.setAttribute('controls', '');
      processVideo.play();
      videoPlayer.classList.add('is-playing');
    }

    function pauseVideo() {
      processVideo.pause();
      videoPlayer.classList.remove('is-playing');
    }

    videoPlayBtn.addEventListener('click', function () {
      if (processVideo.paused) {
        playVideo();
      } else {
        pauseVideo();
      }
    });

    processVideo.addEventListener('ended', function () {
      videoPlayer.classList.remove('is-playing');
      processVideo.removeAttribute('controls');
    });

    processVideo.addEventListener('pause', function () {
      if (processVideo.currentTime > 0 && !processVideo.ended) {
        videoPlayer.classList.remove('is-playing');
      }
    });
  }

  /* ---- Product Cards → WhatsApp ---- */
  function setupProductCards() {
    document.querySelectorAll('.product-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const title = card.querySelector('.headline-sm');
        if (!title) return;

        const product = title.textContent.trim();
        const message = encodeURIComponent(
          'Olá! Gostaria de saber mais sobre: ' + product + '.'
        );
        window.open('https://wa.me/5596991801214?text=' + message, '_blank', 'noopener');
      });

      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  /* ---- Init ---- */
  setupHeader();
  setupReveal();
  setupBuildSequence();
  setupVideoPlayer();
  setupProductCards();
})();

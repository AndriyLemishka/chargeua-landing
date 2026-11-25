/**
 * Модуль інтеграції зовнішніх Vanilla JS медіабібліотек (ЛР №10)
 * та оптимізації завантаження фонового відео (ЛР №12)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Typed.js — динамічний ефект друкування переваг у Hero-секції
  const typedTarget = document.querySelector('#typed-text');
  if (typedTarget && typeof window.Typed !== 'undefined') {
    typedTarget.textContent = '';
    new window.Typed('#typed-text', {
      strings: [
        'зарядка 10→80% за 20 хвилин на хабах DC 160 кВт.',
        '480+ станцій по всій Україні зі статусом онлайн.',
        'робота від генераторів та накопичувачів у блекаути.',
        'нічний тариф Green Night — 8,90 ₴/кВт·год.'
      ],
      typeSpeed: 42,
      backSpeed: 24,
      backDelay: 2200,
      startDelay: 300,
      loop: true,
      smartBackspace: true,
      showCursor: true,
      cursorChar: '|'
    });
  }

  // 2. Swiper.js v11 — адаптивний слайдер відгуків спільноти (6 слайдів)
  const reviewsEl = document.querySelector('.reviews-swiper');
  if (reviewsEl && typeof window.Swiper !== 'undefined') {
    new window.Swiper('.reviews-swiper', {
      loop: true,
      spaceBetween: 24,
      speed: 600,
      grabCursor: true,
      watchOverflow: true,
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.reviews-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.reviews-next',
        prevEl: '.reviews-prev'
      },
      a11y: {
        prevSlideMessage: 'Попередній відгук',
        nextSlideMessage: 'Наступний відгук',
        paginationBulletMessage: 'Перейти до відгуку {{index}}'
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 16
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 24
        }
      }
    });
  }

  // 3. Fancybox v5 — інтерактивна галерея зарядних хабів (CSS Grid + Zoom + Fade)
  if (typeof window.Fancybox !== 'undefined') {
    window.Fancybox.bind('[data-fancybox="chargeua-gallery"]', {
      Carousel: {
        Transition: 'fade'
      },
      Images: {
        Panzoom: {
          maxScale: 3
        }
      },
      Toolbar: {
        display: {
          left: ['infobar'],
          middle: ['zoomIn', 'zoomOut', 'toggle1to1'],
          right: ['slideshow', 'thumbs', 'close']
        }
      }
    });
  }
});

// 4. Оптимізація LCP (ЛР №12): фонове відео в Hero завантажується лише на десктопі після першого рендера
window.addEventListener('load', () => {
  if (window.innerWidth < 1024) return;
  const videoEl = document.getElementById('hero-bg-video');
  const imgEl = document.getElementById('hero-bg-img');
  if (!videoEl || !videoEl.dataset.src) return;
  setTimeout(() => {
    videoEl.src = videoEl.dataset.src;
    videoEl.addEventListener('canplay', () => {
      videoEl.style.display = 'block';
      videoEl.classList.remove('hidden');
      if (imgEl) imgEl.style.display = 'none';
      videoEl.play().catch(() => {});
    }, { once: true });
    videoEl.load();
  }, 800);
});

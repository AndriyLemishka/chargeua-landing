/**
 * ChargeUA — Слайдер корисних відеоматеріалів (Webflow-Style Centered Peeking Carousel)
 * Повністю без forced reflow: використовує CSS-відсотки замість звернення до offsetWidth.
 */
(function () {
  'use strict';

  function initSlider() {
    const container = document.getElementById('media-slider-container');
    const track = document.getElementById('media-slider-track');
    const slides = document.querySelectorAll('.media-slide');
    const prevBtn = document.getElementById('media-prev-btn');
    const nextBtn = document.getElementById('media-next-btn');
    const dots = document.querySelectorAll('.slider-dot');

    if (!track || slides.length === 0) return;

    let currentIndex = 1;
    const totalSlides = slides.length;

    function updateSlider(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentIndex = index;

      const isMobile = window.innerWidth <= 768;
      const slidePercent = isMobile ? 88 : 68;
      const marginPercent = (100 - slidePercent) / 2;
      const offset = marginPercent - (currentIndex * slidePercent);

      track.style.transform = `translateX(${offset}%)`;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const isActive = (i === currentIndex);
        if (isActive) {
          slide.classList.add('is-active');
          slide.setAttribute('aria-hidden', 'false');
        } else {
          slide.classList.remove('is-active');
          slide.setAttribute('aria-hidden', 'true');
        }
        const focusables = slide.querySelectorAll('button, [tabindex], a');
        for (let j = 0; j < focusables.length; j++) {
          focusables[j].setAttribute('tabindex', isActive ? '0' : '-1');
        }
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const isActive = (i === currentIndex);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        dot.setAttribute('tabindex', isActive ? '0' : '-1');
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => updateSlider(currentIndex - 1), { passive: true });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => updateSlider(currentIndex + 1), { passive: true });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => updateSlider(i), { passive: true });
    });

    let startX = 0;
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) updateSlider(currentIndex + 1);
        else updateSlider(currentIndex - 1);
      }
    }, { passive: true });

    if (container) {
      container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') updateSlider(currentIndex - 1);
        else if (e.key === 'ArrowRight') updateSlider(currentIndex + 1);
      }, { passive: true });
    }

    // YouTube Facade
    document.querySelectorAll('.yt-facade').forEach(facade => {
      facade.addEventListener('click', function () {
        const videoId = this.getAttribute('data-yt-id');
        const title = this.getAttribute('data-yt-title') || 'YouTube video';
        if (!videoId) return;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        iframe.title = title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.className = 'w-full h-full absolute inset-0 rounded-2xl';
        iframe.style.border = '0';

        this.innerHTML = '';
        this.appendChild(iframe);
      }, { passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlider, { once: true });
  } else {
    initSlider();
  }
})();

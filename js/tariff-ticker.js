/**
 * ChargeUA — Модуль динамічного інформера тарифів та графіка цін (Tariff Ticker)
 * Семантичний блок <aside>, живий розрахунок добових коливань вартості електроенергії
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const tooltip = document.getElementById('chart-live-tooltip');
    const tooltipTime = document.getElementById('tooltip-time');
    const tooltipPrice = document.getElementById('tooltip-price');
    const tooltipDesc = document.getElementById('tooltip-desc');
    const chartSvg = document.getElementById('tariff-svg-chart');
    const countdownEl = document.getElementById('night-tariff-countdown');

    // Тарифна сітка по годинах (00:00 - 23:00)
    const hourlyTariffs = [
      { hour: '00:00', price: 8.90, zone: 'Пільговий Green Night (-37%)' },
      { hour: '02:00', price: 8.90, zone: 'Пільговий Green Night (-37%)' },
      { hour: '04:00', price: 8.90, zone: 'Пільговий Green Night (-37%)' },
      { hour: '06:00', price: 8.90, zone: 'Пільговий Green Night (-37%)' },
      { hour: '08:00', price: 12.20, zone: 'Ранковий напівпік' },
      { hour: '10:00', price: 12.50, zone: 'Стандартний денний' },
      { hour: '12:00', price: 12.50, zone: 'Стандартний денний' },
      { hour: '14:00', price: 12.40, zone: 'Стандартний денний' },
      { hour: '16:00', price: 13.80, zone: 'Перехід до вечірнього піку' },
      { hour: '18:00', price: 14.12, zone: 'Вечірній пік навантаження' },
      { hour: '20:00', price: 14.12, zone: 'Вечірній пік навантаження' },
      { hour: '22:00', price: 11.50, zone: 'Зниження навантаження' },
      { hour: '23:00', price: 8.90, zone: 'Пільговий Green Night (-37%)' }
    ];

    // Оновлення зворотного відліку до нічного тарифу (23:00)
    function updateCountdown() {
      if (!countdownEl) return;
      const now = new Date();
      const target = new Date();
      target.setHours(23, 0, 0, 0);

      let diff = target - now;
      if (diff < 0) {
        // Якщо вже після 23:00, рахуємо до 07:00 ранку (триває нічний тариф)
        const endNight = new Date();
        endNight.setHours(7, 0, 0, 0);
        if (now.getHours() >= 23) {
          endNight.setDate(endNight.getDate() + 1);
        }
        const activeDiff = endNight - now;
        const h = Math.floor(activeDiff / (1000 * 60 * 60));
        const m = Math.floor((activeDiff % (1000 * 60 * 60)) / (1000 * 60));
        countdownEl.innerHTML = `<span class="text-emerald-400 font-bold">● Діє зараз</span> (ще ${h}г ${m}хв)`;
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdownEl.textContent = `через ${hours} год ${mins} хв`;
    }

    updateCountdown();
    setInterval(updateCountdown, 60000);

    // Інтерактивні точки графіка
    const points = document.querySelectorAll('.chart-interactive-point');
    points.forEach((point) => {
      point.addEventListener('mouseenter', function (e) {
        const h = this.getAttribute('data-hour');
        const p = this.getAttribute('data-price');
        const z = this.getAttribute('data-zone');

        if (tooltip && tooltipTime && tooltipPrice && tooltipDesc) {
          tooltipTime.textContent = h;
          tooltipPrice.textContent = `${p} ₴/кВт·год`;
          tooltipDesc.textContent = z;
          tooltip.classList.remove('opacity-0', 'pointer-events-none');
        }
      });
    });

    if (chartSvg) {
      chartSvg.addEventListener('mouseleave', function () {
        if (tooltip) {
          tooltip.classList.add('opacity-0', 'pointer-events-none');
        }
      });
    }
  });
})();

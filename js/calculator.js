/**
 * ChargeUA — Інтерактивний калькулятор зарядки електромобілів (ЛР №11)
 * База 45+ моделей (AUTO.RIA style за брендами), ручне введення ємності батареї (кВт·год),
 * вибір тарифного плану / нічного тарифу / бронювання, сувора валідація Edge Cases
 * та захисне програмування (Defensive Guards проти NaN, Infinity, від'ємних значень і XSS).
 */

(function () {
  'use strict';

  const MIN_CAPACITY_KWH = 10;
  const MAX_CAPACITY_KWH = 250;
  const DEFAULT_CAPACITY_KWH = 65;
  const MIN_PERCENT = 20;
  const MAX_PERCENT = 100;
  const NIGHT_TARIFF_PRICE = 8.90;
  const RESERVE_FEE_UAH = 15.00;
  const BENZIN_PRICE_PER_LITER = 58.50;
  const BENZIN_CONSUMPTION_L_100KM = 8.5;

  const TARIFF_PLANS = {
    standard: { label: 'Стандарт DC 120 кВт', price: 14.12, hubMaxKw: 120 },
    ultrafast: { label: 'Ultra-Fast DC 160+ кВт', price: 17.90, hubMaxKw: 160 },
    ac: { label: 'Міський AC 22 кВт', price: 10.50, hubMaxKw: 22 }
  };

  // База даних електромобілів (згрупована за брендами для випадаючого списку та розрахунків)
  const CAR_DATABASE = {
    // --- Volkswagen ---
    'vw-id4-pro': { name: 'Volkswagen ID.4 Pro', brand: 'Volkswagen', capacity: 77, maxDc: 135, connector: 'CCS2', consumption: 18.0 },
    'vw-id4-pure': { name: 'Volkswagen ID.4 Pure', brand: 'Volkswagen', capacity: 52, maxDc: 110, connector: 'CCS2', consumption: 17.0 },
    'vw-id3-pro': { name: 'Volkswagen ID.3 Pro', brand: 'Volkswagen', capacity: 58, maxDc: 120, connector: 'CCS2', consumption: 15.5 },
    'vw-id6-crozz': { name: 'Volkswagen ID.6 Crozz (China)', brand: 'Volkswagen', capacity: 84.8, maxDc: 100, connector: 'GB/T', consumption: 19.5 },
    'vw-id7-pro': { name: 'Volkswagen ID.7 Pro', brand: 'Volkswagen', capacity: 77, maxDc: 175, connector: 'CCS2', consumption: 16.0 },
    'vw-egolf': { name: 'Volkswagen e-Golf', brand: 'Volkswagen', capacity: 35.8, maxDc: 40, connector: 'CCS2', consumption: 15.0 },

    // --- Tesla ---
    'tesla-m3-std': { name: 'Tesla Model 3 RWD', brand: 'Tesla', capacity: 60, maxDc: 170, connector: 'CCS2', consumption: 14.5 },
    'tesla-m3-lr': { name: 'Tesla Model 3 Long Range', brand: 'Tesla', capacity: 82, maxDc: 250, connector: 'CCS2', consumption: 15.0 },
    'tesla-my-lr': { name: 'Tesla Model Y Long Range', brand: 'Tesla', capacity: 75, maxDc: 250, connector: 'CCS2', consumption: 16.8 },
    'tesla-my-p': { name: 'Tesla Model Y Performance', brand: 'Tesla', capacity: 78, maxDc: 250, connector: 'CCS2', consumption: 17.5 },
    'tesla-ms-p': { name: 'Tesla Model S Plaid', brand: 'Tesla', capacity: 100, maxDc: 250, connector: 'CCS2', consumption: 18.5 },
    'tesla-mx-lr': { name: 'Tesla Model X Long Range', brand: 'Tesla', capacity: 100, maxDc: 250, connector: 'CCS2', consumption: 20.5 },

    // --- Nissan ---
    'nissan-leaf-40': { name: 'Nissan Leaf 40 kWh', brand: 'Nissan', capacity: 40, maxDc: 50, connector: 'CHAdeMO', consumption: 16.5 },
    'nissan-leaf-62': { name: 'Nissan Leaf e+ 62 kWh', brand: 'Nissan', capacity: 62, maxDc: 100, connector: 'CHAdeMO', consumption: 17.5 },
    'nissan-ariya-63': { name: 'Nissan Ariya 63 kWh', brand: 'Nissan', capacity: 63, maxDc: 130, connector: 'CCS2', consumption: 18.0 },
    'nissan-ariya-87': { name: 'Nissan Ariya 87 kWh', brand: 'Nissan', capacity: 87, maxDc: 130, connector: 'CCS2', consumption: 19.5 },

    // --- Hyundai & Kia ---
    'hyundai-ioniq5': { name: 'Hyundai Ioniq 5', brand: 'Hyundai', capacity: 72.6, maxDc: 220, connector: 'CCS2', consumption: 18.5 },
    'hyundai-ioniq6': { name: 'Hyundai Ioniq 6', brand: 'Hyundai', capacity: 77.4, maxDc: 235, connector: 'CCS2', consumption: 15.0 },
    'hyundai-kona': { name: 'Hyundai Kona Electric', brand: 'Hyundai', capacity: 64, maxDc: 100, connector: 'CCS2', consumption: 16.0 },
    'kia-ev6': { name: 'Kia EV6', brand: 'Kia', capacity: 77.4, maxDc: 235, connector: 'CCS2', consumption: 18.0 },
    'kia-ev9': { name: 'Kia EV9', brand: 'Kia', capacity: 99.8, maxDc: 210, connector: 'CCS2', consumption: 22.0 },
    'kia-niro-ev': { name: 'Kia Niro EV', brand: 'Kia', capacity: 64.8, maxDc: 85, connector: 'CCS2', consumption: 16.2 },

    // --- BMW ---
    'bmw-i4': { name: 'BMW i4 eDrive40', brand: 'BMW', capacity: 83.9, maxDc: 205, connector: 'CCS2', consumption: 17.5 },
    'bmw-ix': { name: 'BMW iX xDrive50', brand: 'BMW', capacity: 111.5, maxDc: 195, connector: 'CCS2', consumption: 21.0 },
    'bmw-ix3': { name: 'BMW iX3', brand: 'BMW', capacity: 80, maxDc: 150, connector: 'CCS2', consumption: 18.5 },
    'bmw-i3': { name: 'BMW i3 120Ah', brand: 'BMW', capacity: 42.2, maxDc: 50, connector: 'CCS2', consumption: 14.0 },

    // --- Mercedes-Benz ---
    'mb-eqe': { name: 'Mercedes-Benz EQE 350+', brand: 'Mercedes-Benz', capacity: 90.6, maxDc: 170, connector: 'CCS2', consumption: 18.0 },
    'mb-eqs': { name: 'Mercedes-Benz EQS 450+', brand: 'Mercedes-Benz', capacity: 107.8, maxDc: 200, connector: 'CCS2', consumption: 19.5 },
    'mb-eqa': { name: 'Mercedes-Benz EQA 250', brand: 'Mercedes-Benz', capacity: 66.5, maxDc: 100, connector: 'CCS2', consumption: 17.5 },
    'mb-eqc': { name: 'Mercedes-Benz EQC 400', brand: 'Mercedes-Benz', capacity: 80, maxDc: 110, connector: 'CCS2', consumption: 21.5 },

    // --- Audi & Porsche ---
    'audi-etron': { name: 'Audi e-tron 55 quattro', brand: 'Audi', capacity: 95, maxDc: 150, connector: 'CCS2', consumption: 23.0 },
    'audi-q4': { name: 'Audi Q4 e-tron', brand: 'Audi', capacity: 82, maxDc: 135, connector: 'CCS2', consumption: 18.0 },
    'porsche-taycan': { name: 'Porsche Taycan 4S', brand: 'Porsche', capacity: 93.4, maxDc: 270, connector: 'CCS2', consumption: 21.5 },
    'porsche-macan': { name: 'Porsche Macan Electric', brand: 'Porsche', capacity: 100, maxDc: 270, connector: 'CCS2', consumption: 20.0 },

    // --- BYD & Zeekr (Китайські електрокари, порт GB/T) ---
    'byd-song-plus': { name: 'BYD Song Plus EV', brand: 'BYD', capacity: 71.7, maxDc: 90, connector: 'GB/T', consumption: 17.0 },
    'byd-tang': { name: 'BYD Tang EV', brand: 'BYD', capacity: 108.8, maxDc: 120, connector: 'GB/T', consumption: 22.0 },
    'byd-yuan-plus': { name: 'BYD Yuan Plus / Atto 3', brand: 'BYD', capacity: 60.5, maxDc: 88, connector: 'GB/T', consumption: 16.0 },
    'zeekr-001': { name: 'Zeekr 001', brand: 'Zeekr', capacity: 100, maxDc: 200, connector: 'GB/T', consumption: 19.0 },
    'zeekr-x': { name: 'Zeekr X', brand: 'Zeekr', capacity: 66, maxDc: 150, connector: 'GB/T', consumption: 17.5 },
    'zeekr-007': { name: 'Zeekr 007', brand: 'Zeekr', capacity: 75, maxDc: 220, connector: 'GB/T', consumption: 16.5 },

    // --- Інші популярні бренди ---
    'renault-zoe': { name: 'Renault Zoe Z.E. 50', brand: 'Renault', capacity: 52, maxDc: 50, connector: 'CCS2', consumption: 15.5 },
    'volvo-ex30': { name: 'Volvo EX30', brand: 'Volvo', capacity: 69, maxDc: 153, connector: 'CCS2', consumption: 17.0 },
    'mg-mg4': { name: 'MG 4 Electric', brand: 'MG', capacity: 64, maxDc: 135, connector: 'CCS2', consumption: 16.5 },
    'ford-mach-e': { name: 'Ford Mustang Mach-E ER', brand: 'Ford', capacity: 98.7, maxDc: 150, connector: 'CCS2', consumption: 20.0 },
    'chevy-bolt': { name: 'Chevrolet Bolt EV', brand: 'Chevrolet', capacity: 65, maxDc: 55, connector: 'CCS2', consumption: 16.0 }
  };

  let currentCarKey = 'vw-id4-pro';
  let isManualMode = false;
  let manualCapacity = DEFAULT_CAPACITY_KWH;
  let manualConnector = 'CCS2';
  let startPercent = MIN_PERCENT;
  let targetPercent = 80;
  let selectedTariffKey = 'standard';
  let isNightTariff = false;
  let hasPortReserve = false;
  let isNavigating = false;
  let activeWarning = '';

  function clamp(num, min, max) {
    if (!Number.isFinite(num)) return min;
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Захисна перевірка ручного введення ємності батареї (кВт·год)
   */
  function sanitizeCapacity(rawValue) {
    const str = String(rawValue ?? '').trim();
    if (str.length === 0) {
      return {
        valid: false,
        value: clamp(manualCapacity, MIN_CAPACITY_KWH, MAX_CAPACITY_KWH),
        error: 'Поле ємності порожнє. Вкажіть значення від 10 до 250 кВт·год.'
      };
    }

    // Блокуємо сторонні символи, текстові рядки або XSS-ін'єкції
    if (!/^-?\d+(?:[.,]\d+)?$/.test(str)) {
      return {
        valid: false,
        value: clamp(manualCapacity, MIN_CAPACITY_KWH, MAX_CAPACITY_KWH),
        error: 'Дозволено лише числа (наприклад, 65). Нечислові символи заблоковано.'
      };
    }

    const parsed = parseFloat(str.replace(',', '.'));
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      return {
        valid: false,
        value: DEFAULT_CAPACITY_KWH,
        error: 'Некоректне числове значення. Використано резервне значення.'
      };
    }

    if (parsed <= 0) {
      return {
        valid: false,
        value: MIN_CAPACITY_KWH,
        error: 'Ємність не може бути ≤ 0. Для безпеки застосовано мінімум 10 кВт·год.'
      };
    }

    if (parsed < MIN_CAPACITY_KWH) {
      return {
        valid: false,
        value: MIN_CAPACITY_KWH,
        error: `Мінімальна ємність батареї — ${MIN_CAPACITY_KWH} кВт·год.`
      };
    }

    if (parsed > MAX_CAPACITY_KWH) {
      return {
        valid: false,
        value: MAX_CAPACITY_KWH,
        error: `Перевищено максимум (${MAX_CAPACITY_KWH} кВт·год). Обмежено для захисту від переповнення.`
      };
    }

    return { valid: true, value: Math.round(parsed * 10) / 10, error: '' };
  }

  function showManualError(inputEl, errorEl, message) {
    if (inputEl) {
      inputEl.classList.remove('is-valid');
      inputEl.classList.add('is-invalid');
      inputEl.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearManualError(inputEl, errorEl, markValid) {
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.toggle('is-valid', Boolean(markValid));
      inputEl.setAttribute('aria-invalid', 'false');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function setWarningBanner(message) {
    const banner = document.getElementById('calc-warning-banner');
    if (!banner) return;
    if (message) {
      banner.textContent = message;
      banner.classList.add('visible');
    } else {
      banner.textContent = '';
      banner.classList.remove('visible');
    }
  }

  function getTariffConfig() {
    const plan = TARIFF_PLANS[selectedTariffKey] || TARIFF_PLANS.standard;
    const effectivePrice = isNightTariff ? NIGHT_TARIFF_PRICE : plan.price;
    const label = isNightTariff ? `Green Night (${plan.label})` : plan.label;
    return {
      price: effectivePrice,
      hubMaxKw: plan.hubMaxKw,
      label
    };
  }

  function getActiveCarData() {
    if (isManualMode) {
      const safeCap = clamp(manualCapacity, MIN_CAPACITY_KWH, MAX_CAPACITY_KWH);
      return {
        name: `Власна ємність (${safeCap} кВт·год)`,
        brand: 'Користувацьке авто',
        capacity: safeCap,
        maxDc: 120,
        connector: manualConnector,
        consumption: 18.0
      };
    }
    return CAR_DATABASE[currentCarKey] || CAR_DATABASE['vw-id4-pro'];
  }

  /**
   * Чиста функція обчислень із захистом від NaN, Infinity та від'ємних результатів
   */
  function calculateSessionMetrics(car, tariffCfg) {
    const safeStart = clamp(Number(startPercent), 0, MAX_PERCENT);
    const safeTarget = clamp(Number(targetPercent), safeStart, MAX_PERCENT);
    const safeCapacity = clamp(Number(car.capacity), MIN_CAPACITY_KWH, MAX_CAPACITY_KWH);
    const safeTariff = clamp(Number(tariffCfg.price), 1, 100);
    const safeConsumption = clamp(Number(car.consumption) || 18, 5, 50);

    const addedPercent = Math.max(0, safeTarget - safeStart);
    const addedKwh = (addedPercent / 100) * safeCapacity;
    const energyCost = addedKwh * safeTariff;
    const reserveFee = hasPortReserve ? RESERVE_FEE_UAH : 0;
    const sessionCost = Math.max(0, energyCost + reserveFee);

    const effectiveKw = Math.max(7, Math.min(Number(car.maxDc) || 120, tariffCfg.hubMaxKw));
    const chargingMinutes = addedKwh > 0
      ? Math.max(5, Math.round((addedKwh / effectiveKw) * 60))
      : 0;

    const kmAdded = (addedKwh / safeConsumption) * 100;
    const benzinCost = (kmAdded / 100) * BENZIN_CONSUMPTION_L_100KM * BENZIN_PRICE_PER_LITER;
    const savings = Math.max(0, Math.round(benzinCost - sessionCost + (safeCapacity >= 70 ? 550 : 350)));

    return {
      safeStart,
      safeTarget,
      addedKwh: Number.isFinite(addedKwh) ? addedKwh : 0,
      sessionCost: Number.isFinite(sessionCost) ? sessionCost : 0,
      effectiveKw,
      chargingMinutes: Number.isFinite(chargingMinutes) ? chargingMinutes : 0,
      savings: Number.isFinite(savings) ? savings : 0,
      tariffPrice: safeTariff,
      reserveFee
    };
  }

  function updateCalculation() {
    const car = getActiveCarData();
    const tariffCfg = getTariffConfig();
    const metrics = calculateSessionMetrics(car, tariffCfg);

    const rangeValEl = document.getElementById('slider-range-val');
    if (rangeValEl) {
      rangeValEl.textContent = `${metrics.safeStart}% → ${metrics.safeTarget}% (Додано +${metrics.addedKwh.toFixed(1)} кВт·год)`;
    }

    const sliderFillEl = document.getElementById('slider-fill');
    if (sliderFillEl) {
      sliderFillEl.style.left = `${metrics.safeStart}%`;
      sliderFillEl.style.width = `${Math.max(0, metrics.safeTarget - metrics.safeStart)}%`;
    }

    const sliderBadgeEl = document.getElementById('slider-badge');
    if (sliderBadgeEl) {
      sliderBadgeEl.style.left = `${metrics.safeTarget}%`;
      sliderBadgeEl.textContent = `${metrics.safeTarget}% (${metrics.safeTarget >= 80 ? 'Цільовий' : 'Рівень'})`;
    }

    const specCarName = document.getElementById('spec-car-name');
    if (specCarName) specCarName.textContent = car.name;

    const specCarKwh = document.getElementById('spec-car-kwh');
    if (specCarKwh) specCarKwh.textContent = `${car.capacity} кВт·год`;

    const specCarPort = document.getElementById('spec-car-port');
    if (specCarPort) {
      specCarPort.textContent = car.connector;
      specCarPort.className = `badge-port badge-port--${car.connector.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }

    const specCarDc = document.getElementById('spec-car-dc');
    if (specCarDc) specCarDc.textContent = `до ${car.maxDc} кВт`;

    const priceEl = document.getElementById('res-price');
    if (priceEl) priceEl.textContent = `${metrics.sessionCost.toFixed(2)} ₴`;

    const metaEl = document.getElementById('res-meta');
    if (metaEl) {
      const reserveLabel = metrics.reserveFee > 0 ? ` + ${metrics.reserveFee} ₴ бронь` : '';
      metaEl.textContent = `Тариф: ${metrics.tariffPrice.toFixed(2)} ₴/кВт·год · ${metrics.addedKwh.toFixed(1)} кВт·год${reserveLabel}`;
    }

    const timeEl = document.getElementById('res-time');
    if (timeEl) timeEl.textContent = `~${metrics.chargingMinutes} хвилин`;

    const savingsEl = document.getElementById('res-savings');
    if (savingsEl) savingsEl.textContent = `~${metrics.savings.toLocaleString('uk-UA')} ₴`;

    const effEl = document.getElementById('res-efficiency');
    if (effEl && effEl.firstChild && effEl.firstChild.nodeType === Node.TEXT_NODE) {
      effEl.firstChild.nodeValue = `● Час на ${tariffCfg.hubMaxKw <= 22 ? 'AC' : 'DC'} ${metrics.effectiveKw} кВт: `;
    }

    setWarningBanner(activeWarning);
  }

  function initCalculator() {
    const carButtons = document.querySelectorAll('.car-pill');
    const carDropdown = document.getElementById('car-select-dropdown');
    const rangeSlider = document.getElementById('calc-range-slider');
    const findBtn = document.getElementById('btn-calc-find');
    const btnToggleManual = document.getElementById('btn-toggle-manual');
    const manualPanel = document.getElementById('calc-manual-panel');
    const manualInput = document.getElementById('manual-kwh-input');
    const manualError = document.getElementById('manual-kwh-error');
    const portChips = document.querySelectorAll('.manual-ports-row .port-chip');
    const tariffSelect = document.getElementById('calc-tariff-select');
    const nightCheckbox = document.getElementById('calc-night-opt');
    const reserveCheckbox = document.getElementById('calc-reserve-opt');

    if (!rangeSlider) return;

    // Швидкі пресети (пилюлі)
    carButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        isManualMode = false;
        activeWarning = '';
        if (manualPanel) manualPanel.style.display = 'none';
        if (btnToggleManual) btnToggleManual.classList.remove('active');
        clearManualError(manualInput, manualError, false);

        carButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-checked', 'true');

        const carKey = this.dataset.car;
        if (CAR_DATABASE[carKey]) {
          currentCarKey = carKey;
          if (carDropdown) carDropdown.value = carKey;
          updateCalculation();
        }
      });
    });

    // Випадаючий список за групами (AUTO.RIA style)
    if (carDropdown) {
      carDropdown.addEventListener('change', function () {
        const selectedKey = this.value;
        if (CAR_DATABASE[selectedKey]) {
          isManualMode = false;
          activeWarning = '';
          if (manualPanel) manualPanel.style.display = 'none';
          if (btnToggleManual) btnToggleManual.classList.remove('active');
          clearManualError(manualInput, manualError, false);

          currentCarKey = selectedKey;

          carButtons.forEach(btn => {
            const matches = btn.dataset.car === selectedKey;
            btn.classList.toggle('active', matches);
            btn.setAttribute('aria-checked', matches ? 'true' : 'false');
          });

          updateCalculation();
        }
      });
    }

    // Перемикач режиму ручного введення
    if (btnToggleManual && manualPanel) {
      btnToggleManual.addEventListener('click', function () {
        const shouldOpen = manualPanel.style.display === 'none' || getComputedStyle(manualPanel).display === 'none';
        isManualMode = shouldOpen;
        if (isManualMode) {
          manualPanel.style.display = 'block';
          this.classList.add('active');
          carButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
          });
          if (carDropdown) carDropdown.value = '';
          if (manualInput) {
            const check = sanitizeCapacity(manualInput.value);
            manualCapacity = check.value;
            if (!check.valid) {
              activeWarning = `Fail-Safe: ${check.error}`;
              showManualError(manualInput, manualError, check.error);
            } else {
              activeWarning = '';
              clearManualError(manualInput, manualError, true);
            }
          }
        } else {
          manualPanel.style.display = 'none';
          this.classList.remove('active');
          activeWarning = '';
          clearManualError(manualInput, manualError, false);
          const activeBtn = document.querySelector(`.car-pill[data-car="${currentCarKey}"]`);
          if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-checked', 'true');
          }
          if (carDropdown) carDropdown.value = currentCarKey;
        }
        updateCalculation();
      });
    }

    // Ручне введення значення кВт·год із миттєвим захистом Edge Cases
    if (manualInput) {
      const handleManualInput = () => {
        if (!isManualMode) isManualMode = true;
        const check = sanitizeCapacity(manualInput.value);
        manualCapacity = check.value;

        if (!check.valid) {
          activeWarning = `Fail-Safe: ${check.error}`;
          showManualError(manualInput, manualError, check.error);
        } else {
          activeWarning = '';
          clearManualError(manualInput, manualError, true);
        }
        updateCalculation();
      };

      manualInput.addEventListener('input', handleManualInput);
      manualInput.addEventListener('change', () => {
        const check = sanitizeCapacity(manualInput.value);
        if (!check.valid && String(manualInput.value).trim() !== '') {
          manualInput.value = String(check.value);
          manualCapacity = check.value;
          activeWarning = `Значення скориговано до безпечної межі: ${check.value} кВт·год.`;
          clearManualError(manualInput, manualError, true);
          updateCalculation();
        }
      });
    }

    // Вибір порту в ручному режимі
    portChips.forEach(chip => {
      chip.addEventListener('click', function () {
        portChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        manualConnector = this.dataset.port || 'CCS2';
        updateCalculation();
      });
    });

    // Повзунок заряду батареї
    rangeSlider.addEventListener('input', function () {
      const parsed = parseInt(this.value, 10);
      if (Number.isNaN(parsed) || parsed < MIN_PERCENT || parsed > MAX_PERCENT) {
        targetPercent = clamp(parsed || 80, MIN_PERCENT, MAX_PERCENT);
        this.value = String(targetPercent);
        activeWarning = 'Рівень заряду примусово обмежено діапазоном 20–100%.';
      } else {
        targetPercent = parsed;
      }
      updateCalculation();
    });

    // Тарифний план (select -> change)
    if (tariffSelect) {
      tariffSelect.addEventListener('change', function () {
        selectedTariffKey = TARIFF_PLANS[this.value] ? this.value : 'standard';
        updateCalculation();
      });
    }

    // Нічний тариф Green Night (checkbox -> change)
    if (nightCheckbox) {
      nightCheckbox.addEventListener('change', function () {
        isNightTariff = Boolean(this.checked);
        updateCalculation();
      });
    }

    // Пріоритетне бронювання порту (checkbox -> change)
    if (reserveCheckbox) {
      reserveCheckbox.addEventListener('change', function () {
        hasPortReserve = Boolean(this.checked);
        updateCalculation();
      });
    }

    // Кнопка швидкого переходу до карти із захистом від подвійного кліку
    if (findBtn) {
      findBtn.addEventListener('click', function () {
        if (isNavigating) return;
        isNavigating = true;
        findBtn.disabled = true;

        const activeCar = getActiveCarData();
        const mapEl = document.getElementById('map');
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: 'smooth' });
        }
        if (window.ChargeUAMap && typeof window.ChargeUAMap.filterByConnector === 'function') {
          window.ChargeUAMap.filterByConnector(activeCar.connector);
        }

        setTimeout(() => {
          isNavigating = false;
          findBtn.disabled = false;
        }, 650);
      });
    }

    updateCalculation();
  }

  let isCalculatorInitialized = false;
  function ensureCalculatorInit() {
    if (isCalculatorInitialized) return;
    isCalculatorInitialized = true;
    initCalculator();
  }

  function setupLazyCalculator() {
    const calcEl = document.getElementById('calculator');
    if ('IntersectionObserver' in window && calcEl) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            ensureCalculatorInit();
            observer.disconnect();
          }
        });
      }, { rootMargin: '200px 0px' });
      observer.observe(calcEl);
      calcEl.addEventListener('pointerdown', ensureCalculatorInit, { once: true, passive: true });
      calcEl.addEventListener('focusin', ensureCalculatorInit, { once: true, passive: true });
    } else {
      ensureCalculatorInit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyCalculator);
  } else {
    setupLazyCalculator();
  }

  window.ChargeUACalculator = {
    getCars: () => ({ ...CAR_DATABASE }),
    setCar: function (carKey) {
      if (CAR_DATABASE[carKey]) {
        currentCarKey = carKey;
        isManualMode = false;
        activeWarning = '';
        updateCalculation();
      }
    },
    testEdgeCase: function (rawCapacity) {
      isManualMode = true;
      const check = sanitizeCapacity(rawCapacity);
      manualCapacity = check.value;
      activeWarning = check.valid ? '' : `Fail-Safe: ${check.error}`;
      const car = getActiveCarData();
      const tariffCfg = getTariffConfig();
      return {
        input: rawCapacity,
        validation: check,
        metrics: calculateSessionMetrics(car, tariffCfg)
      };
    }
  };
})();

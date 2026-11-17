/**
 * Модуль клієнтської валідації форми зворотного зв'язку ChargeUA (ЛР №9).
 * Забезпечує перевірку полів за RegEx, динамічні UX-стани та доступне модальне вікно.
 */

const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const REGEX_PHONE = /^\+380\d{9}$/;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  const agreementInput = document.getElementById('agreement');
  const submitBtn = document.getElementById('submitFeedbackBtn');

  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const phoneError = document.getElementById('phoneError');
  const messageError = document.getElementById('messageError');
  const agreementError = document.getElementById('agreementError');

  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (!form || !usernameInput || !emailInput || !phoneInput || !messageInput || !agreementInput) {
    return;
  }

  const touched = {
    username: false,
    email: false,
    phone: false,
    message: false,
    agreement: false,
  };

  let lastFocusedElement = null;
  let isSubmitting = false;

  /**
   * Відображає стан помилки поля та текст підказки для користувача й скрінрідера.
   */
  function showError(inputEl, errorEl, message) {
    if (inputEl.type !== 'checkbox') {
      inputEl.classList.remove('border-gray-300', 'border-green-500', 'focus:ring-green-100');
      inputEl.classList.add('border-red-500', 'focus:ring-red-100');
    }
    inputEl.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  /**
   * Відображає валідний стан поля (зелена рамка) та ховає повідомлення про помилку.
   */
  function showSuccess(inputEl, errorEl) {
    if (inputEl.type !== 'checkbox') {
      inputEl.classList.remove('border-gray-300', 'border-red-500', 'focus:ring-red-100');
      inputEl.classList.add('border-green-500', 'focus:ring-green-100');
    }
    inputEl.setAttribute('aria-invalid', 'false');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  /**
   * Скидає оформлення поля до початкового нейтрального стану.
   */
  function clearError(inputEl, errorEl) {
    if (inputEl.type !== 'checkbox') {
      inputEl.classList.remove('border-red-500', 'border-green-500', 'focus:ring-red-100', 'focus:ring-green-100');
      inputEl.classList.add('border-gray-300');
    }
    inputEl.setAttribute('aria-invalid', 'false');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  /**
   * М'яка UX-нормалізація телефонного номера при вставці або втраті фокусу.
   * Не заважає введенню чи видаленню символів клавішею Backspace.
   */
  function normalizePhoneValue(rawValue) {
    const cleaned = rawValue.replace(/[\s()-]/g, '');
    if (/^0\d{9}$/.test(cleaned)) {
      return '+38' + cleaned;
    }
    if (/^380\d{9}$/.test(cleaned)) {
      return '+' + cleaned;
    }
    return cleaned;
  }

  function validateName() {
    const val = usernameInput.value.trim();
    if (val.length === 0) {
      showError(usernameInput, nameError, "Вкажіть ваше ім'я.");
      return false;
    }
    if (val.length < 2) {
      showError(usernameInput, nameError, "Ім'я повинно містити щонайменше 2 символи.");
      return false;
    }
    showSuccess(usernameInput, nameError);
    return true;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    if (val.length === 0) {
      showError(emailInput, emailError, 'Вкажіть електронну пошту.');
      return false;
    }
    if (!REGEX_EMAIL.test(val)) {
      showError(emailInput, emailError, 'Введіть коректну електронну адресу (наприклад: name@gmail.com).');
      return false;
    }
    showSuccess(emailInput, emailError);
    return true;
  }

  function validatePhone() {
    const normalized = normalizePhoneValue(phoneInput.value.trim());
    if (normalized !== phoneInput.value && REGEX_PHONE.test(normalized)) {
      phoneInput.value = normalized;
    }

    const val = phoneInput.value.trim();
    if (val.length === 0) {
      showError(phoneInput, phoneError, 'Вкажіть номер телефону у форматі +380XXXXXXXXX.');
      return false;
    }
    if (!REGEX_PHONE.test(val)) {
      showError(phoneInput, phoneError, 'Номер має відповідати українському формату +380XXXXXXXXX (без пробілів та літер).');
      return false;
    }
    showSuccess(phoneInput, phoneError);
    return true;
  }

  function validateMessage() {
    const val = messageInput.value.trim();
    if (val.length === 0) {
      showError(messageInput, messageError, 'Напишіть текст повідомлення.');
      return false;
    }
    if (val.length < 10) {
      showError(messageInput, messageError, `Повідомлення має містити щонайменше 10 символів (зараз: ${val.length}).`);
      return false;
    }
    showSuccess(messageInput, messageError);
    return true;
  }

  function validateAgreement() {
    if (!agreementInput.checked) {
      showError(agreementInput, agreementError, 'Підтвердіть згоду з політикою конфіденційності.');
      return false;
    }
    showSuccess(agreementInput, agreementError);
    return true;
  }

  function bindDynamicValidation(inputEl, fieldKey, validatorFn) {
    inputEl.addEventListener('blur', () => {
      touched[fieldKey] = true;
      validatorFn();
    });

    inputEl.addEventListener('input', () => {
      if (fieldKey === 'phone') {
        // Автоперетворення при вставці номера типу "050 123 45 67" або "(050)..."
        const candidate = normalizePhoneValue(phoneInput.value);
        if (REGEX_PHONE.test(candidate)) {
          phoneInput.value = candidate;
          touched.phone = true;
        }
      }
      if (touched[fieldKey]) {
        validatorFn();
      }
    });
  }

  bindDynamicValidation(usernameInput, 'username', validateName);
  bindDynamicValidation(emailInput, 'email', validateEmail);
  bindDynamicValidation(phoneInput, 'phone', validatePhone);
  bindDynamicValidation(messageInput, 'message', validateMessage);

  agreementInput.addEventListener('change', () => {
    touched.agreement = true;
    validateAgreement();
  });

  function openSuccessModal() {
    if (!successModal) return;
    lastFocusedElement = document.activeElement;
    successModal.classList.remove('hidden');
    successModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    if (closeModalBtn) {
      closeModalBtn.focus();
    }
  }

  function closeSuccessModal() {
    if (!successModal) return;
    successModal.classList.remove('flex');
    successModal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    } else if (submitBtn) {
      submitBtn.focus();
    }
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeSuccessModal);
  }

  if (successModal) {
    // Закриваємо лише при кліку саме по затемненому фону, а не всередині білої картки
    successModal.addEventListener('click', (event) => {
      if (event.target === successModal) {
        closeSuccessModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && successModal && !successModal.classList.contains('hidden')) {
      closeSuccessModal();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;

    touched.username = true;
    touched.email = true;
    touched.phone = true;
    touched.message = true;
    touched.agreement = true;

    const checks = [
      { ok: validateName(), el: usernameInput },
      { ok: validateEmail(), el: emailInput },
      { ok: validatePhone(), el: phoneInput },
      { ok: validateMessage(), el: messageInput },
      { ok: validateAgreement(), el: agreementInput },
    ];

    const firstInvalid = checks.find((item) => !item.ok);
    if (firstInvalid) {
      firstInvalid.el.focus();
      isSubmitting = false;
      return;
    }

    form.reset();
    clearError(usernameInput, nameError);
    clearError(emailInput, emailError);
    clearError(phoneInput, phoneError);
    clearError(messageInput, messageError);
    clearError(agreementInput, agreementError);

    Object.keys(touched).forEach((key) => {
      touched[key] = false;
    });

    openSuccessModal();
    isSubmitting = false;
  });
});

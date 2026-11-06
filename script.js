(function () {
  const API_BASE = "https://tanghiers-forecast-api.onrender.com";
  const STORAGE_KEY = "lottoforecast_offer";

  const DEFAULT_CONSENTS = {
    AGE: {
      version: "age-2026-10",
      text: "I confirm I am 18 years of age or older.",
    },
    PRIVACY: {
      version: "privacy-2026-10",
      text: "I have read the Privacy Policy.",
    },
  };

  const wantOfferBtn = document.getElementById("wantOfferBtn");
  const reconsiderBtn = document.getElementById("reconsiderBtn");
  const doneBtn = document.getElementById("doneBtn");
  const emailForm = document.getElementById("emailForm");
  const phoneForm = document.getElementById("phoneForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const countryCode = document.getElementById("countryCode");
  const phoneWrap = document.querySelector(".phone");
  const phoneSubmitBtn = document.getElementById("phoneSubmitBtn");
  const emailError = document.getElementById("emailError");
  const phoneError = document.getElementById("phoneError");
  const consentAge = document.getElementById("consentAge");
  const consentPrivacy = document.getElementById("consentPrivacy");
  const consentAgeText = document.getElementById("consentAgeText");
  const consentPrivacyText = document.getElementById("consentPrivacyText");
  const doneMessage = document.getElementById("doneMessage");

  const steps = {
    gate: document.getElementById("stepGate"),
    email: document.getElementById("stepEmail"),
    phone: document.getElementById("stepPhone"),
    done: document.getElementById("stepDone"),
    declined: document.getElementById("stepDeclined"),
  };

  const draft = { name: "", email: "" };
  let consentVersions = {
    age: DEFAULT_CONSENTS.AGE.version,
    privacy: DEFAULT_CONSENTS.PRIVACY.version,
  };

  function showStep(name) {
    Object.entries(steps).forEach(function ([key, el]) {
      const active = key === name;
      el.hidden = !active;
      el.classList.toggle("is-active", active);
    });

    document.querySelectorAll(".title").forEach(function (title) {
      title.removeAttribute("id");
    });
    const activeTitle = steps[name].querySelector(".title");
    if (activeTitle) activeTitle.id = "pageTitle";
  }

  function setError(el, message) {
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  function formatPhone(prefix, local) {
    const digits = local.replace(/\D/g, "");
    return prefix + " " + digits;
  }

  function saveLead(payload) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function getLead() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function applyConsents(data) {
    const age = data.AGE || DEFAULT_CONSENTS.AGE;
    const privacy = data.PRIVACY || DEFAULT_CONSENTS.PRIVACY;

    consentVersions = {
      age: age.version,
      privacy: privacy.version,
    };

    consentAgeText.textContent = age.text;
    consentPrivacyText.textContent = privacy.text;
  }

  async function loadConsents() {
    try {
      const res = await fetch(API_BASE + "/v1/legal/consents");
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.data) applyConsents(json.data);
    } catch {
      // Keep defaults if the consent endpoint is unavailable.
    }
  }

  async function joinWaitlist(payload) {
    const res = await fetch(API_BASE + "/v1/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok || (json && json.success === false)) {
      const message =
        (json &&
          (Array.isArray(json.message)
            ? json.message.join(" ")
            : json.message)) ||
        "Something went wrong. Please try again.";
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }

    return json;
  }

  wantOfferBtn.addEventListener("click", function () {
    showStep("email");
    nameInput.focus();
  });

  document.querySelectorAll("[data-decline]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep("declined");
    });
  });

  reconsiderBtn.addEventListener("click", function () {
    showStep("email");
    nameInput.focus();
  });

  doneBtn.addEventListener("click", function () {
    showStep("done");
  });

  [nameInput, emailInput].forEach(function (input) {
    input.addEventListener("input", function () {
      input.classList.remove("is-invalid");
      setError(emailError, "");
    });
  });

  phoneInput.addEventListener("input", function () {
    phoneWrap.classList.remove("is-invalid");
    setError(phoneError, "");
  });

  [consentAge, consentPrivacy].forEach(function (input) {
    input.addEventListener("change", function () {
      input.closest(".check").classList.remove("is-invalid");
      setError(phoneError, "");
    });
  });

  emailForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    nameInput.classList.remove("is-invalid");
    emailInput.classList.remove("is-invalid");
    setError(emailError, "");

    if (!name) {
      nameInput.classList.add("is-invalid");
      setError(emailError, "Enter your full name.");
      nameInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      emailInput.classList.add("is-invalid");
      setError(emailError, "Enter a valid email address.");
      emailInput.focus();
      return;
    }

    draft.name = name;
    draft.email = email.toLowerCase();
    showStep("phone");
    phoneInput.focus();
  });

  phoneForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const phone = phoneInput.value.trim();
    const ageOk = consentAge.checked;
    const privacyOk = consentPrivacy.checked;

    phoneWrap.classList.remove("is-invalid");
    consentAge.closest(".check").classList.remove("is-invalid");
    consentPrivacy.closest(".check").classList.remove("is-invalid");
    setError(phoneError, "");

    if (!isValidPhone(phone)) {
      phoneWrap.classList.add("is-invalid");
      setError(phoneError, "Enter a valid phone number.");
      phoneInput.focus();
      return;
    }

    if (!ageOk || !privacyOk) {
      if (!ageOk) consentAge.closest(".check").classList.add("is-invalid");
      if (!privacyOk) consentPrivacy.closest(".check").classList.add("is-invalid");
      setError(phoneError, "Please accept the required consents.");
      return;
    }

    const selected = countryCode.options[countryCode.selectedIndex];
    const payload = {
      name: draft.name,
      email: draft.email,
      phone: formatPhone(countryCode.value, phone),
      countryCode: selected.getAttribute("data-iso") || "US",
      consents: {
        age: consentVersions.age,
        privacy: consentVersions.privacy,
      },
    };

    phoneSubmitBtn.disabled = true;
    phoneSubmitBtn.textContent = "Saving…";

    try {
      const result = await joinWaitlist(payload);
      const message =
        (result && result.data && result.data.message) ||
        "You're on the list. Check your email.";

      saveLead({
        ...payload,
        claimedAt: new Date().toISOString(),
      });

      doneMessage.textContent = message;
      showStep("done");
    } catch (error) {
      setError(
        phoneError,
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      phoneSubmitBtn.disabled = false;
      phoneSubmitBtn.textContent = "Stay in touch";
    }
  });

  loadConsents();

  const existing = getLead();
  if (existing) {
    if (existing.email) {
      doneMessage.textContent = "You're on the list. Check your email.";
    }
    showStep("done");
  } else {
    showStep("gate");
  }
})();

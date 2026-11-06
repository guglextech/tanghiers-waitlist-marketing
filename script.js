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
  const consentForm = document.getElementById("consentForm");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const countryCode = document.getElementById("countryCode");
  const phoneWrap = document.querySelector(".phone");
  const consentSubmitBtn = document.getElementById("consentSubmitBtn");
  const emailError = document.getElementById("emailError");
  const phoneError = document.getElementById("phoneError");
  const consentError = document.getElementById("consentError");
  const consentAge = document.getElementById("consentAge");
  const consentPrivacy = document.getElementById("consentPrivacy");
  const consentAgeText = document.getElementById("consentAgeText");
  const consentPrivacyText = document.getElementById("consentPrivacyText");
  const doneMessage = document.getElementById("doneMessage");

  const steps = {
    gate: document.getElementById("stepGate"),
    email: document.getElementById("stepEmail"),
    phone: document.getElementById("stepPhone"),
    consents: document.getElementById("stepConsents"),
    done: document.getElementById("stepDone"),
    declined: document.getElementById("stepDeclined"),
  };

  const draft = { email: "", phone: "", countryCode: "US", phonePrefix: "+1" };
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
    return prefix + " " + local.replace(/\D/g, "");
  }

  function nameFromEmail(email) {
    const local = email.split("@")[0] || "Guest";
    return local
      .replace(/[._+-]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ") || "Guest";
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
    emailInput.focus();
  });

  document.querySelectorAll("[data-decline]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep("declined");
    });
  });

  reconsiderBtn.addEventListener("click", function () {
    showStep("email");
    emailInput.focus();
  });

  doneBtn.addEventListener("click", function () {
    showStep("done");
  });

  emailInput.addEventListener("input", function () {
    emailInput.classList.remove("is-invalid");
    setError(emailError, "");
  });

  phoneInput.addEventListener("input", function () {
    phoneWrap.classList.remove("is-invalid");
    setError(phoneError, "");
  });

  [consentAge, consentPrivacy].forEach(function (input) {
    input.addEventListener("change", function () {
      input.closest(".toggle").classList.remove("is-invalid");
      setError(consentError, "");
    });
  });

  emailForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    emailInput.classList.remove("is-invalid");
    setError(emailError, "");

    if (!isValidEmail(email)) {
      emailInput.classList.add("is-invalid");
      setError(emailError, "Enter a valid email address.");
      emailInput.focus();
      return;
    }

    draft.email = email.toLowerCase();
    showStep("phone");
    phoneInput.focus();
  });

  phoneForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const phone = phoneInput.value.trim();
    phoneWrap.classList.remove("is-invalid");
    setError(phoneError, "");

    if (!isValidPhone(phone)) {
      phoneWrap.classList.add("is-invalid");
      setError(phoneError, "Enter a valid phone number.");
      phoneInput.focus();
      return;
    }

    const selected = countryCode.options[countryCode.selectedIndex];
    draft.phone = formatPhone(countryCode.value, phone);
    draft.phonePrefix = countryCode.value;
    draft.countryCode = selected.getAttribute("data-iso") || "US";

    showStep("consents");
  });

  consentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const ageOk = consentAge.checked;
    const privacyOk = consentPrivacy.checked;

    consentAge.closest(".toggle").classList.remove("is-invalid");
    consentPrivacy.closest(".toggle").classList.remove("is-invalid");
    setError(consentError, "");

    if (!ageOk || !privacyOk) {
      if (!ageOk) consentAge.closest(".toggle").classList.add("is-invalid");
      if (!privacyOk) {
        consentPrivacy.closest(".toggle").classList.add("is-invalid");
      }
      setError(consentError, "Turn on both toggles to continue.");
      return;
    }

    const payload = {
      name: nameFromEmail(draft.email),
      email: draft.email,
      phone: draft.phone,
      countryCode: draft.countryCode,
      consents: {
        age: consentVersions.age,
        privacy: consentVersions.privacy,
      },
    };

    consentSubmitBtn.disabled = true;
    consentSubmitBtn.textContent = "Saving…";

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
        consentError,
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      consentSubmitBtn.disabled = false;
      consentSubmitBtn.textContent = "Stay in touch";
    }
  });

  loadConsents();

  const existing = getLead();
  if (existing) {
    doneMessage.textContent = "You're on the list. Check your email.";
    showStep("done");
  } else {
    showStep("gate");
  }
})();

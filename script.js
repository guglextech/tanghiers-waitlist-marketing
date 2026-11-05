(function () {
  const STORAGE_KEY = "lottoforecast_offer";

  const wantOfferBtn = document.getElementById("wantOfferBtn");
  const reconsiderBtn = document.getElementById("reconsiderBtn");
  const skipPhoneBtn = document.getElementById("skipPhoneBtn");
  const doneBtn = document.getElementById("doneBtn");
  const emailForm = document.getElementById("emailForm");
  const phoneForm = document.getElementById("phoneForm");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const countryCode = document.getElementById("countryCode");
  const phoneWrap = document.querySelector(".phone");
  const phoneSubmitBtn = document.getElementById("phoneSubmitBtn");
  const emailError = document.getElementById("emailError");
  const phoneError = document.getElementById("phoneError");

  const steps = {
    gate: document.getElementById("stepGate"),
    email: document.getElementById("stepEmail"),
    phone: document.getElementById("stepPhone"),
    done: document.getElementById("stepDone"),
    declined: document.getElementById("stepDeclined"),
  };

  let draftEmail = "";

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

  skipPhoneBtn.addEventListener("click", function () {
    saveLead({
      email: draftEmail,
      phone: null,
      claimedAt: new Date().toISOString(),
    });
    showStep("done");
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

    draftEmail = email.toLowerCase();
    showStep("phone");
    phoneInput.focus();
  });

  phoneForm.addEventListener("submit", async function (event) {
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

    phoneSubmitBtn.disabled = true;
    phoneSubmitBtn.textContent = "Saving…";

    // Hook for Formspree / Netlify Forms / your API:
    // await fetch("https://formspree.io/f/your-id", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", Accept: "application/json" },
    //   body: JSON.stringify({
    //     email: draftEmail,
    //     phone: countryCode.value + " " + phone,
    //   }),
    // });

    await new Promise(function (resolve) {
      window.setTimeout(resolve, 450);
    });

    saveLead({
      email: draftEmail,
      phone: countryCode.value + " " + phone,
      claimedAt: new Date().toISOString(),
    });

    phoneSubmitBtn.disabled = false;
    phoneSubmitBtn.textContent = "Stay in touch";
    showStep("done");
  });

  const existing = getLead();
  showStep(existing ? "done" : "gate");
})();

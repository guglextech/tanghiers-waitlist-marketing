(function () {
  const STORAGE_KEY = "lottoforecast_offer";

  const wantOfferBtn = document.getElementById("wantOfferBtn");
  const declineGateBtn = document.getElementById("declineGateBtn");
  const declineClaimBtn = document.getElementById("declineClaimBtn");
  const reconsiderBtn = document.getElementById("reconsiderBtn");
  const doneBtn = document.getElementById("doneBtn");
  const claimForm = document.getElementById("claimForm");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const countryCode = document.getElementById("countryCode");
  const phoneWrap = document.querySelector(".phone");
  const submitBtn = document.getElementById("submitBtn");
  const formError = document.getElementById("formError");

  const steps = {
    gate: document.getElementById("stepGate"),
    claim: document.getElementById("stepClaim"),
    done: document.getElementById("stepDone"),
    declined: document.getElementById("stepDeclined"),
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

  function setError(message) {
    if (!message) {
      formError.hidden = true;
      formError.textContent = "";
      return;
    }
    formError.hidden = false;
    formError.textContent = message;
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
    showStep("claim");
    emailInput.focus();
  });

  declineGateBtn.addEventListener("click", function () {
    showStep("declined");
  });

  declineClaimBtn.addEventListener("click", function () {
    showStep("declined");
  });

  reconsiderBtn.addEventListener("click", function () {
    showStep("claim");
    emailInput.focus();
  });

  doneBtn.addEventListener("click", function () {
    showStep("done");
  });

  emailInput.addEventListener("input", function () {
    emailInput.classList.remove("is-invalid");
    setError("");
  });

  phoneInput.addEventListener("input", function () {
    phoneWrap.classList.remove("is-invalid");
    setError("");
  });

  claimForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    let valid = true;

    emailInput.classList.remove("is-invalid");
    phoneWrap.classList.remove("is-invalid");
    setError("");

    if (!isValidEmail(email)) {
      emailInput.classList.add("is-invalid");
      valid = false;
    }

    if (!isValidPhone(phone)) {
      phoneWrap.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) {
      setError("Enter a valid email and phone number.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Claiming…";

    // Hook for Formspree / Netlify Forms / your API:
    // await fetch("https://formspree.io/f/your-id", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", Accept: "application/json" },
    //   body: JSON.stringify({ email, phone: countryCode.value + " " + phone }),
    // });

    await new Promise(function (resolve) {
      window.setTimeout(resolve, 500);
    });

    saveLead({
      email: email.toLowerCase(),
      phone: countryCode.value + " " + phone,
      claimedAt: new Date().toISOString(),
    });

    submitBtn.disabled = false;
    submitBtn.textContent = "Reveal my offer";
    showStep("done");
  });

  const existing = getLead();
  showStep(existing ? "done" : "gate");
})();

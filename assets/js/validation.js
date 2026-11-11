(function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const SKIP_TYPES = ["hidden", "submit", "button", "reset", "image"];

  const style = document.createElement("style");
  style.textContent =
    ".field-error{margin:0;color:#a9523e;font-size:12px;line-height:1.4}" +
    "[aria-invalid='true']{border-color:#e5654b!important;background:#fff7f5!important}" +
    "input[type='checkbox'][aria-invalid='true']{outline:2px solid #e5654b;outline-offset:1px}";
  document.head.appendChild(style);

  function labelFor(field) {
    const label = field.id && field.form.querySelector('label[for="' + field.id + '"]');
    const text = (label ? label.textContent : field.getAttribute("aria-label") || "This field").trim();
    return text.replace(/[:*]\s*$/, "");
  }

  function getMessage(field) {
    const isCheckbox = field.type === "checkbox";
    const value = isCheckbox ? "" : field.value.trim();
    const name = labelFor(field);

    if (field.required) {
      if (isCheckbox && !field.checked) return "Please accept to continue.";
      if (!isCheckbox && !value) {
        return field.tagName === "SELECT" ? "Choose an option for " + name.toLowerCase() + "." : name + " is required.";
      }
    }
    if (isCheckbox || !value) return "";

    if (field.type === "email" && !EMAIL_RE.test(value)) {
      return "Enter a valid email address, like you@example.com.";
    }
    if (field.type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) return "Enter a valid number.";
      if (field.min !== "" && num < Number(field.min)) return name + " must be at least " + field.min + ".";
      if (field.max !== "" && num > Number(field.max)) return name + " must be " + field.max + " or less.";
    }
    const min = Number(field.getAttribute("minlength"));
    if (min && value.length < min) return name + " must be at least " + min + " characters.";
    const max = Number(field.getAttribute("maxlength"));
    if (max && value.length > max) return name + " must be " + max + " characters or fewer.";
    const pattern = field.getAttribute("pattern");
    if (pattern && !new RegExp("^(?:" + pattern + ")$").test(value)) {
      return field.dataset.error || field.title || name + " is not in the right format.";
    }
    if (field.dataset.match) {
      const other = field.form.querySelector(field.dataset.match);
      if (other && field.value !== other.value) return "Passwords do not match.";
    }
    return "";
  }

  function errorEl(field) {
    const id = (field.id || field.name || "field") + "-error";
    let el = field.form.querySelector('[data-error-for="' + id + '"]');
    if (!el) {
      el = document.createElement("p");
      el.className = "field-error";
      el.id = id;
      el.dataset.errorFor = id;
      el.setAttribute("role", "alert");
      el.hidden = true;
      const anchor = field.type === "checkbox" ? field.closest("label") || field : field;
      anchor.insertAdjacentElement("afterend", el);
    }
    return el;
  }

  function validateField(field) {
    const message = getMessage(field);
    const el = errorEl(field);
    el.textContent = message;
    el.hidden = !message;
    if (message) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", el.id);
    } else {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }
    return !message;
  }

  function fieldsOf(form) {
    return [...form.elements].filter((f) => /^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName) && !SKIP_TYPES.includes(f.type));
  }

  function setup(form) {
    if (form.dataset.validationReady) return;
    form.dataset.validationReady = "1";
    form.noValidate = true;
  }

  function formOf(event) {
    const field = event.target;
    return field && field.form && field.matches && field.matches("input,select,textarea") ? field : null;
  }

  document.querySelectorAll("form").forEach(setup);

  document.addEventListener("focusout", (event) => {
    const field = formOf(event);
    if (!field || SKIP_TYPES.includes(field.type)) return;
    setup(field.form);
    field.dataset.touched = "1";
    validateField(field);
  });

  function live(event) {
    const field = formOf(event);
    if (!field || SKIP_TYPES.includes(field.type)) return;
    if (field.dataset.touched) validateField(field);
    // Re-check fields that depend on this one (e.g. confirm password).
    fieldsOf(field.form).forEach((other) => {
      if (other.dataset.match && other.dataset.touched && field.matches(other.dataset.match)) validateField(other);
    });
  }
  document.addEventListener("input", live);
  document.addEventListener("change", live);

  // Capture phase: block page-specific submit handlers when the form is invalid.
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!form || form.tagName !== "FORM") return;
      setup(form);
      const fields = fieldsOf(form);
      fields.forEach((f) => (f.dataset.touched = "1"));
      const invalid = fields.filter((f) => !validateField(f));
      const callout = form.querySelector("[data-form-error]");
      if (invalid.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (callout) callout.hidden = false;
        invalid[0].focus();
        if (typeof showToast === "function") showToast("Please fix the highlighted fields.", "error");
      } else if (callout) {
        callout.hidden = true;
      }
    },
    true
  );
})();

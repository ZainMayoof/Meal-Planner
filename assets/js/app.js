function showToast(message, type) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast show" + (type === "error" ? " error" : "");
  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(() => { toast.className = "toast"; }, 3200);
}

function getUserName() {
  return localStorage.getItem("cooked:user-name") || "Cooked user";
}

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "CU";
}

document.querySelectorAll("[data-user-avatar]").forEach((avatar) => {
  avatar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1"/></svg>';
  avatar.setAttribute("aria-label", `${getUserName()} profile`);
});

document.querySelectorAll("[data-user-name]").forEach((element) => {
  element.textContent = getUserName();
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches(".list-row input")) {
    input.closest(".list-row").classList.toggle("checked", input.checked);
    showToast(input.checked ? "Added to your used items." : "Item returned to your list.");
  }
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-toast],[data-modal-open],[data-modal-close]");
  if (!target) return;
  if (target.dataset.toast) showToast(target.dataset.toast, target.dataset.toastType);
  if (target.dataset.modalOpen) document.getElementById(target.dataset.modalOpen)?.classList.add("open");
  if (target.dataset.modalClose) target.closest(".modal")?.classList.remove("open");
});

document.querySelectorAll("[data-modal-close]").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".modal")?.classList.remove("open");
  });
});

document.querySelectorAll("form[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const required = [...form.querySelectorAll("[required]")];
    const invalid = required.find((field) => !field.value.trim());
    const error = form.querySelector("[data-form-error]");
    if (invalid) {
      invalid.focus();
      if (error) error.hidden = false;
      showToast("Please complete the highlighted fields.", "error");
      return;
    }
    if (error) error.hidden = true;
    showToast(form.dataset.success || "Saved successfully.");
    form.closest(".modal")?.classList.remove("open");
  });
});

const search = document.querySelector("[data-recipe-search]");
if (search) {
  const cards = [...document.querySelectorAll("[data-recipe-card]")];
  search.addEventListener("input", () => {
    const query = search.value.toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const match = card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    });
    document.querySelector("[data-no-results]")?.toggleAttribute("hidden", visible !== 0);
  });
}


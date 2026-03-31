(function () {
  const AppData = window.AppData;

  function initials(name) {
    return name.split(" ").map((part) => part[0] || "").slice(0, 2).join("").toUpperCase();
  }

  function formatDate(dateIso) {
    return new Date(dateIso).toLocaleDateString();
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderUserSummaryCard(user) {
    if (!user) {
      return `<div class="empty-state">No active user selected.</div>`;
    }

    const activeMatch = AppData.getActiveMatchForUser(user.id);
    return `
      <div class="profile-top">
        <div>
          <p class="profile-name">${user.name}, ${user.age}</p>
          <p class="profile-meta">${user.city} · ${AppData.formatIntent(user.intent)} · ${user.verified ? "ID verified" : "Unverified"}</p>
        </div>
        <div class="avatar">${initials(user.name)}</div>
      </div>
      <p class="small-copy">${user.bio}</p>
      <div class="meta-row">
        <span class="status-pill">${activeMatch ? "Matched" : "Available"}</span>
        <span class="heart-badge">Shun ${user.shunCount}</span>
      </div>
    `;
  }

  function renderLikeList(container, likes) {
    container.innerHTML = "";
    if (!likes.length) {
      container.innerHTML = `<div class="empty-state">No incoming likes yet.</div>`;
      return;
    }

    likes.forEach(({ swipe, user }) => {
      const row = createElement("div", "like-row");
      row.innerHTML = `
        <div>
          <p class="profile-name">${user.name}</p>
          <p class="profile-meta">${user.age} · ${user.city} · ${AppData.formatIntent(user.intent)}</p>
        </div>
        <span class="interest-pill">${swipe.interestScore}/10 interest</span>
      `;
      container.appendChild(row);
    });
  }

  function setPageChip(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function injectExperienceRibbon() {
    const pageShell = document.querySelector(".page-shell");
    const siteHeader = document.querySelector(".site-header");
    if (!pageShell || !siteHeader || document.getElementById("experience-ribbon")) return;

    const user = AppData.currentUser();
    const activeMatch = user ? AppData.getActiveMatchForUser(user.id) : null;
    const ribbon = document.createElement("section");
    ribbon.id = "experience-ribbon";
    ribbon.className = "experience-ribbon";

    ribbon.innerHTML = user
      ? `
        <div class="ribbon-main">
          <div class="ribbon-avatar">${initials(user.name)}</div>
          <div>
            <p class="ribbon-title">${user.name}</p>
            <p class="ribbon-copy">${AppData.formatIntent(user.intent)} pool · ${activeMatch ? "Active match in progress" : "Available to browse"}</p>
          </div>
        </div>
        <div class="ribbon-actions">
          <a class="ghost-link" href="dashboard.html">Overview</a>
          <a class="ghost-link" href="browse.html">Browse</a>
          <a class="ghost-link" href="match.html">Match Flow</a>
        </div>
      `
      : `
        <div class="ribbon-main">
          <div>
            <p class="ribbon-title">No active profile selected</p>
            <p class="ribbon-copy">Open Studio to create profiles, switch users, or seed the experience.</p>
          </div>
        </div>
        <div class="ribbon-actions">
          <a class="ghost-link" href="admin.html">Open Studio</a>
        </div>
      `;

    pageShell.insertBefore(ribbon, pageShell.firstChild);
  }

  function initHamburgerMenu() {
    const nav = document.querySelector(".site-nav");
    const toggle = document.querySelector(".menu-toggle");
    if (!nav || !toggle) return;

    function closeMenu() {
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
      const opening = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", opening);
      toggle.setAttribute("aria-expanded", opening ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function ensureOverlayRoot() {
    let root = document.getElementById("ui-overlay-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "ui-overlay-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function closeModal() {
    const root = ensureOverlayRoot();
    root.innerHTML = "";
  }

  function showModal(options) {
    const root = ensureOverlayRoot();
    root.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-head">
            <h3>${options.title || "Notice"}</h3>
            <button class="modal-close" type="button" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">${options.body || ""}</div>
          <div class="modal-actions">
            ${options.secondaryLabel ? `<button class="ghost-button" type="button" data-modal-action="secondary">${options.secondaryLabel}</button>` : ""}
            <button class="${options.primaryClass || "primary-button"}" type="button" data-modal-action="primary">${options.primaryLabel || "Continue"}</button>
          </div>
        </div>
      </div>
    `;

    root.querySelector(".modal-close")?.addEventListener("click", closeModal);
    root.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) {
        closeModal();
      }
    });
    root.querySelector("[data-modal-action='secondary']")?.addEventListener("click", () => {
      closeModal();
      if (options.onSecondary) options.onSecondary();
    });
    root.querySelector("[data-modal-action='primary']")?.addEventListener("click", () => {
      closeModal();
      if (options.onPrimary) options.onPrimary();
    });
  }

  function confirmAction(options) {
    showModal({
      title: options.title,
      body: options.body,
      primaryLabel: options.primaryLabel || "Confirm",
      secondaryLabel: options.secondaryLabel || "Cancel",
      primaryClass: options.primaryClass || "primary-button",
      onPrimary: options.onConfirm,
      onSecondary: options.onCancel,
    });
  }

  function showToast(message) {
    const root = ensureOverlayRoot();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 220);
    }, 2200);
  }

  function renderEntryState(options) {
    return `
      <div class="entry-state">
        <div class="entry-state-copy">
          <p class="entry-kicker">${options.kicker || "Get started"}</p>
          <h3>${options.title}</h3>
          <p>${options.copy}</p>
        </div>
        ${options.steps && options.steps.length ? `
          <div class="entry-steps">
            ${options.steps.map((step, index) => `
              <div class="entry-step">
                <span>${index + 1}</span>
                <strong>${step}</strong>
              </div>
            `).join("")}
          </div>
        ` : ""}
        <div class="cta-row">
          <a class="primary-link" href="${options.primaryHref || "create-account.html"}">${options.primaryLabel || "Create Account"}</a>
          ${options.secondaryHref ? `<a class="ghost-link" href="${options.secondaryHref}">${options.secondaryLabel || "Open Studio"}</a>` : ""}
        </div>
      </div>
    `;
  }

  window.AppUI = {
    initials,
    formatDate,
    createElement,
    renderUserSummaryCard,
    renderLikeList,
    setPageChip,
    injectExperienceRibbon,
    showModal,
    closeModal,
    confirmAction,
    showToast,
    renderEntryState,
  };

  initHamburgerMenu();
})();

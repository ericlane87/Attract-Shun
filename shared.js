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

  function photoTheme(name) {
    let hash = 0;
    for (let index = 0; index < name.length; index += 1) {
      hash = name.charCodeAt(index) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const hue2 = (hue + 42) % 360;
    return {
      start: `hsl(${hue} 45% 42%)`,
      end: `hsl(${hue2} 48% 22%)`,
      glow: `hsla(${hue2} 70% 72% / 0.22)`,
    };
  }

  function renderProfilePhoto(user, className = "profile-photo", variant = 0) {
    const theme = photoTheme(user.name || "Profile");
    const shift = variant * 11;
    const style = `--photo-start:${theme.start};--photo-end:${theme.end};--photo-glow:${theme.glow};--photo-shift:${shift}px;`;
    return `
      <div class="${className}" style="${style}" aria-hidden="true">
        <div class="profile-photo-orb"></div>
        <div class="profile-photo-bust"></div>
        <span class="profile-photo-badge">${initials(user.name || "P")}</span>
      </div>
    `;
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
          <p class="profile-meta">${user.city} · ${user.sex || "Unspecified"} · ${AppData.formatIntent(user.intent)} · ${user.verified ? "ID verified" : "Unverified"}</p>
        </div>
        <div class="avatar">${initials(user.name)}</div>
      </div>
      <p class="small-copy">${user.bio}</p>
      <div class="meta-row">
        <span class="status-pill">${activeMatch ? "Matched" : "Available"}</span>
        <button class="heart-badge shun-breakdown-button" type="button" data-shun-user-id="${user.id}">Shun ${user.shunCount}</button>
      </div>
      <p class="small-copy">${user.email || "No login email assigned."}</p>
    `;
  }

  function shunLabel(category) {
    return ({
      intro_timeout: "Missed intro video deadline",
      date_timeout: "Missed date planning deadline",
      decision_shun: "Negative final match outcome",
      unmatch_not_mutual: "Unmatch was not mutual",
      unmatch_no_response: "Did not respond to unmatch request",
      moderation: "Moderation or report action",
    })[category] || category;
  }

  function ensureShunModal() {
    let modal = document.getElementById("shun-breakdown-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "shun-breakdown-modal";
    modal.className = "profile-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="profile-modal-shell">
        <button id="shun-breakdown-close" class="ghost-button modal-close" type="button">Close</button>
        <div id="shun-breakdown-card" class="panel-card profile-modal-card"></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("shun-breakdown-close").addEventListener("click", closeShunModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeShunModal();
    });
    return modal;
  }

  function closeShunModal() {
    const modal = document.getElementById("shun-breakdown-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openShunBreakdown(userId) {
    const user = AppData.getUser(userId);
    if (!user) return;
    const modal = ensureShunModal();
    const card = document.getElementById("shun-breakdown-card");
    const entries = Object.entries(user.shunBreakdown || {})
      .filter(([, count]) => Number(count) > 0);

    card.innerHTML = `
      <div class="stack">
        <div class="profile-top">
          <div>
            <p class="profile-name">${user.name}</p>
            <p class="profile-meta">Shun breakdown</p>
          </div>
          <span class="heart-badge">Shun ${user.shunCount}</span>
        </div>
        ${entries.length ? `
          <div class="stack">
            ${entries.map(([category, count]) => `
              <div class="like-row">
                <div>
                  <p class="profile-name">${shunLabel(category)}</p>
                </div>
                <span class="interest-pill">${count}</span>
              </div>
            `).join("")}
          </div>
        ` : `<div class="empty-state">No shuns recorded for this profile.</div>`}
      </div>
    `;

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function bindShunBreakdownTriggers(root = document) {
    root.querySelectorAll("[data-shun-user-id]").forEach((button) => {
      if (button.dataset.shunBound === "true") return;
      button.dataset.shunBound = "true";
      button.addEventListener("click", () => openShunBreakdown(button.dataset.shunUserId));
    });
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

  function initSessionControls() {
    const nav = document.querySelector(".site-nav");
    if (!nav || !window.AppAuth || !AppData.isAuthenticated()) return;
    const currentUser = AppData.currentUser();
    const notificationCount = currentUser ? AppData.getNotificationsForUser(currentUser.id).length : 0;

    if (!nav.querySelector("[data-notifications-link]")) {
      const notificationsLink = document.createElement("a");
      notificationsLink.href = "notifications.html";
      notificationsLink.dataset.notificationsLink = "true";
      notificationsLink.innerHTML = `Notifications${notificationCount ? ` <span class="nav-count">${notificationCount}</span>` : ""}`;
      nav.appendChild(notificationsLink);
    }

    if (!nav.querySelector("[data-messages-link]")) {
      const messagesLink = document.createElement("a");
      messagesLink.href = "messages.html";
      messagesLink.dataset.messagesLink = "true";
      messagesLink.textContent = "Messages";
      nav.appendChild(messagesLink);
    }

    if (!nav.querySelector("[data-likes-link]")) {
      const likesLink = document.createElement("a");
      likesLink.href = "likes.html";
      likesLink.dataset.likesLink = "true";
      likesLink.textContent = "Likes";
      nav.appendChild(likesLink);
    }

    if (!nav.querySelector("[data-match-requests-link]")) {
      const requestsLink = document.createElement("a");
      requestsLink.href = "match-requests.html";
      requestsLink.dataset.matchRequestsLink = "true";
      requestsLink.textContent = "Match Requests";
      nav.appendChild(requestsLink);
    }

    if (nav.querySelector("[data-logout-button]")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost-button nav-button";
    button.dataset.logoutButton = "true";
    button.textContent = "Logout";
    button.addEventListener("click", () => {
      window.AppAuth.logoutAndRedirect();
    });
    nav.appendChild(button);
  }

  window.AppUI = {
    initials,
    formatDate,
    createElement,
    renderProfilePhoto,
    renderUserSummaryCard,
    renderLikeList,
    setPageChip,
    initSessionControls,
    openShunBreakdown,
    bindShunBreakdownTriggers,
  };

  initSessionControls();
  bindShunBreakdownTriggers();
})();

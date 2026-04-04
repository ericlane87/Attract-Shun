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
        <span class="heart-badge">Shun ${user.shunCount}</span>
      </div>
      <p class="small-copy">${user.email || "No login email assigned."}</p>
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

  function initSessionControls() {
    const nav = document.querySelector(".site-nav");
    if (!nav || !window.AppAuth || !AppData.isAuthenticated()) return;
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
  };

  initSessionControls();
})();

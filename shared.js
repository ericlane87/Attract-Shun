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

  window.AppUI = {
    initials,
    formatDate,
    createElement,
    renderUserSummaryCard,
    renderLikeList,
    setPageChip,
  };
})();

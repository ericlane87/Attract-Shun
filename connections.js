(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("connections-user-chip", user ? `${user.name}'s connections` : "No active user");

  const activePanel = document.getElementById("active-connection-panel");
  const historyPanel = document.getElementById("connection-history");

  if (!user) {
    activePanel.innerHTML = `<div class="empty-state">Open <a href="create-account.html">Create Account</a> or <a href="admin.html">Studio</a> to start.</div>`;
    historyPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  if (!activeMatch) {
    activePanel.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">No active connection</p>
        <p class="profile-meta">This account is not currently in an active match.</p>
        <div class="cta-row">
          <a class="primary-link" href="browse.html">Browse Matches</a>
        </div>
      </div>
    `;
  } else {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    activePanel.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">${otherUser.name}</p>
        <p class="profile-meta">${activeMatch.status.replace("_", " ")} · One active conversation</p>
        <div class="journey-card compact">
          <div class="journey-step done"><span>1</span><strong>Match</strong></div>
          <div class="journey-step ${activeMatch.status === "pending_intro" ? "active" : "done"}"><span>2</span><strong>Intro</strong></div>
          <div class="journey-step ${activeMatch.status === "date_planning" ? "active" : activeMatch.status === "decision_window" ? "done" : ""}"><span>3</span><strong>Date</strong></div>
          <div class="journey-step ${activeMatch.status === "decision_window" ? "active" : ""}"><span>4</span><strong>Decision</strong></div>
        </div>
        <div class="cta-row">
          <a class="primary-link" href="match.html">Open Conversation</a>
        </div>
      </div>
    `;
  }

  const matches = AppData.getMatchesForUser(user.id);
  if (!matches.length) {
    historyPanel.innerHTML = `<div class="empty-state">No match history yet.</div>`;
    return;
  }

  historyPanel.innerHTML = "";
  matches.forEach((match) => {
    const otherUser = AppData.getOtherUser(match, user.id);
    const row = document.createElement("div");
    row.className = "summary-card";
    row.innerHTML = `
      <p class="profile-name">${otherUser ? otherUser.name : "Unknown"}</p>
      <p class="profile-meta">${match.status.replace("_", " ")} · ${match.closedReason || "In progress"}</p>
      <div class="cta-row">
        <a class="ghost-link" href="${["pending_intro","date_planning","decision_window"].includes(match.status) ? "match.html" : "browse.html"}">${["pending_intro","date_planning","decision_window"].includes(match.status) ? "Open Match" : "Browse Again"}</a>
      </div>
    `;
    historyPanel.appendChild(row);
  });
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("dashboard-user-chip", user ? `Viewing ${user.name}` : "No active user");

  const profileEl = document.getElementById("dashboard-profile");
  const statsEl = document.getElementById("dashboard-stats");
  const nextEl = document.getElementById("dashboard-next-step");
  const likesEl = document.getElementById("dashboard-likes");

  if (!user) {
    profileEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    statsEl.innerHTML = "";
    nextEl.innerHTML = `<div class="empty-state">No current user.</div>`;
    likesEl.innerHTML = `<div class="empty-state">No current user.</div>`;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  const likes = AppData.getIncomingLikes(user.id);

  profileEl.innerHTML = AppUI.renderUserSummaryCard(user);

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Pool</div>
      <div class="stat-value">${AppData.formatIntent(user.intent)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Incoming likes</div>
      <div class="stat-value">${likes.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Availability</div>
      <div class="stat-value">${activeMatch ? "Locked" : "Open"}</div>
    </div>
  `;

  if (!user.onboardingCompleted) {
    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Finish onboarding first</p>
        <p class="profile-meta">This account should complete profile and preference setup before entering discovery.</p>
        <div class="cta-row">
          <a class="primary-link" href="onboarding.html">Open Onboarding</a>
        </div>
      </div>
    `;
  } else if (!activeMatch) {
    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Ready to browse</p>
        <p class="profile-meta">This user has no active match. They can keep swiping inside the ${AppData.formatIntent(user.intent).toLowerCase()} pool.</p>
        <div class="cta-row">
          <a class="primary-link" href="browse.html">Go To Browse</a>
        </div>
      </div>
    `;
  } else {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    const nextLabel = activeMatch.status === "pending_intro"
      ? "Submit the intro video"
      : activeMatch.status === "date_planning"
        ? "Confirm the first date"
        : "Choose attract or shun";

    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Current match with ${otherUser.name}</p>
        <p class="profile-meta">${nextLabel}. Swiping is locked until this match closes.</p>
        <div class="cta-row">
          <a class="primary-link" href="match.html">Open Match Flow</a>
          <a class="ghost-link" href="reports.html">Safety Tools</a>
        </div>
      </div>
    `;
  }

  AppUI.renderLikeList(likesEl, likes);
})();

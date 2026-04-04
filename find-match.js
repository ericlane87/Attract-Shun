(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.setPageChip("find-match-user-chip", user ? `Matching as ${user.name}` : "No active user");

  const optionsEl = document.getElementById("find-match-options");

  if (!user) {
    optionsEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  if (!user.onboardingCompleted) {
    optionsEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Find a match is locked</p>
        <p class="profile-meta">${user.name} needs to complete onboarding before entering discovery.</p>
        <div class="cta-row">
          <a class="primary-link" href="onboarding.html">Complete Onboarding</a>
        </div>
      </div>
    `;
    return;
  }

  if (activeMatch) {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    optionsEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Active match already in progress</p>
        <p class="profile-meta">${user.name} is currently matched with ${otherUser.name}. Finish or exit that match before opening new discovery options.</p>
        <div class="cta-row">
          <a class="primary-link" href="match.html">Open Active Match</a>
        </div>
      </div>
    `;
    return;
  }

  optionsEl.innerHTML = `
    <div class="option-grid">
      <article class="option-card">
        <p class="eyebrow">Option 1</p>
        <h2>Browse Profiles</h2>
        <p class="profile-meta">Open the traditional grid-style dating site with multiple profiles laid out across rows and columns.</p>
        <div class="cta-row">
          <a class="primary-link" href="profiles.html">Open Browse Profiles</a>
        </div>
      </article>
      <article class="option-card">
        <p class="eyebrow">Option 2</p>
        <h2>Live Match</h2>
        <p class="profile-meta">This route is reserved for the separate live-match flow you want to define later.</p>
        <div class="cta-row">
          <a class="ghost-link" href="live-match.html">Open Live Match</a>
        </div>
      </article>
    </div>
  `;
})();

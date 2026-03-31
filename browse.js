(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("browse-user-chip", user ? `Browsing as ${user.name}` : "No active user");

  const swipePanel = document.getElementById("swipe-panel");
  const likesPanel = document.getElementById("incoming-likes-panel");

  if (!user) {
    swipePanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> and create or seed users first.</div>`;
    likesPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  AppUI.renderLikeList(likesPanel, AppData.getIncomingLikes(user.id));

  if (!user.onboardingCompleted) {
    swipePanel.innerHTML = `
      <div class="candidate-card">
        <p class="profile-name">Browse locked</p>
        <p class="profile-meta">${user.name} needs to complete onboarding before entering discovery.</p>
        <div class="cta-row">
          <a class="primary-link" href="onboarding.html">Complete Onboarding</a>
        </div>
      </div>
    `;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  if (activeMatch) {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    swipePanel.innerHTML = `
      <div class="candidate-card">
        <p class="profile-name">Swipe deck locked</p>
        <p class="profile-meta">${user.name} is currently matched with ${otherUser.name}. They must finish or exit that match before swiping again.</p>
        <div class="cta-row">
          <a class="primary-link" href="match.html">Open Active Match</a>
        </div>
      </div>
    `;
    return;
  }

  const candidate = AppData.getAvailableCandidates(user.id)[0];
  if (!candidate) {
    swipePanel.innerHTML = `
      <div class="candidate-card">
        <p class="profile-name">No candidates available</p>
        <p class="profile-meta">Create more users in the same intent pool or switch the active user.</p>
      </div>
    `;
    return;
  }

  swipePanel.innerHTML = `
    <div class="candidate-card">
      <div class="profile-top">
        <div>
          <p class="profile-name">${candidate.name}, ${candidate.age}</p>
          <p class="profile-meta">${candidate.city} · ${AppData.formatIntent(candidate.intent)} pool</p>
        </div>
        <div class="avatar">${AppUI.initials(candidate.name)}</div>
      </div>
      <p class="small-copy">${candidate.bio}</p>
      <div class="hint-box">A right swipe requires an interest score. If this person already liked you and both users are free, a match is created immediately.</div>
      <div class="stack">
        <label class="field">
          <span>Interest score</span>
          <input id="interest-range" type="range" min="1" max="10" value="7">
        </label>
        <div class="range-readout" id="interest-readout">7</div>
      </div>
      <div class="swipe-actions">
        <button class="pass-button" id="pass-btn" type="button">Pass</button>
        <button class="primary-button" id="like-btn" type="button">Swipe Right</button>
      </div>
    </div>
  `;

  const range = document.getElementById("interest-range");
  const readout = document.getElementById("interest-readout");
  range.addEventListener("input", () => {
    readout.textContent = range.value;
  });

  document.getElementById("pass-btn").addEventListener("click", () => {
    AppData.recordSwipe(user.id, candidate.id, "left");
    location.reload();
  });

  document.getElementById("like-btn").addEventListener("click", () => {
    AppData.recordSwipe(user.id, candidate.id, "right", Number(range.value));
    location.href = "match.html";
  });
})();

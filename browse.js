(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("browse-user-chip", user ? `Browsing as ${user.name}` : "No active user");

  const swipePanel = document.getElementById("swipe-panel");
  const likesPanel = document.getElementById("incoming-likes-panel");

  if (!user) {
    swipePanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Studio</a> and create or seed profiles first.</div>`;
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
      <div class="profile-rail">
        <span class="rail-pill">Intent aligned</span>
        <span class="rail-pill">One active match rule</span>
      </div>
      <div class="profile-top">
        <div>
          <p class="profile-name">${candidate.name}, ${candidate.age}</p>
          <p class="profile-meta">${candidate.city} · ${AppData.formatIntent(candidate.intent)} pool</p>
        </div>
        <div class="avatar">${AppUI.initials(candidate.name)}</div>
      </div>
      <p class="small-copy">${candidate.bio}</p>
      <div class="mini-journey">
        <div class="mini-node active">Discover</div>
        <div class="mini-line"></div>
        <div class="mini-node">Match</div>
        <div class="mini-line"></div>
        <div class="mini-node">Intro</div>
      </div>
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
    AppUI.showToast(`Passed on ${candidate.name}.`);
    setTimeout(() => location.reload(), 350);
  });

  document.getElementById("like-btn").addEventListener("click", () => {
    const match = AppData.recordSwipe(user.id, candidate.id, "right", Number(range.value));
    if (match) {
      AppUI.showModal({
        title: "It’s a match",
        body: `<p>${user.name} and ${candidate.name} are now in an active match.</p><p>The next step is the video introduction stage.</p>`,
        primaryLabel: "Open Match",
        onPrimary: () => {
          location.href = "match.html";
        },
      });
      return;
    }

    AppUI.showToast(`Interest sent to ${candidate.name}.`);
    setTimeout(() => location.reload(), 350);
  });
})();

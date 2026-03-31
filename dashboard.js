(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("dashboard-user-chip", user ? `Viewing ${user.name}` : "No active user");

  const profileEl = document.getElementById("dashboard-profile");
  const statsEl = document.getElementById("dashboard-stats");
  const nextEl = document.getElementById("dashboard-next-step");
  const likesEl = document.getElementById("dashboard-likes");

  if (!user) {
    profileEl.innerHTML = AppUI.renderEntryState({
      kicker: "Welcome in",
      title: "Start with a real profile",
      copy: "Create an account, finish your details, and enter the dating pool with a focused intent.",
      steps: ["Create account", "Complete onboarding", "Start matching"],
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
      secondaryHref: "admin.html",
      secondaryLabel: "View Demo Profiles",
    });
    statsEl.innerHTML = "";
    nextEl.innerHTML = AppUI.renderEntryState({
      kicker: "Next step",
      title: "Build your profile first",
      copy: "The dashboard comes alive once an account exists and has entered onboarding.",
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
    });
    likesEl.innerHTML = `<div class="empty-state">Incoming interest appears here after your account enters discovery.</div>`;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  const likes = AppData.getIncomingLikes(user.id);
  const latestMatch = AppData.getLatestMatchForUser(user.id);

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
    <div class="stat-card">
      <div class="stat-label">Latest result</div>
      <div class="stat-value">${latestMatch ? latestMatch.status.replace("_", " ") : "None"}</div>
    </div>
  `;

  if (!user.onboardingCompleted) {
    nextEl.innerHTML = `
      <div class="journey-card">
        <div class="journey-step active"><span>1</span><strong>Complete profile</strong></div>
        <div class="journey-step"><span>2</span><strong>Enter discovery</strong></div>
        <div class="journey-step"><span>3</span><strong>Start matching</strong></div>
      </div>
      <div class="summary-card">
        <p class="profile-name">Complete the setup</p>
        <p class="profile-meta">Finish profile and preference details before this account enters discovery.</p>
        <div class="cta-row">
          <a class="primary-link" href="onboarding.html">Finish Profile Setup</a>
        </div>
      </div>
    `;
  } else if (!activeMatch) {
    nextEl.innerHTML = `
      <div class="journey-card">
        <div class="journey-step done"><span>1</span><strong>Profile ready</strong></div>
        <div class="journey-step active"><span>2</span><strong>Discover</strong></div>
        <div class="journey-step"><span>3</span><strong>Match flow</strong></div>
      </div>
      <div class="summary-card">
        <p class="profile-name">Ready to browse</p>
        <p class="profile-meta">This account is open to people in the ${AppData.formatIntent(user.intent).toLowerCase()} pool.</p>
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
      <div class="journey-card">
        <div class="journey-step done"><span>1</span><strong>Matched</strong></div>
        <div class="journey-step ${activeMatch.status === "pending_intro" ? "active" : "done"}"><span>2</span><strong>Intro</strong></div>
        <div class="journey-step ${activeMatch.status === "date_planning" ? "active" : activeMatch.status === "decision_window" ? "done" : ""}"><span>3</span><strong>Date</strong></div>
        <div class="journey-step ${activeMatch.status === "decision_window" ? "active" : ""}"><span>4</span><strong>Decision</strong></div>
      </div>
      <div class="summary-card">
        <p class="profile-name">Current match with ${otherUser.name}</p>
        <p class="profile-meta">${nextLabel}. Swiping remains locked until this match closes.</p>
        <div class="cta-row">
          <a class="primary-link" href="match.html">Open Match Flow</a>
          <a class="ghost-link" href="reports.html">Safety Tools</a>
        </div>
      </div>
    `;
  }

  AppUI.renderLikeList(likesEl, likes);
})();

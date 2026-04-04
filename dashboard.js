(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("dashboard-user-chip", user ? `Viewing ${user.name}` : "No active user");

  const profileEl = document.getElementById("dashboard-profile");
  const statsEl = document.getElementById("dashboard-stats");
  const nextEl = document.getElementById("dashboard-next-step");
  const likesEl = document.getElementById("dashboard-likes");

  function getMatchStep(match) {
    if (!match) {
      return {
        key: "browse",
        title: "Browse for a match",
        detail: `No active match right now. ${user.name} should be in browse until a mutual right swipe creates a match.`,
        ctaLabel: "Go To Browse",
        ctaHref: "browse.html",
      };
    }

    if (match.status === "pending_intro") {
      return {
        key: "pending_intro",
        title: "Matched: intro video step",
        detail: "A match exists and both people need to complete the intro video requirement before the process can move forward.",
        ctaLabel: "Open Match Flow",
        ctaHref: "match.html",
      };
    }

    if (match.status === "date_planning") {
      return {
        key: "date_planning",
        title: "Matched: date planning step",
        detail: "The intro step is done. The next required action is confirming the first date.",
        ctaLabel: "Open Match Flow",
        ctaHref: "match.html",
      };
    }

    return {
      key: "decision_window",
      title: "Matched: attract or shun step",
      detail: "The date step is complete. The match is waiting for final outcome decisions.",
      ctaLabel: "Open Match Flow",
      ctaHref: "match.html",
    };
  }

  function renderFlowPanel(activeMatch, likes) {
    const steps = [
      {
        title: "Profile onboarding",
        detail: user.onboardingCompleted
          ? "Completed. This account can move through the app."
          : "Still incomplete. The user should finish onboarding before discovery.",
        state: user.onboardingCompleted ? "done" : "active",
      },
      {
        title: activeMatch ? "Match status" : "Browse status",
        detail: activeMatch
          ? `Active match with ${AppData.getOtherUser(activeMatch, user.id).name}. Swiping is locked while this match is live.`
          : `No active match. ${likes.length} incoming like${likes.length === 1 ? "" : "s"} waiting, but the user should browse for a mutual match.`,
        state: user.onboardingCompleted ? "active" : "",
      },
      {
        title: activeMatch ? "Current match step" : "Next destination",
        detail: getMatchStep(activeMatch).detail,
        state: user.onboardingCompleted ? "active" : "",
      },
    ];

    return `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Current mode</div>
          <div class="stat-value">${activeMatch ? "Match" : user.onboardingCompleted ? "Browse" : "Onboarding"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Incoming likes</div>
          <div class="stat-value">${likes.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Availability</div>
          <div class="stat-value">${activeMatch ? "Locked" : "Open"}</div>
        </div>
      </div>
      <div class="timeline">
        ${steps.map((step) => `
          <div class="timeline-row ${step.state}">
            <div>
              <strong>${step.title}</strong>
              <div class="small-copy">${step.detail}</div>
            </div>
            <span class="status-pill">${step.state === "done" ? "Done" : step.state === "active" ? "Current" : "Pending"}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

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
  statsEl.innerHTML = renderFlowPanel(activeMatch, likes);

  if (!user.onboardingCompleted) {
    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Current step: onboarding</p>
        <p class="profile-meta">This account is not ready for browse or match yet. Finish onboarding first.</p>
        <div class="cta-row">
          <a class="primary-link" href="onboarding.html">Open Onboarding</a>
        </div>
      </div>
    `;
  } else if (!activeMatch) {
    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Current step: find a match</p>
        <p class="profile-meta">This user has no active match. Open Find A Match for the grid-style dating page, or use Live Match when that separate flow is ready.</p>
        <div class="cta-row">
          <a class="primary-link" href="find-match.html">Find A Match</a>
          <a class="ghost-link" href="live-match.html">Live Match</a>
        </div>
      </div>
    `;
  } else {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    const step = getMatchStep(activeMatch);

    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">${step.title}</p>
        <p class="profile-meta">Matched with ${otherUser.name}. ${step.detail}</p>
        <div class="cta-row">
          <a class="primary-link" href="${step.ctaHref}">${step.ctaLabel}</a>
          <a class="ghost-link" href="reports.html">Safety Tools</a>
        </div>
      </div>
    `;
  }

  AppUI.renderLikeList(likesEl, likes);
})();

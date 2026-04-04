(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("dashboard-user-chip", user ? `Viewing ${user.name}` : "No active user");

  const profileEl = document.getElementById("dashboard-profile");
  const statsEl = document.getElementById("dashboard-stats");
  const nextEl = document.getElementById("dashboard-next-step");
  const likesEl = document.getElementById("dashboard-likes");

  function getMatchStep(match, likes, requests) {
    if (!match) {
      if (requests.length) {
        return {
          key: "match_requests",
          title: "Review match requests",
          detail: `${requests.length} pending match request${requests.length === 1 ? "" : "s"} need attention before browsing more people.`,
          ctaLabel: "Open Match Requests",
          ctaHref: "match-requests.html",
        };
      }

      if (likes.length) {
        return {
          key: "review_likes",
          title: "Review likes",
          detail: `${likes.length} people already liked this account. Review them and decide whether to send a match request.`,
          ctaLabel: "Open Likes",
          ctaHref: "likes.html",
        };
      }

      return {
        key: "browse",
        title: "Browse for a match",
        detail: `No active match, no pending likes to review, and no match requests waiting. ${user.name} should be in browse until new interest comes in.`,
        ctaLabel: "Find A Match",
        ctaHref: "profiles.html",
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

  function renderFlowPanel(activeMatch, likes, requests) {
    const nextStep = getMatchStep(activeMatch, likes, requests);
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
          : `No active match. ${likes.length} incoming like${likes.length === 1 ? "" : "s"} and ${requests.length} match request${requests.length === 1 ? "" : "s"} are waiting.`,
        state: user.onboardingCompleted ? "active" : "",
      },
      {
        title: activeMatch ? "Current match step" : "Next destination",
        detail: nextStep.detail,
        state: user.onboardingCompleted ? "active" : "",
      },
    ];

    return `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Current mode</div>
          <div class="stat-value">${activeMatch ? "Match" : user.onboardingCompleted ? "Browse" : "Onboarding"}</div>
        </div>
        <a class="stat-card" href="likes.html">
          <div class="stat-label">Incoming likes</div>
          <div class="stat-value">${likes.length}</div>
        </a>
        <a class="stat-card" href="match-requests.html">
          <div class="stat-label">Match requests</div>
          <div class="stat-value">${requests.length}</div>
        </a>
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
  const requests = AppData.getIncomingMatchRequests(user.id);

  profileEl.innerHTML = AppUI.renderUserSummaryCard(user);
  statsEl.innerHTML = renderFlowPanel(activeMatch, likes, requests);

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
    const step = getMatchStep(activeMatch, likes, requests);
    nextEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">${step.title}</p>
        <p class="profile-meta">${step.detail}</p>
        <div class="cta-row">
          <a class="primary-link" href="${step.ctaHref}">${step.ctaLabel}</a>
          <a class="ghost-link" href="profiles.html">Find A Match</a>
        </div>
      </div>
    `;
  } else {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    const step = getMatchStep(activeMatch, likes, requests);

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

  likesEl.innerHTML = `
    <div class="cta-row" style="margin-bottom: 16px;">
      <a class="ghost-link" href="likes.html">Review Likes</a>
      <a class="ghost-link" href="match-requests.html">Review Match Requests</a>
    </div>
  `;
  const listContainer = document.createElement("div");
  listContainer.className = "list-stack";
  likesEl.appendChild(listContainer);
  AppUI.renderLikeList(listContainer, likes);
})();

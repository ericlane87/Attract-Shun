(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("dashboard-user-chip", user ? `Viewing ${user.name}` : "No active user");

  const profileEl = document.getElementById("dashboard-profile");
  const statsEl = document.getElementById("dashboard-stats");
  const nextEl = document.getElementById("dashboard-next-step");
  const likesEl = document.getElementById("dashboard-likes");

  function formatTimeRemaining(deadlineIso) {
    if (!deadlineIso) return "No timer";
    const diffMs = new Date(deadlineIso).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";

    const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
    if (totalHours < 24) {
      return `${totalHours} hour${totalHours === 1 ? "" : "s"} left`;
    }

    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (!hours) {
      return `${days} day${days === 1 ? "" : "s"} left`;
    }
    return `${days}d ${hours}h left`;
  }

  function getStepTimer(match) {
    if (!match) {
      return {
        stepLabel: "No active step",
        deadlineLabel: "No active deadline",
        remaining: "Open",
      };
    }

    if (match.status === "pending_intro") {
      return {
        stepLabel: "Intro video",
        deadlineLabel: "24 hour intro deadline",
        remaining: formatTimeRemaining(match.introDeadline),
      };
    }

    if (match.status === "date_planning") {
      return {
        stepLabel: "Date planning",
        deadlineLabel: "2 week date deadline",
        remaining: formatTimeRemaining(match.dateDeadline),
      };
    }

    return {
      stepLabel: "Final decision",
      deadlineLabel: "Decision deadline",
      remaining: formatTimeRemaining(match.decisionDeadline),
    };
  }

  function getMatchStep(match, likes, requests) {
    const pendingUnmatch = AppData.getPendingUnmatchRequestForUser(user.id);

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

    if (pendingUnmatch) {
      const initiatedByMe = pendingUnmatch.initiatorId === user.id;
      return {
        key: initiatedByMe ? "unmatch_waiting" : "unmatch_response",
        title: initiatedByMe ? "Waiting on unmatch response" : "Respond to unmatch request",
        detail: initiatedByMe
          ? `You requested to unmatch. ${AppData.getOtherUser(match, user.id).name} has 24 hours to respond before they receive a Shun.`
          : `${AppData.getOtherUser(match, user.id).name} asked to unmatch. You have 24 hours to answer yes or no or you will receive a Shun.`,
        ctaLabel: "Open Match Flow",
        ctaHref: "match.html",
      };
    }

    if (match.status === "pending_intro") {
      return {
        key: "pending_intro",
        title: "Matched: intro video step",
        detail: `A match exists and both people must submit the intro video within 24 hours. Time left: ${formatTimeRemaining(match.introDeadline)}.`,
        ctaLabel: "Open Match Flow",
        ctaHref: "match.html",
      };
    }

    if (match.status === "date_planning") {
      const dateState = AppData.getDatePlanningState(match, user.id);
      return {
        key: "date_planning",
        title: dateState.title,
        detail: `${dateState.detail} Time left: ${formatTimeRemaining(match.dateDeadline)}.`,
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
    const stepTimer = getStepTimer(activeMatch);
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
        detail: activeMatch
          ? `${nextStep.detail} Current timer: ${stepTimer.remaining}.`
          : nextStep.detail,
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
          <div class="stat-label">Current step</div>
          <div class="stat-value">${activeMatch ? stepTimer.stepLabel : "Discovery"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${activeMatch ? stepTimer.deadlineLabel : "Timer"}</div>
          <div class="stat-value">${activeMatch ? stepTimer.remaining : "No active timer"}</div>
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
  AppUI.bindShunBreakdownTriggers(profileEl);
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

  if (activeMatch) {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    likesEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">Current match: ${otherUser.name}</p>
        <p class="profile-meta">Discovery is locked while this match is active. Focus stays on this one person until you complete the flow or unmatch.</p>
        <div class="cta-row">
          <a class="primary-link" href="match.html">Open Match Flow</a>
          <a class="ghost-link" href="messages.html">Open Messages</a>
        </div>
      </div>
    `;
  } else {
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
  }
})();

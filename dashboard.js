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
  const workflowHeading = document.getElementById("dashboard-workflow-heading");
  const sideHeading = document.getElementById("dashboard-side-heading");

  function formatStatusLabel(status) {
    return status.replaceAll("_", " ");
  }

  function renderMessages(messages, otherUser) {
    likesEl.innerHTML = `
      <div class="chat-wrap">
        <div class="chat-head">
          <div>
            <p class="profile-name">${otherUser.name}</p>
            <p class="profile-meta">Your only live conversation right now.</p>
          </div>
          <span class="status-pill">${messages.length} messages</span>
        </div>
        <div class="chat-log" id="dashboard-chat-log"></div>
        <div class="button-row">
          <button class="ghost-button" type="button" id="video-call-soon">Video Call Soon</button>
        </div>
        <form id="dashboard-chat-form" class="chat-compose">
          <input id="dashboard-chat-input" type="text" maxlength="240" placeholder="Send a message">
          <button class="primary-button" type="submit">Send</button>
        </form>
      </div>
    `;

    const log = document.getElementById("dashboard-chat-log");
    log.innerHTML = "";
    if (!messages.length) {
      log.innerHTML = `<div class="empty-state">No messages yet. Start with intention.</div>`;
    } else {
      messages.forEach((message) => {
        const row = document.createElement("div");
        row.className = `chat-message${message.senderId === user.id ? " mine" : ""}`;
        row.innerHTML = `
          <div class="chat-bubble">
            <strong>${message.senderId === user.id ? "You" : otherUser.name}</strong>
            <div>${message.text}</div>
            <div class="small-copy">${new Date(message.createdAt).toLocaleString()}</div>
          </div>
        `;
        log.appendChild(row);
      });
      log.scrollTop = log.scrollHeight;
    }

    document.getElementById("video-call-soon").addEventListener("click", () => {
      AppUI.showToast("Video calling is planned for a later phase.");
    });

    document.getElementById("dashboard-chat-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("dashboard-chat-input");
      const text = input.value.trim();
      if (!text) return;
      const activeMatch = AppData.getActiveMatchForUser(user.id);
      if (!activeMatch) return;
      AppData.sendMessage(activeMatch.id, user.id, text);
      input.value = "";
      renderActiveDashboard(activeMatch);
    });
  }

  function renderActiveDashboard(activeMatch) {
    const otherUser = AppData.getOtherUser(activeMatch, user.id);
    const likes = AppData.getIncomingLikes(user.id);
    const myIntro = Boolean(activeMatch.introVideos[user.id]);
    const myPlannedDate = activeMatch.plannedDateBy[user.id] || "";
    const otherPlannedDate = activeMatch.plannedDateBy[otherUser.id] || "";
    const agreedDate = activeMatch.agreedDate;
    const myDateConfirmed = activeMatch.dateOccurredBy.includes(user.id);
    const messages = AppData.getMessages(activeMatch.id);

    workflowHeading.textContent = "Live match workflow";
    sideHeading.textContent = "Message your match";

    profileEl.innerHTML = `
      ${AppUI.renderUserSummaryCard(user)}
      <div class="summary-card">
        <p class="profile-name">Current match</p>
        <p class="profile-meta">${otherUser.name} · ${formatStatusLabel(activeMatch.status)}</p>
        <div class="cta-row">
          <button class="ghost-button" type="button" id="dashboard-open-match">Open Match Details</button>
          <button class="danger-button" type="button" id="dashboard-unmatch">Unmatch</button>
        </div>
      </div>
    `;

    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Current step</div>
        <div class="stat-value">${formatStatusLabel(activeMatch.status)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Partner</div>
        <div class="stat-value">${otherUser.name}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Agreed date</div>
        <div class="stat-value">${agreedDate || "Waiting"}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Incoming likes</div>
        <div class="stat-value">${likes.length}</div>
      </div>
    `;

    nextEl.innerHTML = `
      <div class="journey-card">
        <div class="journey-step done"><span>1</span><strong>Matched</strong></div>
        <div class="journey-step ${activeMatch.status === "pending_intro" ? "active" : ["date_planning", "decision_window"].includes(activeMatch.status) ? "done" : ""}"><span>2</span><strong>Intro</strong></div>
        <div class="journey-step ${activeMatch.status === "date_planning" ? "active" : activeMatch.status === "decision_window" ? "done" : ""}"><span>3</span><strong>Date</strong></div>
        <div class="journey-step ${activeMatch.status === "decision_window" ? "active" : ""}"><span>4</span><strong>Decision</strong></div>
      </div>
      <div class="summary-card">
        <p class="profile-name">Locked into one match</p>
        <p class="profile-meta">The match button stays locked until this relationship path closes.</p>
        <div class="cta-row">
          <button class="ghost-button" type="button" disabled>Matching Game Locked</button>
        </div>
      </div>
      <div class="list-stack">
        <div class="timeline-row ${activeMatch.status === "pending_intro" ? "active" : myIntro ? "done" : ""}">
          <div>
            <strong>Intro stage</strong>
            <div class="small-copy">Both people need to submit the intro before the date step opens.</div>
          </div>
          <button id="dashboard-intro-btn" class="ghost-button" type="button" ${myIntro || activeMatch.status !== "pending_intro" ? "disabled" : ""}>${myIntro ? "Submitted" : "Submit Intro"}</button>
        </div>
        <div class="timeline-row ${activeMatch.status === "date_planning" ? "active" : agreedDate ? "done" : ""}">
          <div>
            <strong>Choose a date</strong>
            <div class="small-copy">Set your proposed date. When both people choose the same day, the date becomes confirmed.</div>
          </div>
          <div class="inline-action-row">
            <input id="dashboard-date-input" type="date" value="${myPlannedDate}" ${activeMatch.status !== "date_planning" ? "disabled" : ""}>
            <button id="dashboard-date-save" class="ghost-button" type="button" ${activeMatch.status !== "date_planning" ? "disabled" : ""}>Save Date</button>
          </div>
        </div>
        <div class="summary-card compact-card">
          <p class="profile-name">Date alignment</p>
          <p class="profile-meta">You: ${myPlannedDate || "Not set"} · ${otherUser.name}: ${otherPlannedDate || "Not set"}</p>
          <p class="small-copy">${agreedDate ? `Both of you aligned on ${agreedDate}.` : "Once both dates match, the app unlocks the date happened confirmation."}</p>
        </div>
        <div class="timeline-row ${activeMatch.status === "date_planning" && agreedDate ? "active" : myDateConfirmed ? "done" : ""}">
          <div>
            <strong>Confirm the date happened</strong>
            <div class="small-copy">After the agreed date, both people confirm the date happened. That unlocks the decision step.</div>
          </div>
          <button id="dashboard-date-confirm" class="ghost-button" type="button" ${(activeMatch.status !== "date_planning" || !agreedDate || myDateConfirmed) ? "disabled" : ""}>${myDateConfirmed ? "Confirmed" : "Confirm Date Happened"}</button>
        </div>
        <div class="timeline-row ${activeMatch.status === "decision_window" ? "active" : ""}">
          <div>
            <strong>Attract or shun</strong>
            <div class="small-copy">Once the date is confirmed by both sides, each person chooses the outcome.</div>
          </div>
          <div class="button-row" id="dashboard-decision-actions"></div>
        </div>
      </div>
    `;

    document.getElementById("dashboard-open-match").addEventListener("click", () => {
      location.href = "match.html";
    });

    document.getElementById("dashboard-unmatch").addEventListener("click", () => {
      AppUI.confirmAction({
        title: "End this match?",
        body: "<p>This closes the connection and removes the current lock.</p>",
        primaryLabel: "Unmatch",
        primaryClass: "danger-button",
        onConfirm: () => {
          AppData.unmatchCurrent(user.id);
          AppUI.showToast("Match ended.");
          setTimeout(() => location.reload(), 350);
        },
      });
    });

    const introBtn = document.getElementById("dashboard-intro-btn");
    if (introBtn) {
      introBtn.addEventListener("click", () => {
        AppData.submitIntro(activeMatch.id, user.id);
        AppUI.showToast("Intro submitted.");
        setTimeout(() => location.reload(), 350);
      });
    }

    const dateSaveBtn = document.getElementById("dashboard-date-save");
    if (dateSaveBtn) {
      dateSaveBtn.addEventListener("click", () => {
        const value = document.getElementById("dashboard-date-input").value;
        if (!value) {
          AppUI.showToast("Choose a date first.");
          return;
        }
        AppData.setPlannedDate(activeMatch.id, user.id, value);
        AppUI.showToast("Date preference saved.");
        setTimeout(() => location.reload(), 350);
      });
    }

    const confirmBtn = document.getElementById("dashboard-date-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        AppData.confirmDate(activeMatch.id, user.id);
        AppUI.showToast("Date confirmation saved.");
        setTimeout(() => location.reload(), 350);
      });
    }

    const decisionActions = document.getElementById("dashboard-decision-actions");
    if (activeMatch.status === "decision_window") {
      const myDecision = activeMatch.decisions[user.id];
      decisionActions.innerHTML = `
        <button id="dashboard-attract" class="success-button" type="button" ${myDecision ? "disabled" : ""}>Attract</button>
        <button id="dashboard-fit" class="ghost-button" type="button" ${myDecision ? "disabled" : ""}>Not A Fit</button>
        <button id="dashboard-shun" class="danger-button" type="button" ${myDecision ? "disabled" : ""}>Shun</button>
      `;
      document.getElementById("dashboard-attract").addEventListener("click", () => {
        AppData.submitDecision(activeMatch.id, user.id, "attract");
        AppUI.showToast("Decision saved.");
        setTimeout(() => location.reload(), 350);
      });
      document.getElementById("dashboard-fit").addEventListener("click", () => {
        AppData.submitDecision(activeMatch.id, user.id, "not_a_fit");
        AppUI.showToast("Decision saved.");
        setTimeout(() => location.reload(), 350);
      });
      document.getElementById("dashboard-shun").addEventListener("click", () => {
        AppData.submitDecision(activeMatch.id, user.id, "shun");
        AppUI.showToast("Decision saved.");
        setTimeout(() => location.reload(), 350);
      });
    } else {
      decisionActions.innerHTML = `<button class="ghost-button" type="button" disabled>Decision unlocks later</button>`;
    }

    renderMessages(messages, otherUser);
  }

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
      copy: "The dashboard becomes the true home screen once your account is ready.",
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
    });
    likesEl.innerHTML = `<div class="empty-state">Messages and match workflow appear here after your first live match.</div>`;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  const likes = AppData.getIncomingLikes(user.id);
  const latestMatch = AppData.getLatestMatchForUser(user.id);

  if (activeMatch) {
    renderActiveDashboard(activeMatch);
    return;
  }

  profileEl.innerHTML = AppUI.renderUserSummaryCard(user);
  workflowHeading.textContent = "Next action";
  sideHeading.textContent = "Interested in you";
  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Profile</div>
      <div class="stat-value">${user.onboardingCompleted ? "Ready" : "Incomplete"}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Incoming likes</div>
      <div class="stat-value">${likes.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Availability</div>
      <div class="stat-value">Open</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Latest result</div>
      <div class="stat-value">${latestMatch ? formatStatusLabel(latestMatch.status) : "None"}</div>
    </div>
  `;

  if (!user.onboardingCompleted) {
    nextEl.innerHTML = `
      <div class="journey-card">
        <div class="journey-step active"><span>1</span><strong>Complete profile</strong></div>
        <div class="journey-step"><span>2</span><strong>Open dashboard</strong></div>
        <div class="journey-step"><span>3</span><strong>Start matching</strong></div>
      </div>
      <div class="summary-card">
        <p class="profile-name">Complete the profile builder</p>
        <p class="profile-meta">Finish the profile before the matching game opens.</p>
        <div class="cta-row">
          <a class="primary-link" href="onboarding.html">Finish Profile Setup</a>
          <button class="ghost-button" type="button" disabled>Matching Game Locked</button>
        </div>
      </div>
    `;
  } else {
    nextEl.innerHTML = `
      <div class="journey-card">
        <div class="journey-step done"><span>1</span><strong>Profile ready</strong></div>
        <div class="journey-step active"><span>2</span><strong>Dashboard home</strong></div>
        <div class="journey-step"><span>3</span><strong>Matching game</strong></div>
      </div>
      <div class="summary-card">
        <p class="profile-name">Ready for discovery</p>
        <p class="profile-meta">You are unmatched, so the matching game is open.</p>
        <div class="cta-row">
          <a class="primary-link" href="browse.html">Open Matching Game</a>
        </div>
      </div>
    `;
  }

  AppUI.renderLikeList(likesEl, likes);
})();

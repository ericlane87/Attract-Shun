(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("match-user-chip", user ? `Matching as ${user.name}` : "No active user");

  const matchPanel = document.getElementById("match-panel");
  const chatPanel = document.getElementById("chat-panel");

  if (!user) {
    matchPanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> and create or seed users first.</div>`;
    chatPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  const match = AppData.getActiveMatchForUser(user.id);
  if (!match) {
    const latest = AppData.getLatestMatchForUser(user.id);
    if (!latest) {
      matchPanel.innerHTML = `<div class="empty-state">No active or past match yet.</div>`;
      chatPanel.innerHTML = `<div class="empty-state">Conversation opens only during an active match.</div>`;
      return;
    }

    const other = AppData.getOtherUser(latest, user.id);
    matchPanel.innerHTML = `
      <div class="match-card">
        <p class="profile-name">Latest match with ${other.name}</p>
        <p class="profile-meta">${latest.closedReason}</p>
        <div class="meta-row">
          <span class="status-pill">${latest.status.replace("_", " ")}</span>
          <a class="ghost-link" href="${latest.status === "attract" ? "success.html" : "browse.html"}">${latest.status === "attract" ? "Open Success Stories" : "Return To Browse"}</a>
        </div>
      </div>
    `;
    chatPanel.innerHTML = `<div class="empty-state">Conversation is unavailable because there is no active match.</div>`;
    return;
  }

  const otherUser = AppData.getOtherUser(match, user.id);
  AppData.markMessagesRead(user.id, match.id);
  const myIntro = Boolean(match.introVideos[user.id]);
  const myDateConfirm = match.dateConfirmedBy.includes(user.id);
  const myDecision = match.decisions[user.id];

  function formatTimeRemaining(deadlineIso) {
    const diffMs = new Date(deadlineIso).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
    if (totalHours < 24) return `${totalHours} hour${totalHours === 1 ? "" : "s"} left`;
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours ? `${days}d ${hours}h left` : `${days} day${days === 1 ? "" : "s"} left`;
  }

  matchPanel.innerHTML = `
    <div class="match-card">
      <div class="profile-top">
        <div>
          <p class="profile-name">${otherUser.name}</p>
          <p class="profile-meta">One active match. One guided flow.</p>
        </div>
        <span class="status-pill">${match.status.replace("_", " ")}</span>
      </div>
      <div class="timeline">
        <div class="timeline-row ${match.status === "pending_intro" ? "active" : myIntro ? "done" : ""}">
          <div>
            <strong>Video intro</strong>
            <div class="small-copy">Submit a mock 60 second to 2 minute intro within 24 hours by ${AppUI.formatDate(match.introDeadline)}. Time left: ${formatTimeRemaining(match.introDeadline)}. If both intros are not submitted in time, both people receive a Shun.</div>
          </div>
          <button id="intro-btn" class="ghost-button" type="button" ${myIntro || match.status !== "pending_intro" ? "disabled" : ""}>${myIntro ? "Submitted" : "Submit Intro"}</button>
        </div>
        <div class="timeline-row ${match.status === "date_planning" ? "active" : myDateConfirm ? "done" : ""}">
          <div>
            <strong>Plan first date</strong>
            <div class="small-copy">Confirm the date and mock photo verification within two weeks by ${AppUI.formatDate(match.dateDeadline)}. Time left: ${formatTimeRemaining(match.dateDeadline)}. If the timer runs out, both people receive a Shun.</div>
          </div>
          <button id="date-btn" class="ghost-button" type="button" ${myDateConfirm || match.status !== "date_planning" ? "disabled" : ""}>${myDateConfirm ? "Confirmed" : "Confirm Date"}</button>
        </div>
        <div class="timeline-row ${match.status === "decision_window" ? "active" : myDecision ? "done" : ""}">
          <div>
            <strong>Attract or shun</strong>
            <div class="small-copy">Choose the result by ${AppUI.formatDate(match.decisionDeadline)}. Time left: ${formatTimeRemaining(match.decisionDeadline)}. If the timer runs out, both people receive a Shun.</div>
          </div>
          <span class="interest-pill">${myDecision ? myDecision.replaceAll("_", " ") : "Awaiting choice"}</span>
        </div>
      </div>
      <div class="decision-actions" id="decision-actions"></div>
      <div class="button-row">
        <button id="unmatch-btn" class="danger-button" type="button">Unmatch Now</button>
        <a class="ghost-link" href="reports.html">Report This Match</a>
      </div>
    </div>
  `;

  if (document.getElementById("intro-btn")) {
    document.getElementById("intro-btn").addEventListener("click", () => {
      AppData.submitIntro(match.id, user.id);
      location.reload();
    });
  }

  if (document.getElementById("date-btn")) {
    document.getElementById("date-btn").addEventListener("click", () => {
      AppData.confirmDate(match.id, user.id);
      location.reload();
    });
  }

  document.getElementById("unmatch-btn").addEventListener("click", () => {
    AppData.unmatchCurrent(user.id);
    location.reload();
  });

  if (match.status === "decision_window") {
    const actions = document.getElementById("decision-actions");
    actions.innerHTML = `
      <button id="attract-btn" class="success-button" type="button" ${myDecision ? "disabled" : ""}>Choose Attract</button>
      <button id="fit-btn" class="ghost-button" type="button" ${myDecision ? "disabled" : ""}>Mutual Not A Fit</button>
      <button id="shun-btn" class="danger-button" type="button" ${myDecision ? "disabled" : ""}>Choose Shun</button>
    `;
    document.getElementById("attract-btn").addEventListener("click", () => {
      AppData.submitDecision(match.id, user.id, "attract");
      location.reload();
    });
    document.getElementById("fit-btn").addEventListener("click", () => {
      AppData.submitDecision(match.id, user.id, "not_a_fit");
      location.reload();
    });
    document.getElementById("shun-btn").addEventListener("click", () => {
      AppData.submitDecision(match.id, user.id, "shun");
      location.reload();
    });
  }

  const messages = AppData.getMessages(match.id);
  chatPanel.innerHTML = `
    <div class="chat-wrap">
      <div class="chat-head">
        <div>
          <p class="profile-name">${otherUser.name}</p>
          <p class="profile-meta">This is the only active conversation this user can hold.</p>
        </div>
        <span class="status-pill">${messages.length} messages</span>
      </div>
      <div class="chat-log" id="chat-log"></div>
      <form id="chat-form" class="chat-compose">
        <input id="chat-input" type="text" maxlength="240" placeholder="Send a message">
        <button class="primary-button" type="submit">Send</button>
      </form>
    </div>
  `;

  const log = document.getElementById("chat-log");
  if (!messages.length) {
    log.innerHTML = `<div class="empty-state">No messages yet. Start the conversation.</div>`;
  } else {
    messages.forEach((message) => {
      const messageEl = document.createElement("div");
      messageEl.className = `chat-message${message.senderId === user.id ? " mine" : ""}`;
      messageEl.innerHTML = `
        <div class="chat-bubble">
          <strong>${message.senderId === user.id ? "You" : otherUser.name}</strong>
          <div>${message.text}</div>
          <div class="small-copy">${new Date(message.createdAt).toLocaleString()}</div>
        </div>
      `;
      log.appendChild(messageEl);
    });
  }

  document.getElementById("chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    AppData.sendMessage(match.id, user.id, input.value);
    location.reload();
  });
})();

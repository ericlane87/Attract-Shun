(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("match-user-chip", user ? `Matching as ${user.name}` : "No active user");

  const matchPanel = document.getElementById("match-panel");
  const chatPanel = document.getElementById("chat-panel");

  function renderMessages(messages, otherUser) {
    const log = document.getElementById("chat-log");
    if (!log) return;
    log.innerHTML = "";

    if (!messages.length) {
      log.innerHTML = `
        <div class="empty-state">No messages yet. Start the conversation with intention.</div>
        <div class="prompt-row">
          <button class="prompt-chip" type="button" data-prompt="What made you interested in my profile?">Why were you interested?</button>
          <button class="prompt-chip" type="button" data-prompt="What kind of connection are you hoping for here?">What are you looking for?</button>
          <button class="prompt-chip" type="button" data-prompt="What would your ideal first date look like?">Ideal first date?</button>
        </div>
      `;

      log.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
          document.getElementById("chat-input").value = button.dataset.prompt;
          document.getElementById("chat-input").focus();
        });
      });
      return;
    }

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

    log.scrollTop = log.scrollHeight;
  }

  if (!user) {
    matchPanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Studio</a> and create or seed profiles first.</div>`;
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
  const myIntro = Boolean(match.introVideos[user.id]);
  const myDateConfirm = match.dateConfirmedBy.includes(user.id);
  const myDecision = match.decisions[user.id];
  const phaseSummary = match.status === "pending_intro"
    ? "Both people need to introduce themselves before the match can advance."
    : match.status === "date_planning"
      ? "This stage is about planning and confirming the first date."
      : "Both people now choose whether this becomes Attract or Shun.";

  matchPanel.innerHTML = `
    <div class="match-card">
      <div class="profile-rail">
        <span class="rail-pill">One live connection</span>
        <span class="rail-pill">${messages.length || 0} messages</span>
      </div>
      <div class="profile-top">
        <div>
          <p class="profile-name">${otherUser.name}</p>
          <p class="profile-meta">One active match. One guided flow.</p>
        </div>
        <span class="status-pill">${match.status.replace("_", " ")}</span>
      </div>
      <div class="journey-card compact">
        <div class="journey-step ${["pending_intro","date_planning","decision_window"].includes(match.status) ? "done" : ""}"><span>1</span><strong>Match</strong></div>
        <div class="journey-step ${match.status === "pending_intro" ? "active" : ["date_planning","decision_window"].includes(match.status) ? "done" : ""}"><span>2</span><strong>Intro</strong></div>
        <div class="journey-step ${match.status === "date_planning" ? "active" : match.status === "decision_window" ? "done" : ""}"><span>3</span><strong>Date</strong></div>
        <div class="journey-step ${match.status === "decision_window" ? "active" : ""}"><span>4</span><strong>Decision</strong></div>
      </div>
      <div class="hint-box">${phaseSummary}</div>
      <div class="timeline">
        <div class="timeline-row ${match.status === "pending_intro" ? "active" : myIntro ? "done" : ""}">
          <div>
            <strong>Video intro</strong>
            <div class="small-copy">Submit a mock 60 second to 2 minute intro by ${AppUI.formatDate(match.introDeadline)}.</div>
          </div>
          <button id="intro-btn" class="ghost-button" type="button" ${myIntro || match.status !== "pending_intro" ? "disabled" : ""}>${myIntro ? "Submitted" : "Submit Intro"}</button>
        </div>
        <div class="timeline-row ${match.status === "date_planning" ? "active" : myDateConfirm ? "done" : ""}">
          <div>
            <strong>Plan first date</strong>
            <div class="small-copy">Confirm the date and mock photo verification by ${AppUI.formatDate(match.dateDeadline)}.</div>
          </div>
          <button id="date-btn" class="ghost-button" type="button" ${myDateConfirm || match.status !== "date_planning" ? "disabled" : ""}>${myDateConfirm ? "Confirmed" : "Confirm Date"}</button>
        </div>
        <div class="timeline-row ${match.status === "decision_window" ? "active" : myDecision ? "done" : ""}">
          <div>
            <strong>Attract or shun</strong>
            <div class="small-copy">Choose the result by ${AppUI.formatDate(match.decisionDeadline)}.</div>
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
      AppUI.showToast("Introduction submitted.");
      setTimeout(() => location.reload(), 350);
    });
  }

  if (document.getElementById("date-btn")) {
    document.getElementById("date-btn").addEventListener("click", () => {
      AppData.confirmDate(match.id, user.id);
      AppUI.showToast("Date confirmation saved.");
      setTimeout(() => location.reload(), 350);
    });
  }

  document.getElementById("unmatch-btn").addEventListener("click", () => {
    AppUI.confirmAction({
      title: "End this match?",
      body: "<p>This closes the current connection and applies the configured shun logic.</p>",
      primaryLabel: "End Match",
      primaryClass: "danger-button",
      onConfirm: () => {
        AppData.unmatchCurrent(user.id);
        AppUI.showToast("Match ended.");
        setTimeout(() => location.reload(), 350);
      },
    });
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
      AppUI.showToast("Attract decision saved.");
      setTimeout(() => location.reload(), 350);
    });
    document.getElementById("fit-btn").addEventListener("click", () => {
      AppData.submitDecision(match.id, user.id, "not_a_fit");
      AppUI.showToast("Decision saved.");
      setTimeout(() => location.reload(), 350);
    });
    document.getElementById("shun-btn").addEventListener("click", () => {
      AppData.submitDecision(match.id, user.id, "shun");
      AppUI.showToast("Shun decision saved.");
      setTimeout(() => location.reload(), 350);
    });
  }

  const messages = AppData.getMessages(match.id);
  chatPanel.innerHTML = `
    <div class="chat-wrap">
      <div class="chat-head">
        <div>
          <p class="profile-name">${otherUser.name}</p>
          <p class="profile-meta">The only active conversation for this account.</p>
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

  renderMessages(messages, otherUser);

  document.getElementById("chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const nextValue = input.value.trim();
    if (!nextValue) return;
    AppData.sendMessage(match.id, user.id, nextValue);
    input.value = "";
    renderMessages(AppData.getMessages(match.id), otherUser);
  });
})();

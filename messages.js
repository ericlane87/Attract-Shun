(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.setPageChip("messages-user-chip", user ? `Messages for ${user.name}` : "No active user");

  const summaryEl = document.getElementById("messages-summary");
  const logEl = document.getElementById("messages-log");

  if (!user) {
    summaryEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    logEl.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  const activeMatch = AppData.getActiveMatchForUser(user.id);
  const latestMatch = AppData.getLatestMatchForUser(user.id);
  const match = activeMatch || latestMatch;

  if (!match) {
    summaryEl.innerHTML = `<div class="summary-card"><p class="profile-name">No messages yet</p><p class="profile-meta">Messages open after a match is created.</p></div>`;
    logEl.innerHTML = `<div class="empty-state">No conversation history exists for this account.</div>`;
    return;
  }

  const otherUser = AppData.getOtherUser(match, user.id);
  const messages = AppData.getMessages(match.id);

  summaryEl.innerHTML = `
    <div class="summary-card">
      <p class="profile-name">${activeMatch ? "Active conversation" : "Latest conversation"}</p>
      <p class="profile-meta">${otherUser.name} · ${match.status.replaceAll("_", " ")}</p>
      <div class="cta-row">
        <a class="primary-link" href="match.html">Open Match</a>
        <a class="ghost-link" href="browse.html">Back To Browse</a>
      </div>
    </div>
  `;

  if (!messages.length) {
    logEl.innerHTML = `<div class="empty-state">No messages yet with ${otherUser.name}.</div>`;
    return;
  }

  logEl.innerHTML = `
    <div class="chat-wrap">
      <div class="chat-head">
        <div>
          <p class="profile-name">${otherUser.name}</p>
          <p class="profile-meta">${messages.length} total messages</p>
        </div>
        <span class="status-pill">${activeMatch ? "Active" : "Archived"}</span>
      </div>
      <div class="chat-log" id="messages-chat-log"></div>
    </div>
  `;

  const chatLog = document.getElementById("messages-chat-log");
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
    chatLog.appendChild(messageEl);
  });
})();

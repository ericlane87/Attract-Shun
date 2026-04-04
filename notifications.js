(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.setPageChip("notifications-user-chip", user ? `Alerts for ${user.name}` : "No active user");

  const listEl = document.getElementById("notifications-list");
  const summaryEl = document.getElementById("notifications-summary");

  if (!user) {
    listEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    summaryEl.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  const notifications = AppData.getNotificationsForUser(user.id);

  if (!notifications.length) {
    listEl.innerHTML = `<div class="empty-state">No notifications right now.</div>`;
  } else {
    listEl.innerHTML = notifications.map((notification) => `
      <div class="summary-card">
        <p class="profile-name">${notification.title}</p>
        <p class="profile-meta">${notification.detail}</p>
        <div class="cta-row">
          <a class="primary-link" href="${notification.href}">Open</a>
        </div>
      </div>
    `).join("");
  }

  summaryEl.innerHTML = `
    <div class="summary-card">
      <p class="profile-name">${notifications.length} active notification${notifications.length === 1 ? "" : "s"}</p>
      <p class="profile-meta">Each alert links directly to the place where the required action happens.</p>
      <div class="cta-row">
        <a class="ghost-link" href="dashboard.html">Back To Dashboard</a>
      </div>
    </div>
  `;
})();

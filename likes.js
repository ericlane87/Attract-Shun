(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.setPageChip("likes-user-chip", user ? `Likes for ${user.name}` : "No active user");

  const likesListEl = document.getElementById("likes-list");
  const summaryEl = document.getElementById("likes-summary");

  if (!user) {
    likesListEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    summaryEl.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  const likes = AppData.getIncomingLikes(user.id);
  AppUI.renderLikeList(likesListEl, likes);

  summaryEl.innerHTML = `
    <div class="summary-card">
      <p class="profile-name">${likes.length} incoming like${likes.length === 1 ? "" : "s"}</p>
      <p class="profile-meta">${likes.length ? "These people already showed interest. Browse them or wait for a mutual match." : "No one has liked this account yet."}</p>
      <div class="cta-row">
        <a class="primary-link" href="browse.html">Open Browse</a>
        <a class="ghost-link" href="dashboard.html">Back To Dashboard</a>
      </div>
    </div>
  `;
})();

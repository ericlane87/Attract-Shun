(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("reports-user-chip", user ? `Reporting as ${user.name}` : "No active user");

  const form = document.getElementById("report-form");
  const select = document.getElementById("reported-user-select");
  const historyEl = document.getElementById("reports-history");
  const queueEl = document.getElementById("reports-queue");

  if (!user) {
    form.innerHTML = "";
    historyEl.innerHTML = AppUI.renderEntryState({
      kicker: "Trust and safety",
      title: "Reports appear after connections exist",
      copy: "Safety tools become relevant once accounts are matching and interacting through the app.",
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
      secondaryHref: "admin.html",
      secondaryLabel: "View Demo Profiles",
    });
    queueEl.innerHTML = `<div class="empty-state">Moderation items will appear here once reports are submitted.</div>`;
    return;
  }

  const latestMatch = AppData.getLatestMatchForUser(user.id);
  const reportTargets = latestMatch ? latestMatch.userIds.filter((id) => id !== user.id).map(AppData.getUser).filter(Boolean) : [];

  if (!reportTargets.length) {
    select.innerHTML = `<option value="">No recent match partner</option>`;
    select.disabled = true;
  } else {
    reportTargets.forEach((target) => {
      const option = document.createElement("option");
      option.value = target.id;
      option.textContent = target.name;
      select.appendChild(option);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!select.value || !latestMatch) return;
    const formData = new FormData(form);
    AppData.createReport({
      matchId: latestMatch.id,
      reporterId: user.id,
      reportedUserId: formData.get("reportedUserId"),
      category: formData.get("category"),
      details: formData.get("details"),
    });
    AppUI.showToast("Report submitted for review.");
    setTimeout(() => location.reload(), 350);
  });

  const history = AppData.getReportsForUser(user.id);
  if (!history.length) {
    historyEl.innerHTML = `<div class="empty-state">No reports involving this user yet.</div>`;
  } else {
    historyEl.innerHTML = "";
    history.forEach((report) => {
      const reported = AppData.getUser(report.reportedUserId);
      const row = document.createElement("div");
      row.className = "summary-card";
      row.innerHTML = `
        <p class="profile-name">${report.category}</p>
        <p class="profile-meta">Against ${reported ? reported.name : "Unknown"} · ${report.status}</p>
        <p class="small-copy">${report.details}</p>
      `;
      historyEl.appendChild(row);
    });
  }

  const queue = AppData.getOpenReports();
  if (!queue.length) {
    queueEl.innerHTML = `<div class="empty-state">No open moderation items.</div>`;
  } else {
    queueEl.innerHTML = "";
    queue.forEach((report) => {
      const reported = AppData.getUser(report.reportedUserId);
      const reporter = AppData.getUser(report.reporterId);
      const row = document.createElement("div");
      row.className = "summary-card";
      row.innerHTML = `
        <p class="profile-name">${report.category}</p>
        <p class="profile-meta">${reporter ? reporter.name : "Someone"} reported ${reported ? reported.name : "a user"}</p>
        <p class="small-copy">${report.details}</p>
        <div class="button-row">
          <button class="ghost-button" type="button" data-action="dismiss" data-id="${report.id}">Dismiss</button>
          <button class="danger-button" type="button" data-action="actioned" data-id="${report.id}">Action Report</button>
        </div>
      `;
      queueEl.appendChild(row);
    });

    queueEl.querySelectorAll("button[data-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const status = button.dataset.action;
        const resolution = status === "actioned" ? "Admin action applied." : "Dismissed after review.";
        AppData.updateReportStatus(button.dataset.id, status, resolution);
        AppUI.showToast(status === "actioned" ? "Report actioned." : "Report dismissed.");
        setTimeout(() => location.reload(), 350);
      });
    });
  }
})();

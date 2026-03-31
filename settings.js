(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("settings-user-chip", user ? `Settings for ${user.name}` : "No active user");

  const form = document.getElementById("settings-form");
  const summary = document.getElementById("settings-summary");

  if (!user) {
    form.innerHTML = "";
    summary.innerHTML = AppUI.renderEntryState({
      kicker: "Settings",
      title: "Settings unlock after account creation",
      copy: "Create an account to manage visibility, match preferences, and notifications.",
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
      secondaryHref: "admin.html",
      secondaryLabel: "View Demo Profiles",
    });
    return;
  }

  form.minAge.value = user.preferences.minAge;
  form.maxAge.value = user.preferences.maxAge;
  form.distanceMiles.value = user.preferences.distanceMiles;
  form.notifications.checked = user.preferences.notifications;
  form.profileVisible.checked = user.preferences.profileVisible;
  form.allowWeeklyFeature.checked = user.preferences.allowWeeklyFeature;

  summary.innerHTML = `
    <div class="summary-card">
      <p class="profile-name">${user.name}</p>
      <p class="profile-meta">${AppData.formatIntent(user.intent)} · ${user.accountStatus}</p>
      <div class="list-stack">
        <div class="meta-row"><span class="small-copy">Visibility</span><span class="status-pill">${user.preferences.profileVisible ? "Visible" : "Hidden"}</span></div>
        <div class="meta-row"><span class="small-copy">Notifications</span><span class="status-pill">${user.preferences.notifications ? "On" : "Off"}</span></div>
        <div class="meta-row"><span class="small-copy">Weekly feature</span><span class="status-pill">${user.preferences.allowWeeklyFeature ? "Allowed" : "Off"}</span></div>
      </div>
    </div>
  `;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    AppData.updateCurrentUserProfile({
      preferences: {
        minAge: Number(formData.get("minAge")),
        maxAge: Number(formData.get("maxAge")),
        distanceMiles: Number(formData.get("distanceMiles")),
        notifications: formData.get("notifications") === "on",
        profileVisible: formData.get("profileVisible") === "on",
        allowWeeklyFeature: formData.get("allowWeeklyFeature") === "on",
      },
    });
    AppUI.showToast("Settings saved.");
    setTimeout(() => location.reload(), 350);
  });
})();

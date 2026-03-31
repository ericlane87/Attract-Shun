(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("onboarding-user-chip", user ? `Onboarding ${user.name}` : "No active user");

  const progressEl = document.getElementById("onboarding-progress");
  const form = document.getElementById("onboarding-form");

  if (!user) {
    progressEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Studio</a> to create a profile first.</div>`;
    form.innerHTML = "";
    return;
  }

  const steps = [
    { label: "Identity verified", done: user.verified },
    { label: "Intent selected", done: Boolean(user.intent) },
    { label: "Profile bio ready", done: user.bio.trim().length > 20 },
    { label: "Preferences saved", done: Boolean(user.preferences) },
  ];

  progressEl.innerHTML = `
    <div class="list-stack">
      ${steps.map((step) => `
        <div class="timeline-row ${step.done ? "done" : "active"}">
          <div>
            <strong>${step.label}</strong>
            <div class="small-copy">${step.done ? "Complete" : "Still needed"}</div>
          </div>
          <span class="status-pill">${step.done ? "Done" : "Pending"}</span>
        </div>
      `).join("")}
      <div class="hint-box">
        ${user.onboardingCompleted ? "This user is ready for full app use." : "Finish onboarding to make the profile feel app-store ready and realistic."}
      </div>
    </div>
  `;

  form.intent.value = user.intent;
  form.bio.value = user.bio;
  form.minAge.value = user.preferences.minAge;
  form.maxAge.value = user.preferences.maxAge;
  form.distanceMiles.value = user.preferences.distanceMiles;
  form.allowWeeklyFeature.checked = user.preferences.allowWeeklyFeature;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    AppData.completeOnboarding(user.id, {
      intent: formData.get("intent"),
      bio: formData.get("bio").trim(),
      minAge: formData.get("minAge"),
      maxAge: formData.get("maxAge"),
      distanceMiles: formData.get("distanceMiles"),
      allowWeeklyFeature: formData.get("allowWeeklyFeature") === "on",
    });
    AppUI.showToast("Profile completed.");
    setTimeout(() => {
      location.href = "dashboard.html";
    }, 350);
  });
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const form = document.getElementById("sign-in-form");
  const recentProfiles = document.getElementById("recent-profiles");

  function goToAccount(user) {
    AppData.setCurrentUser(user.id);
    AppUI.showToast(`Welcome back, ${user.name}.`);
    setTimeout(() => {
      location.href = user.onboardingCompleted ? "dashboard.html" : "onboarding.html";
    }, 300);
  }

  function renderRecentProfiles() {
    const users = [...AppData.state.users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!users.length) {
      recentProfiles.innerHTML = `
        <div class="empty-state">
          No profiles yet. Create the first account to start the experience.
        </div>
      `;
      return;
    }

    recentProfiles.innerHTML = users.map((user) => `
      <div class="summary-card quick-signin-card">
        <div class="profile-top">
          <div>
            <p class="profile-name">${user.name}, ${user.age}</p>
            <p class="profile-meta">${user.city} · ${AppData.formatIntent(user.intent)} · ${user.email}</p>
          </div>
          <div class="avatar">${user.name.split(" ").map((part) => part[0] || "").slice(0, 2).join("").toUpperCase()}</div>
        </div>
        <div class="cta-row">
          <button class="ghost-button" type="button" data-user-id="${user.id}">Continue as ${user.name}</button>
        </div>
      </div>
    `).join("");

    recentProfiles.querySelectorAll("[data-user-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const user = AppData.getUser(button.dataset.userId);
        if (user) goToAccount(user);
      });
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const user = AppData.findUserByEmail(formData.get("email"));
    if (!user) {
      AppUI.showToast("No account found with that email.");
      return;
    }
    goToAccount(user);
  });

  renderRecentProfiles();
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const select = document.getElementById("active-user-select");
  const activeCard = document.getElementById("active-user-card");
  const userList = document.getElementById("user-list");
  const countPill = document.getElementById("user-count-pill");

  function renderUserOptions() {
    select.innerHTML = "";
    if (!AppData.state.users.length) {
      const option = document.createElement("option");
      option.textContent = "No users yet";
      option.value = "";
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    select.disabled = false;
    AppData.state.users.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.name} (${AppData.formatIntent(user.intent)})`;
      option.selected = user.id === AppData.state.currentUserId;
      select.appendChild(option);
    });
  }

  function renderUserList() {
    userList.innerHTML = "";
    countPill.textContent = `${AppData.state.users.length} users`;
    if (!AppData.state.users.length) {
      userList.innerHTML = `<div class="empty-state">No profiles created yet.</div>`;
      return;
    }

    AppData.state.users.forEach((user) => {
      const row = document.createElement("div");
      row.className = "user-row";
      row.innerHTML = `
        <div>
          <p class="profile-name">${user.name}, ${user.age}</p>
          <p class="profile-meta">${user.city} · ${AppData.formatIntent(user.intent)} · ${user.activeMatchId ? "Active match" : "Open"}</p>
        </div>
        <button class="ghost-button" type="button" data-user-id="${user.id}">Use This User</button>
      `;
      userList.appendChild(row);
    });

    userList.querySelectorAll("button[data-user-id]").forEach((button) => {
      button.addEventListener("click", () => {
        AppData.setCurrentUser(button.dataset.userId);
        render();
      });
    });
  }

  function render() {
    AppUI.injectExperienceRibbon();
    AppUI.setPageChip("system-date-chip", `System date ${new Date(AppData.state.system.now).toLocaleDateString()}`);
    renderUserOptions();
    activeCard.innerHTML = AppUI.renderUserSummaryCard(AppData.currentUser());
    renderUserList();
  }

  select.addEventListener("change", (event) => {
    AppData.setCurrentUser(event.target.value);
    render();
  });

  document.getElementById("create-user-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const user = AppData.createUser({
      name: formData.get("name"),
      age: formData.get("age"),
      city: formData.get("city"),
      intent: formData.get("intent"),
      bio: formData.get("bio"),
    });
    event.currentTarget.reset();
    render();
    AppUI.showToast(`${user.name} is ready for onboarding.`);
  });

  document.getElementById("seed-demo-btn").addEventListener("click", () => {
    AppData.seedDemoUsers();
    render();
    AppUI.showToast("Demo profiles added.");
  });

  document.getElementById("advance-day-btn").addEventListener("click", () => {
    AppData.advanceDay();
    render();
    AppUI.showToast("Advanced the experience by one day.");
  });

  document.getElementById("reset-app-btn").addEventListener("click", () => {
    AppUI.confirmAction({
      title: "Reset the experience?",
      body: "<p>This clears all profiles, messages, matches, reports, and stories from this browser.</p>",
      primaryLabel: "Reset Everything",
      primaryClass: "danger-button",
      onConfirm: () => {
        AppData.resetAll();
        render();
        AppUI.showToast("Experience reset.");
      },
    });
  });

  render();
})();

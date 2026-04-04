(function () {
  const AppData = window.AppData;

  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  const quickList = document.getElementById("quick-login-list");
  const params = new URLSearchParams(window.location.search);
  const nextPage = params.get("next") || "dashboard.html";

  if (AppData.isAuthenticated()) {
    window.location.replace(nextPage);
    return;
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function completeLogin(user) {
    const destination = user ? nextPage : "dashboard.html";
    window.location.href = destination;
  }

  function renderQuickLogins() {
    if (!AppData.state.users.length) {
      quickList.innerHTML = `<div class="empty-state">No users exist yet. Create one in <a href="admin.html">Admin</a> first.</div>`;
      return;
    }

    quickList.innerHTML = AppData.state.users.map((user) => `
      <button class="ghost-button quick-login-button" type="button" data-login-id="${user.id}">
        <span>${user.name}</span>
        <span class="small-copy">Email: ${user.email || "Use full name"} | Password: demo1234</span>
      </button>
    `).join("");

    quickList.querySelectorAll("[data-login-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const user = AppData.getUser(button.dataset.loginId);
        if (!user) return;
        AppData.setLoggedInUser(user.id);
        completeLogin(user);
      });
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideError();
    const formData = new FormData(form);
    const user = AppData.login(formData.get("identifier"), formData.get("password"));
    if (!user) {
      showError("Sign-in failed. Use a matching email or full name and password.");
      return;
    }
    completeLogin(user);
  });

  renderQuickLogins();
})();

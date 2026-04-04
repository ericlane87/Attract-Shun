(function () {
  const AppData = window.AppData;

  function redirectToLogin() {
    const path = window.location.pathname.split("/").pop() || "dashboard.html";
    if (path === "login.html" || path === "index.html" || path === "admin.html") return;
    window.location.replace(`login.html?next=${encodeURIComponent(path)}`);
  }

  function protectPage() {
    if (!AppData.isAuthenticated()) {
      redirectToLogin();
    }
  }

  function logoutAndRedirect() {
    AppData.logout();
    window.location.href = "login.html";
  }

  window.AppAuth = {
    protectPage,
    redirectToLogin,
    logoutAndRedirect,
  };
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const form = document.getElementById("create-account-form");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const user = AppData.createUser({
      name: formData.get("name"),
      email: formData.get("email"),
      age: formData.get("age"),
      gender: formData.get("gender"),
      lookingFor: formData.get("lookingFor"),
      intent: formData.get("intent"),
    });
    AppData.setCurrentUser(user.id);
    AppUI.showToast("Account created.");
    setTimeout(() => {
      location.href = "onboarding.html";
    }, 350);
  });
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  const INTEREST_OPTIONS = [
    "Travel", "Fitness", "Cooking", "Faith", "Music", "Art",
    "Books", "Movies", "Outdoors", "Fashion", "Gaming", "Business"
  ];
  const ZODIAC_OPTIONS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("onboarding-user-chip", user ? `Profile for ${user.name}` : "No active user");

  const progressEl = document.getElementById("onboarding-progress");
  const form = document.getElementById("onboarding-form");
  const interestOptionsEl = document.getElementById("interest-options");
  const photoInput = document.getElementById("photo-input");
  const photoPreviewGrid = document.getElementById("photo-preview-grid");
  const locationInput = document.getElementById("location-label");
  const locationStatus = document.getElementById("location-status");
  const detectLocationButton = document.getElementById("detect-location-button");

  let photoState = user && Array.isArray(user.photos) ? user.photos.slice(0, 5) : [];
  let profilePhotoIndex = user ? Math.min(user.profilePhotoIndex || 0, Math.max(photoState.length - 1, 0)) : 0;
  let locationState = user ? {
    label: user.locationLabel || user.city || "",
    latitude: user.latitude,
    longitude: user.longitude,
  } : {
    label: "",
    latitude: null,
    longitude: null,
  };

  function feetAndInches(totalInches) {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${String(inches).padStart(2, "0")}"`;
  }

  function fillSelect(select, values, includeAnyLabel) {
    if (!select) return;
    select.innerHTML = "";
    if (includeAnyLabel) {
      const anyOption = document.createElement("option");
      anyOption.value = includeAnyLabel.value;
      anyOption.textContent = includeAnyLabel.label;
      select.appendChild(anyOption);
    }
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = typeof value === "number" ? feetAndInches(value) : value;
      select.appendChild(option);
    });
  }

  function renderInterestOptions(selectedInterests) {
    interestOptionsEl.innerHTML = INTEREST_OPTIONS.map((interest) => `
      <label class="choice-chip ${selectedInterests.includes(interest) ? "selected" : ""}">
        <input type="checkbox" name="interests" value="${interest}" ${selectedInterests.includes(interest) ? "checked" : ""}>
        <span>${interest}</span>
      </label>
    `).join("");
  }

  function renderPhotos() {
    if (!photoPreviewGrid) return;
    if (!photoState.length) {
      photoPreviewGrid.innerHTML = `<div class="empty-state">No photos yet. Add up to 5 profile images.</div>`;
      return;
    }

    photoPreviewGrid.innerHTML = photoState.map((photo, index) => `
      <div class="photo-card ${index === profilePhotoIndex ? "primary" : ""}">
        <img class="photo-thumb" src="${photo}" alt="Profile photo ${index + 1}">
        <div class="photo-actions">
          <button class="ghost-button" type="button" data-action="primary" data-index="${index}">${index === profilePhotoIndex ? "Profile Photo" : "Make Profile Photo"}</button>
          <button class="ghost-button" type="button" data-action="remove" data-index="${index}">Remove</button>
        </div>
      </div>
    `).join("");

    photoPreviewGrid.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        if (button.dataset.action === "primary") {
          profilePhotoIndex = index;
        } else {
          photoState.splice(index, 1);
          if (profilePhotoIndex >= photoState.length) {
            profilePhotoIndex = Math.max(photoState.length - 1, 0);
          }
        }
        renderPhotos();
      });
    });
  }

  function updateLocationFields() {
    if (locationInput) locationInput.value = locationState.label || "";
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      locationStatus.textContent = "This browser does not support location detection.";
      return;
    }

    locationStatus.textContent = "Checking browser location...";
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      locationState = {
        label: `Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        latitude,
        longitude,
      };
      updateLocationFields();
      locationStatus.textContent = "Location detected from the browser and locked for this profile.";
    }, () => {
      locationStatus.textContent = "Location access was denied. Allow browser location to finish the profile.";
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  }

  if (!user) {
    progressEl.innerHTML = AppUI.renderEntryState({
      kicker: "Profile setup",
      title: "Create an account to begin",
      copy: "This screen becomes the full profile builder once an account exists.",
      steps: ["Create account", "Build profile", "Enter discovery"],
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
      secondaryHref: "admin.html",
      secondaryLabel: "View Demo Profiles",
    });
    form.innerHTML = `<div class="empty-state">Create an account first, then return here to finish the profile.</div>`;
    return;
  }

  fillSelect(document.getElementById("zodiac-sign-select"), ZODIAC_OPTIONS);
  fillSelect(document.getElementById("excluded-zodiac-select"), ZODIAC_OPTIONS, { value: "none", label: "None" });

  const heights = [];
  for (let inches = 58; inches <= 82; inches += 1) heights.push(inches);
  fillSelect(document.getElementById("height-select"), heights);
  fillSelect(document.getElementById("min-height-select"), heights, { value: "0", label: "No minimum" });

  const steps = [
    { label: "Account basics saved", done: Boolean(user.name && user.email) },
    { label: "Browser location locked", done: Boolean(user.locationLabel || user.city) },
    { label: "Profile story ready", done: user.bio.trim().length > 20 },
    { label: "Photos uploaded", done: Array.isArray(user.photos) && user.photos.length > 0 },
    { label: "Deal filters saved", done: Boolean(user.preferences) },
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
        ${user.onboardingCompleted ? "This profile is live in the app flow." : "Finish the profile to open browsing, matching, and the full relationship path."}
      </div>
    </div>
  `;

  form.name.value = user.name;
  form.email.value = user.email;
  form.age.value = user.age;
  form.intent.value = user.intent;
  form.gender.value = user.gender;
  form.lookingFor.value = user.lookingFor;
  form.bio.value = user.bio;
  form.zodiacSign.value = user.zodiacSign || "Aries";
  form.heightInches.value = String(user.heightInches || 68);
  form.race.value = user.race || "Prefer not to say";
  form.childrenStatus.value = user.childrenStatus || "Open to kids";
  form.minAge.value = user.preferences.minAge;
  form.maxAge.value = user.preferences.maxAge;
  form.distanceMiles.value = user.preferences.distanceMiles;
  form.minHeightInches.value = String(user.preferences.minHeightInches || 0);
  form.preferredRace.value = user.preferences.preferredRace || "any";
  form.preferredChildrenStatus.value = user.preferences.preferredChildrenStatus || "any";
  form.excludedRace.value = user.preferences.excludedRace || "none";
  form.excludedChildrenStatus.value = user.preferences.excludedChildrenStatus || "none";
  form.excludedZodiac.value = user.preferences.excludedZodiac || "none";
  form.allowWeeklyFeature.checked = user.preferences.allowWeeklyFeature;

  renderInterestOptions(user.interests || []);
  updateLocationFields();
  renderPhotos();

  if (!locationState.label) {
    requestBrowserLocation();
  } else {
    locationStatus.textContent = "Browser location already captured for this profile.";
  }

  detectLocationButton.addEventListener("click", requestBrowserLocation);

  photoInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - photoState.length);
    const fileReaders = files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    }));
    const newPhotos = await Promise.all(fileReaders);
    photoState = photoState.concat(newPhotos).slice(0, 5);
    renderPhotos();
    photoInput.value = "";
  });

  form.addEventListener("change", (event) => {
    const chip = event.target.closest(".choice-chip");
    if (chip) {
      chip.classList.toggle("selected", event.target.checked);
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!locationState.label) {
      AppUI.showToast("Allow browser location before saving the profile.");
      return;
    }

    const formData = new FormData(form);
    const minAge = Number(formData.get("minAge"));
    const maxAge = Number(formData.get("maxAge"));
    if (minAge > maxAge) {
      AppUI.showToast("Minimum age must be lower than maximum age.");
      return;
    }

    AppData.completeOnboarding(user.id, {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      age: Number(formData.get("age")),
      intent: formData.get("intent"),
      gender: formData.get("gender").trim(),
      lookingFor: formData.get("lookingFor").trim(),
      bio: formData.get("bio").trim(),
      zodiacSign: formData.get("zodiacSign"),
      heightInches: Number(formData.get("heightInches")),
      race: formData.get("race"),
      childrenStatus: formData.get("childrenStatus"),
      interests: formData.getAll("interests"),
      photos: photoState,
      profilePhotoIndex,
      locationLabel: locationState.label,
      latitude: locationState.latitude,
      longitude: locationState.longitude,
      minAge,
      maxAge,
      distanceMiles: Number(formData.get("distanceMiles")),
      minHeightInches: Number(formData.get("minHeightInches")),
      preferredRace: formData.get("preferredRace"),
      preferredChildrenStatus: formData.get("preferredChildrenStatus"),
      excludedRace: formData.get("excludedRace"),
      excludedChildrenStatus: formData.get("excludedChildrenStatus"),
      excludedZodiac: formData.get("excludedZodiac"),
      allowWeeklyFeature: formData.get("allowWeeklyFeature") === "on",
    });
    AppUI.showToast("Profile completed.");
    setTimeout(() => {
      location.href = "dashboard.html";
    }, 350);
  });
})();

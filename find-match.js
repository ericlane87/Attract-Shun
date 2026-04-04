(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("browse-user-chip", user ? `Browsing as ${user.name}` : "No active user");

  const traditionalPanel = document.getElementById("traditional-panel");
  const likesPanel = document.getElementById("incoming-likes-panel");
  const profileModal = document.getElementById("profile-modal");
  const modalCard = document.getElementById("profile-modal-card");
  const modalClose = document.getElementById("profile-modal-close");
  const state = {
    selectedCandidateId: "",
  };

  function candidateMeta(candidate) {
    return `${candidate.city} · ${candidate.sex || "Unspecified"} · ${AppData.formatIntent(candidate.intent)}`;
  }

  function closeModal() {
    profileModal.hidden = true;
    state.selectedCandidateId = "";
  }

  function applyAction(candidateId, direction, score) {
    const match = AppData.recordSwipe(user.id, candidateId, direction, score);
    closeModal();
    if (match) {
      window.location.href = "match.html";
      return;
    }
    render();
  }

  function openModal(candidateId) {
    state.selectedCandidateId = candidateId;
    const candidate = AppData.getUser(candidateId);
    if (!candidate) return;

    modalCard.innerHTML = `
      <div class="profile-top">
        <div>
          <p class="profile-name">${candidate.name}, ${candidate.age}</p>
          <p class="profile-meta">${candidateMeta(candidate)}</p>
        </div>
        <div class="avatar">${AppUI.initials(candidate.name)}</div>
      </div>
      <div class="modal-copy">
        <p class="small-copy">${candidate.bio}</p>
        <div class="summary-card">
          <p class="profile-name">Profile details</p>
          <p class="profile-meta">Intent: ${AppData.formatIntent(candidate.intent)} · City: ${candidate.city} · Sex: ${candidate.sex || "Unspecified"}</p>
        </div>
      </div>
      <label class="field">
        <span>How much do you like this person?</span>
        <input id="modal-interest-range" type="range" min="1" max="10" value="7">
      </label>
      <div class="range-readout" id="modal-interest-readout">7</div>
      <div class="swipe-actions">
        <button class="pass-button" id="modal-pass-btn" type="button">Pass</button>
        <button class="primary-button" id="modal-like-btn" type="button">Like With Score</button>
      </div>
    `;

    const range = document.getElementById("modal-interest-range");
    const readout = document.getElementById("modal-interest-readout");
    range.addEventListener("input", () => {
      readout.textContent = range.value;
    });

    document.getElementById("modal-pass-btn").addEventListener("click", () => {
      applyAction(candidate.id, "left");
    });
    document.getElementById("modal-like-btn").addEventListener("click", () => {
      applyAction(candidate.id, "right", Number(range.value));
    });

    profileModal.hidden = false;
  }

  function renderLockedState(title, body, href, label) {
    traditionalPanel.innerHTML = `
      <div class="candidate-card">
        <p class="profile-name">${title}</p>
        <p class="profile-meta">${body}</p>
        <div class="cta-row">
          <a class="primary-link" href="${href}">${label}</a>
        </div>
      </div>
    `;
  }

  function renderGrid(candidates) {
    traditionalPanel.innerHTML = `
      <div class="browse-summary">
        <div class="hint-box">Grid browse lays profiles out like a traditional dating site. Click any profile to open details and like them with a 1 to 10 score.</div>
      </div>
      <div class="profile-grid">
        ${candidates.map((candidate) => `
          <article class="profile-tile">
            <div class="profile-top">
              <div>
                <p class="profile-name">${candidate.name}, ${candidate.age}</p>
                <p class="profile-meta">${candidateMeta(candidate)}</p>
              </div>
              <div class="avatar">${AppUI.initials(candidate.name)}</div>
            </div>
            <p class="small-copy">${candidate.bio}</p>
            <div class="tile-actions">
              <button class="ghost-button" type="button" data-open-profile="${candidate.id}">Open Profile</button>
              <button class="primary-button" type="button" data-like-profile="${candidate.id}">Like</button>
            </div>
          </article>
        `).join("")}
      </div>
    `;

    traditionalPanel.querySelectorAll("[data-open-profile]").forEach((button) => {
      button.addEventListener("click", () => openModal(button.dataset.openProfile));
    });
    traditionalPanel.querySelectorAll("[data-like-profile]").forEach((button) => {
      button.addEventListener("click", () => openModal(button.dataset.likeProfile));
    });
  }

  function render() {
    if (!user) {
      traditionalPanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> and create or seed users first.</div>`;
      likesPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
      return;
    }

    AppUI.renderLikeList(likesPanel, AppData.getIncomingLikes(user.id));

    if (!user.onboardingCompleted) {
      renderLockedState("Browse locked", `${user.name} needs to complete onboarding before entering discovery.`, "onboarding.html", "Complete Onboarding");
      return;
    }

    const activeMatch = AppData.getActiveMatchForUser(user.id);
    if (activeMatch) {
      const otherUser = AppData.getOtherUser(activeMatch, user.id);
      renderLockedState("Browse locked by active match", `${user.name} is currently matched with ${otherUser.name}. Finish or exit the match before browsing more profiles.`, "match.html", "Open Active Match");
      return;
    }

    const candidates = AppData.getAvailableCandidates(user.id);
    if (!candidates.length) {
      traditionalPanel.innerHTML = `
        <div class="candidate-card">
          <p class="profile-name">No candidates available</p>
          <p class="profile-meta">There are no opposite-sex profiles left in this intent pool. Seed more users or switch the active account.</p>
        </div>
      `;
      return;
    }

    renderGrid(candidates);
  }

  modalClose.addEventListener("click", closeModal);
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) closeModal();
  });

  render();
})();

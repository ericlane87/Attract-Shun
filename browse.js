(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("browse-user-chip", user ? `Browsing as ${user.name}` : "No active user");

  const modeButtons = Array.from(document.querySelectorAll("[data-browse-mode]"));
  const traditionalPanel = document.getElementById("traditional-panel");
  const gamePanel = document.getElementById("matching-game-panel");
  const likesPanel = document.getElementById("incoming-likes-panel");
  const profileModal = document.getElementById("profile-modal");
  const modalCard = document.getElementById("profile-modal-card");
  const modalClose = document.getElementById("profile-modal-close");
  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get("mode") === "game" ? "game" : "traditional";
  const mode = {
    current: requestedMode,
    selectedCandidateId: "",
  };

  function candidateMeta(candidate) {
    return `${candidate.city} · ${candidate.sex || "Unspecified"} · ${AppData.formatIntent(candidate.intent)}`;
  }

  function openModal(candidateId) {
    mode.selectedCandidateId = candidateId;
    renderModal();
    profileModal.hidden = false;
  }

  function closeModal() {
    profileModal.hidden = true;
    mode.selectedCandidateId = "";
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

  function renderLockedState(message, href, label) {
    traditionalPanel.innerHTML = `
      <div class="candidate-card">
        <p class="profile-name">${message.title}</p>
        <p class="profile-meta">${message.body}</p>
        <div class="cta-row">
          <a class="primary-link" href="${href}">${label}</a>
        </div>
      </div>
    `;
    gamePanel.innerHTML = traditionalPanel.innerHTML;
  }

  function renderTraditional(candidates) {
    traditionalPanel.innerHTML = `
      <div class="browse-summary">
        <div class="hint-box">Traditional browse shows a full grid of profiles from the opposite sex inside the same intent pool. Open any profile for details and a 1 to 10 like score.</div>
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

  function renderGame(candidates) {
    const candidate = candidates[0];
    if (!candidate) {
      gamePanel.innerHTML = `
        <div class="candidate-card">
          <p class="profile-name">No matching-game profiles left</p>
          <p class="profile-meta">There are no more opposite-sex profiles available in this intent pool right now.</p>
        </div>
      `;
      return;
    }

    gamePanel.innerHTML = `
      <div class="candidate-card matching-game-card">
        <div class="profile-top">
          <div>
            <p class="profile-name">${candidate.name}, ${candidate.age}</p>
            <p class="profile-meta">${candidateMeta(candidate)}</p>
          </div>
          <div class="avatar">${AppUI.initials(candidate.name)}</div>
        </div>
        <p class="small-copy">${candidate.bio}</p>
        <div class="hint-box">Matching game mode keeps one profile in focus. A like always asks for a 1 to 10 score before recording interest.</div>
        <label class="field">
          <span>Interest score</span>
          <input id="game-interest-range" type="range" min="0" max="10" value="0">
        </label>
        <div class="range-readout" id="game-interest-readout">0</div>
        <div class="swipe-actions">
          <button class="pass-button" id="game-pass-btn" type="button">Pass</button>
          <button class="ghost-button" id="game-profile-btn" type="button">Open Profile</button>
          <button class="primary-button" id="game-like-btn" type="button" disabled>Like</button>
        </div>
      </div>
    `;

    const range = document.getElementById("game-interest-range");
    const readout = document.getElementById("game-interest-readout");
    const likeButton = document.getElementById("game-like-btn");
    range.addEventListener("input", () => {
      readout.textContent = range.value;
      likeButton.disabled = Number(range.value) <= 0;
    });

    document.getElementById("game-pass-btn").addEventListener("click", () => {
      AppData.recordSwipe(user.id, candidate.id, "left");
      render();
    });
    document.getElementById("game-profile-btn").addEventListener("click", () => openModal(candidate.id));
    likeButton.addEventListener("click", () => {
      if (Number(range.value) <= 0) return;
      const match = AppData.recordSwipe(user.id, candidate.id, "right", Number(range.value));
      if (match) {
        window.location.href = "match.html";
        return;
      }
      render();
    });
  }

  function renderModal() {
    const candidate = AppData.getUser(mode.selectedCandidateId);
    if (!candidate) {
      modalCard.innerHTML = `<div class="empty-state">This profile is no longer available.</div>`;
      return;
    }

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
        <input id="modal-interest-range" type="range" min="0" max="10" value="0">
      </label>
      <div class="range-readout" id="modal-interest-readout">0</div>
      <div class="swipe-actions">
        <button class="pass-button" id="modal-pass-btn" type="button">Pass</button>
        <a class="ghost-link" href="messages.html">Messages</a>
        <button class="primary-button" id="modal-like-btn" type="button" disabled>Like</button>
      </div>
    `;

    const range = document.getElementById("modal-interest-range");
    const readout = document.getElementById("modal-interest-readout");
    const likeButton = document.getElementById("modal-like-btn");
    range.addEventListener("input", () => {
      readout.textContent = range.value;
      likeButton.disabled = Number(range.value) <= 0;
    });

    document.getElementById("modal-pass-btn").addEventListener("click", () => {
      applyAction(candidate.id, "left");
    });
    likeButton.addEventListener("click", () => {
      if (Number(range.value) <= 0) return;
      applyAction(candidate.id, "right", Number(range.value));
    });
  }

  function setMode(nextMode) {
    mode.current = nextMode;
    modeButtons.forEach((button) => {
      button.dataset.selected = button.dataset.browseMode === nextMode ? "true" : "false";
    });
    traditionalPanel.hidden = nextMode !== "traditional";
    gamePanel.hidden = nextMode !== "game";
  }

  function render() {
    if (!user) {
      traditionalPanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> and create or seed users first.</div>`;
      gamePanel.innerHTML = `<div class="empty-state">No active user.</div>`;
      likesPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
      return;
    }

    AppUI.renderLikeList(likesPanel, AppData.getIncomingLikes(user.id));

    if (!user.onboardingCompleted) {
      renderLockedState(
        {
          title: "Browse locked",
          body: `${user.name} needs to complete onboarding before entering discovery.`,
        },
        "onboarding.html",
        "Complete Onboarding"
      );
      return;
    }

    const activeMatch = AppData.getActiveMatchForUser(user.id);
    if (activeMatch) {
      const otherUser = AppData.getOtherUser(activeMatch, user.id);
      renderLockedState(
        {
          title: "Browse locked by active match",
          body: `${user.name} is currently matched with ${otherUser.name}. Finish or exit the match before browsing more profiles.`,
        },
        "match.html",
        "Open Active Match"
      );
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
      gamePanel.innerHTML = traditionalPanel.innerHTML;
      return;
    }

    renderTraditional(candidates);
    renderGame(candidates);
    setMode(mode.current);
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.browseMode);
    });
  });

  modalClose.addEventListener("click", closeModal);
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) closeModal();
  });

  setMode(mode.current);
  render();
})();

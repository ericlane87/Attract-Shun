(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;

  const user = AppData.currentUser();
  AppUI.setPageChip("browse-user-chip", user ? `Browsing as ${user.name}` : "No active user");

  const traditionalPanel = document.getElementById("traditional-panel");
  const likesPanel = document.getElementById("incoming-likes-panel");
  const pageIntro = document.querySelector(".page-intro");
  const profileModal = document.getElementById("profile-modal");
  const modalCard = document.getElementById("profile-modal-card");
  const modalClose = document.getElementById("profile-modal-close");
  const modalState = {
    candidateId: "",
    photoIndex: 0,
    touchStartX: 0,
  };
  const browseState = {
    page: 0,
    pageSize: 25,
  };

  function candidateMeta(candidate) {
    return `${candidate.city} · ${candidate.sex || "Unspecified"} · ${AppData.formatIntent(candidate.intent)}`;
  }

  function closeModal() {
    profileModal.hidden = true;
    document.body.classList.remove("modal-open");
    modalState.candidateId = "";
    modalState.photoIndex = 0;
  }

  function scrollToBrowseTop() {
    const topTarget = pageIntro || traditionalPanel;
    if (!topTarget) return;
    topTarget.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const candidate = AppData.getUser(candidateId);
    if (!candidate) return;
    modalState.candidateId = candidateId;
    modalState.photoIndex = 0;
    renderModal(candidate);
    profileModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function renderModal(candidate) {
    const photos = candidate.photos && candidate.photos.length
      ? candidate.photos
      : [{ id: `${candidate.id}-photo-1`, label: "Profile photo" }];
    const currentPhoto = photos[modalState.photoIndex] || photos[0];
    const dealMakers = candidate.dealMakers && candidate.dealMakers.length
      ? candidate.dealMakers
      : ["Clear communication", "Consistency", "Shared values"];
    const dealBreakers = candidate.dealBreakers && candidate.dealBreakers.length
      ? candidate.dealBreakers
      : ["Dishonesty", "Disrespect", "Flaky communication"];
    const candidateLikedYou = AppData.hasIncomingLike(candidate.id, user.id);
    const pendingRequest = AppData.getPendingMatchRequestBetween(user.id, candidate.id);

    modalCard.innerHTML = `
      <div class="profile-modal-layout">
        <div class="profile-modal-main">
          <div class="profile-carousel" id="profile-carousel">
            <button class="ghost-button carousel-button" type="button" id="photo-prev-btn" ${photos.length <= 1 ? "disabled" : ""}>Prev</button>
            ${AppUI.renderProfilePhoto(candidate, "profile-photo profile-photo-modal", modalState.photoIndex)}
            <button class="ghost-button carousel-button" type="button" id="photo-next-btn" ${photos.length <= 1 ? "disabled" : ""}>Next</button>
            <div class="photo-caption">${currentPhoto.label}</div>
          </div>
          <div class="photo-dots">
            ${photos.map((photo, index) => `
              <button class="photo-dot${index === modalState.photoIndex ? " active" : ""}" type="button" data-photo-index="${index}" aria-label="Open photo ${index + 1}"></button>
            `).join("")}
          </div>
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
            ${candidateLikedYou ? `
              <div class="summary-card">
                <p class="profile-name">This person already liked you</p>
                <p class="profile-meta">Use Match to send a match request. The other person will need to confirm before you both lock into one active match.</p>
              </div>
            ` : ""}
            <div class="detail-card detail-card-inline">
              <p class="detail-heading">Deal Makers</p>
              <div class="detail-list">
                ${dealMakers.map((item) => `<span class="detail-pill positive">${item}</span>`).join("")}
              </div>
            </div>
            <div class="detail-card detail-card-inline">
              <p class="detail-heading">Deal Breakers</p>
              <div class="detail-list">
                ${dealBreakers.map((item) => `<span class="detail-pill negative">${item}</span>`).join("")}
              </div>
            </div>
          </div>
          ${candidateLikedYou ? "" : `
            <label class="field">
              <span>How much do you like this person?</span>
              <input id="modal-interest-range" type="range" min="0" max="10" value="0">
            </label>
            <div class="range-readout" id="modal-interest-readout">0</div>
          `}
          <div class="swipe-actions">
            <button class="pass-button" id="modal-pass-btn" type="button">Pass</button>
            <button class="primary-button" id="modal-like-btn" type="button" ${candidateLikedYou ? (pendingRequest ? "disabled" : "") : "disabled"}>
              ${candidateLikedYou ? (pendingRequest ? "Match Request Sent" : "Match") : "Like"}
            </button>
          </div>
        </div>
        <aside class="profile-modal-side">
          <div class="detail-card">
            <p class="detail-heading">Deal Makers</p>
            <div class="detail-list">
              ${dealMakers.map((item) => `<span class="detail-pill positive">${item}</span>`).join("")}
            </div>
          </div>
          <div class="detail-card">
            <p class="detail-heading">Deal Breakers</p>
            <div class="detail-list">
              ${dealBreakers.map((item) => `<span class="detail-pill negative">${item}</span>`).join("")}
            </div>
          </div>
        </aside>
      </div>
    `;

    const likeButton = document.getElementById("modal-like-btn");
    const range = document.getElementById("modal-interest-range");
    const readout = document.getElementById("modal-interest-readout");
    if (range && readout) {
      range.addEventListener("input", () => {
        readout.textContent = range.value;
        likeButton.disabled = Number(range.value) <= 0;
      });
    }
    document.getElementById("modal-pass-btn").addEventListener("click", () => {
      applyAction(candidate.id, "left");
    });
    likeButton.addEventListener("click", () => {
      if (candidateLikedYou) {
        const request = AppData.sendMatchRequest(user.id, candidate.id);
        if (!request) return;
        closeModal();
        render();
        return;
      }
      if (Number(range.value) <= 0) return;
      applyAction(candidate.id, "right", Number(range.value));
    });

    const prevBtn = document.getElementById("photo-prev-btn");
    const nextBtn = document.getElementById("photo-next-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        modalState.photoIndex = (modalState.photoIndex - 1 + photos.length) % photos.length;
        renderModal(candidate);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        modalState.photoIndex = (modalState.photoIndex + 1) % photos.length;
        renderModal(candidate);
      });
    }
    modalCard.querySelectorAll("[data-photo-index]").forEach((button) => {
      button.addEventListener("click", () => {
        modalState.photoIndex = Number(button.dataset.photoIndex);
        renderModal(candidate);
      });
    });
    const carousel = document.getElementById("profile-carousel");
    carousel.addEventListener("touchstart", (event) => {
      modalState.touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    carousel.addEventListener("touchend", (event) => {
      const delta = event.changedTouches[0].clientX - modalState.touchStartX;
      if (Math.abs(delta) < 30 || photos.length <= 1) return;
      modalState.photoIndex = delta < 0
        ? (modalState.photoIndex + 1) % photos.length
        : (modalState.photoIndex - 1 + photos.length) % photos.length;
      renderModal(candidate);
    }, { passive: true });
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
    const totalPages = Math.max(1, Math.ceil(candidates.length / browseState.pageSize));
    if (browseState.page >= totalPages) {
      browseState.page = totalPages - 1;
    }
    const start = browseState.page * browseState.pageSize;
    const pageCandidates = candidates.slice(start, start + browseState.pageSize);
    const pageButtons = Array.from({ length: totalPages }, (_, index) => `
      <button
        class="${index === browseState.page ? "primary-button" : "ghost-button"} pagination-chip"
        type="button"
        data-page-index="${index}"
        aria-label="Open page ${index + 1}">
        ${index + 1}
      </button>
    `).join("");

    traditionalPanel.innerHTML = `
      <div class="browse-summary">
        <div class="hint-box">Grid browse shows recently logged-in profiles first. Each page shows 25 profiles in a 5 by 5 layout.</div>
      </div>
      <div class="profile-grid">
        ${pageCandidates.map((candidate) => `
          <article class="profile-tile" data-open-profile="${candidate.id}" tabindex="0" role="button" aria-label="Open ${candidate.name}'s profile">
            ${AppUI.renderProfilePhoto(candidate)}
            <div class="profile-top profile-tile-meta">
              <div>
                <p class="profile-name">${candidate.name}, ${candidate.age}</p>
                <p class="profile-meta">${candidateMeta(candidate)}</p>
              </div>
            </div>
            <p class="small-copy">${candidate.bio}</p>
            <div class="tile-actions">
              <button class="ghost-button" type="button" data-open-profile="${candidate.id}">Open Profile</button>
              <button class="primary-button" type="button" data-like-profile="${candidate.id}">Like</button>
            </div>
          </article>
        `).join("")}
      </div>
      <div class="pagination-row">
        <button class="ghost-button" type="button" id="profiles-prev-btn" ${browseState.page === 0 ? "disabled" : ""}>Previous</button>
        <div class="pagination-pages">${pageButtons}</div>
        <button class="primary-button" type="button" id="profiles-next-btn" ${browseState.page >= totalPages - 1 ? "disabled" : ""}>Next</button>
      </div>
    `;

    traditionalPanel.querySelectorAll("[data-open-profile]").forEach((button) => {
      button.addEventListener("click", () => openModal(button.dataset.openProfile));
    });
    traditionalPanel.querySelectorAll("[data-like-profile]").forEach((button) => {
      button.addEventListener("click", () => openModal(button.dataset.likeProfile));
    });
    traditionalPanel.querySelectorAll(".profile-tile[data-open-profile]").forEach((tile) => {
      tile.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        openModal(tile.dataset.openProfile);
      });
      tile.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(tile.dataset.openProfile);
        }
      });
    });
    const prevButton = document.getElementById("profiles-prev-btn");
    const nextButton = document.getElementById("profiles-next-btn");
    if (prevButton) {
      prevButton.addEventListener("click", () => {
        browseState.page = Math.max(0, browseState.page - 1);
        render();
        scrollToBrowseTop();
      });
    }
    if (nextButton) {
      nextButton.addEventListener("click", () => {
        browseState.page += 1;
        render();
        scrollToBrowseTop();
      });
    }
    traditionalPanel.querySelectorAll("[data-page-index]").forEach((button) => {
      button.addEventListener("click", () => {
        browseState.page = Number(button.dataset.pageIndex);
        render();
        scrollToBrowseTop();
      });
    });
  }

  function render() {
    if (!user) {
      traditionalPanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> and create or seed users first.</div>`;
      likesPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
      return;
    }

    if (AppData.state.users.length < 100) {
      AppData.seedDemoUsers();
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

    const candidates = AppData.getBrowseCandidates(user.id);
    const fallbackCandidates = AppData.state.users
      .filter((candidate) => candidate.id !== user.id)
      .filter((candidate) => candidate.accountStatus !== "banned")
      .filter((candidate) => candidate.preferences && candidate.preferences.profileVisible !== false)
      .sort((left, right) => left.name.localeCompare(right.name));
    const visibleCandidates = candidates.length ? candidates : fallbackCandidates;
    if (!visibleCandidates.length) {
      traditionalPanel.innerHTML = `
        <div class="candidate-card">
          <p class="profile-name">No candidates available</p>
          <p class="profile-meta">There are no visible profiles available right now. Reset local data or seed more users in Admin.</p>
        </div>
      `;
      return;
    }

    browseState.page = Math.min(browseState.page, Math.max(0, Math.ceil(visibleCandidates.length / browseState.pageSize) - 1));
    renderGrid(visibleCandidates);
  }

  modalClose.addEventListener("click", closeModal);
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) closeModal();
  });

  render();
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.setPageChip("likes-user-chip", user ? `Likes for ${user.name}` : "No active user");

  const likesListEl = document.getElementById("likes-list");
  const summaryEl = document.getElementById("likes-summary");
  const profileModal = document.getElementById("likes-profile-modal");
  const modalCard = document.getElementById("likes-profile-modal-card");
  const modalClose = document.getElementById("likes-profile-modal-close");
  const modalState = {
    candidateId: "",
    photoIndex: 0,
    touchStartX: 0,
  };

  if (!user) {
    likesListEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    summaryEl.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  function closeModal() {
    profileModal.hidden = true;
    document.body.classList.remove("modal-open");
    modalState.candidateId = "";
    modalState.photoIndex = 0;
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
    const pendingRequest = AppData.getPendingMatchRequestBetween(user.id, candidate.id);

    modalCard.innerHTML = `
      <div class="profile-modal-layout">
        <div class="profile-modal-main">
          <div class="profile-carousel" id="likes-profile-carousel">
            <button class="ghost-button carousel-button" type="button" id="likes-photo-prev-btn" ${photos.length <= 1 ? "disabled" : ""}>Prev</button>
            ${AppUI.renderProfilePhoto(candidate, "profile-photo profile-photo-modal", modalState.photoIndex)}
            <button class="ghost-button carousel-button" type="button" id="likes-photo-next-btn" ${photos.length <= 1 ? "disabled" : ""}>Next</button>
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
              <p class="profile-meta">${candidate.city} · ${candidate.sex || "Unspecified"} · ${AppData.formatIntent(candidate.intent)}</p>
            </div>
            <div class="avatar">${AppUI.initials(candidate.name)}</div>
          </div>
          <div class="modal-copy">
            <p class="small-copy">${candidate.bio}</p>
            <div class="summary-card">
              <p class="profile-name">This person liked you</p>
              <p class="profile-meta">Review the profile. If you want to move forward, send a match request instead of another like.</p>
            </div>
          </div>
          <div class="swipe-actions">
            <button class="pass-button" id="likes-modal-close-btn" type="button">Close</button>
            <button class="primary-button" id="likes-modal-match-btn" type="button" ${pendingRequest ? "disabled" : ""}>
              ${pendingRequest ? "Match Request Sent" : "Send Match Request"}
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

    document.getElementById("likes-modal-close-btn").addEventListener("click", closeModal);
    const matchButton = document.getElementById("likes-modal-match-btn");
    if (matchButton) {
      matchButton.addEventListener("click", () => {
        const request = AppData.sendMatchRequest(user.id, candidate.id);
        if (!request) return;
        closeModal();
        render();
      });
    }

    const prevBtn = document.getElementById("likes-photo-prev-btn");
    const nextBtn = document.getElementById("likes-photo-next-btn");
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

    const carousel = document.getElementById("likes-profile-carousel");
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

  function render() {
    const likes = AppData.getIncomingLikes(user.id);
    const outgoingRequests = AppData.getOutgoingMatchRequests(user.id);

    if (!likes.length) {
      likesListEl.innerHTML = `<div class="empty-state">No incoming likes yet.</div>`;
    } else {
      likesListEl.innerHTML = likes.map(({ swipe, user: candidate }) => {
        const pendingRequest = AppData.getPendingMatchRequestBetween(user.id, candidate.id);
        return `
          <div class="like-row actionable-row" data-open-like-profile="${candidate.id}">
            <div>
              <p class="profile-name">${candidate.name}</p>
              <p class="profile-meta">${candidate.age} · ${candidate.city} · ${AppData.formatIntent(candidate.intent)}</p>
            </div>
            <div class="cta-row">
              <span class="interest-pill">${swipe.interestScore}/10 interest</span>
              <button class="ghost-button" type="button" data-open-like-profile="${candidate.id}">Open</button>
              <button class="primary-button" type="button" data-send-match-request="${candidate.id}" ${pendingRequest ? "disabled" : ""}>
                ${pendingRequest ? "Sent" : "Match"}
              </button>
            </div>
          </div>
        `;
      }).join("");
    }

    likesListEl.querySelectorAll("[data-open-like-profile]").forEach((button) => {
      button.addEventListener("click", () => openModal(button.dataset.openLikeProfile));
    });

    likesListEl.querySelectorAll("[data-send-match-request]").forEach((button) => {
      button.addEventListener("click", () => {
        const request = AppData.sendMatchRequest(user.id, button.dataset.sendMatchRequest);
        if (!request) return;
        render();
      });
    });

    summaryEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">${likes.length} incoming like${likes.length === 1 ? "" : "s"}</p>
        <p class="profile-meta">${outgoingRequests.length} outgoing match request${outgoingRequests.length === 1 ? "" : "s"} currently waiting for confirmation.</p>
        <div class="cta-row">
          <a class="primary-link" href="match-requests.html">Open Match Requests</a>
          <a class="ghost-link" href="dashboard.html">Back To Dashboard</a>
        </div>
      </div>
    `;
  }

  modalClose.addEventListener("click", closeModal);
  profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) closeModal();
  });

  render();
})();

(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.setPageChip("match-requests-user-chip", user ? `Requests for ${user.name}` : "No active user");

  const listEl = document.getElementById("match-requests-list");
  const summaryEl = document.getElementById("match-requests-summary");
  const profileModal = document.getElementById("match-request-modal");
  const modalCard = document.getElementById("match-request-modal-card");
  const modalClose = document.getElementById("match-request-modal-close");
  const modalState = {
    requestId: "",
    photoIndex: 0,
    touchStartX: 0,
  };

  if (!user) {
    listEl.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> to create or seed users first.</div>`;
    summaryEl.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  function closeModal() {
    profileModal.hidden = true;
    document.body.classList.remove("modal-open");
    modalState.requestId = "";
    modalState.photoIndex = 0;
  }

  function openModal(requestId) {
    const requestEntry = AppData.getIncomingMatchRequests(user.id).find((entry) => entry.request.id === requestId);
    if (!requestEntry) return;
    modalState.requestId = requestId;
    modalState.photoIndex = 0;
    renderModal(requestEntry);
    profileModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function confirmRequest(requestId) {
    const match = AppData.confirmMatchRequest(requestId, user.id);
    if (!match) return;
    window.location.href = "dashboard.html";
  }

  function renderModal(entry) {
    const candidate = entry.user;
    const request = entry.request;
    const photos = candidate.photos && candidate.photos.length
      ? candidate.photos
      : [{ id: `${candidate.id}-photo-1`, label: "Profile photo" }];
    const currentPhoto = photos[modalState.photoIndex] || photos[0];

    modalCard.innerHTML = `
      <div class="profile-modal-layout">
        <div class="profile-modal-main">
          <div class="profile-carousel" id="request-profile-carousel">
            <button class="ghost-button carousel-button" type="button" id="request-photo-prev-btn" ${photos.length <= 1 ? "disabled" : ""}>Prev</button>
            ${AppUI.renderProfilePhoto(candidate, "profile-photo profile-photo-modal", modalState.photoIndex)}
            <button class="ghost-button carousel-button" type="button" id="request-photo-next-btn" ${photos.length <= 1 ? "disabled" : ""}>Next</button>
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
              <p class="profile-name">Pending match request</p>
              <p class="profile-meta">Requested on ${AppUI.formatDate(request.createdAt)}. Confirming locks both people into one active match and redirects to the dashboard.</p>
            </div>
          </div>
          <div class="swipe-actions">
            <button class="pass-button" id="request-modal-close-btn" type="button">Close</button>
            <button class="primary-button" id="request-confirm-btn" type="button">Confirm Match</button>
          </div>
        </div>
        <aside class="profile-modal-side">
          <div class="detail-card">
            <p class="detail-heading">Deal Makers</p>
            <div class="detail-list">
              ${(candidate.dealMakers || []).map((item) => `<span class="detail-pill positive">${item}</span>`).join("")}
            </div>
          </div>
          <div class="detail-card">
            <p class="detail-heading">Deal Breakers</p>
            <div class="detail-list">
              ${(candidate.dealBreakers || []).map((item) => `<span class="detail-pill negative">${item}</span>`).join("")}
            </div>
          </div>
        </aside>
      </div>
    `;

    document.getElementById("request-modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("request-confirm-btn").addEventListener("click", () => {
      confirmRequest(request.id);
    });

    const prevBtn = document.getElementById("request-photo-prev-btn");
    const nextBtn = document.getElementById("request-photo-next-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        modalState.photoIndex = (modalState.photoIndex - 1 + photos.length) % photos.length;
        renderModal(entry);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        modalState.photoIndex = (modalState.photoIndex + 1) % photos.length;
        renderModal(entry);
      });
    }
    modalCard.querySelectorAll("[data-photo-index]").forEach((button) => {
      button.addEventListener("click", () => {
        modalState.photoIndex = Number(button.dataset.photoIndex);
        renderModal(entry);
      });
    });
  }

  function render() {
    const requests = AppData.getIncomingMatchRequests(user.id);

    if (!requests.length) {
      listEl.innerHTML = `<div class="empty-state">No pending match requests right now.</div>`;
    } else {
      listEl.innerHTML = requests.map(({ request, user: candidate }) => `
        <div class="like-row actionable-row">
          <div>
            <p class="profile-name">${candidate.name}</p>
            <p class="profile-meta">${candidate.age} · ${candidate.city} · ${AppData.formatIntent(candidate.intent)}</p>
            <p class="small-copy">Requested on ${AppUI.formatDate(request.createdAt)}</p>
          </div>
          <div class="cta-row">
            <button class="ghost-button" type="button" data-open-request="${request.id}">Open</button>
            <button class="primary-button" type="button" data-confirm-request="${request.id}">Confirm Match</button>
          </div>
        </div>
      `).join("");
    }

    listEl.querySelectorAll("[data-open-request]").forEach((button) => {
      button.addEventListener("click", () => openModal(button.dataset.openRequest));
    });
    listEl.querySelectorAll("[data-confirm-request]").forEach((button) => {
      button.addEventListener("click", () => confirmRequest(button.dataset.confirmRequest));
    });

    summaryEl.innerHTML = `
      <div class="summary-card">
        <p class="profile-name">${requests.length} pending match request${requests.length === 1 ? "" : "s"}</p>
        <p class="profile-meta">Once you confirm, both people are locked into one active match and the next steps move to the dashboard and match flow.</p>
        <div class="cta-row">
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

(async function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const AppMediaStore = window.AppMediaStore;

  const user = AppData.currentUser();
  AppUI.setPageChip("match-user-chip", user ? `Matching as ${user.name}` : "No active user");

  const matchPanel = document.getElementById("match-panel");
  const chatPanel = document.getElementById("chat-panel");
  const recorderState = {
    stream: null,
    recorder: null,
    chunks: [],
    blob: null,
    mimeType: "",
    previewUrl: "",
    sourceLabel: "",
    durationSeconds: 0,
  };
  const INTRO_MAX_SECONDS = 60;

  function formatTimeRemaining(deadlineIso) {
    const diffMs = new Date(deadlineIso).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
    if (totalHours < 24) return `${totalHours} hour${totalHours === 1 ? "" : "s"} left`;
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours ? `${days}d ${hours}h left` : `${days} day${days === 1 ? "" : "s"} left`;
  }

  function preferredMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    return candidates.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) || "";
  }

  function cleanupPreviewUrl() {
    if (recorderState.previewUrl) {
      URL.revokeObjectURL(recorderState.previewUrl);
      recorderState.previewUrl = "";
    }
  }

  function stopTracks() {
    if (recorderState.stream) {
      recorderState.stream.getTracks().forEach((track) => track.stop());
      recorderState.stream = null;
    }
  }

  function resetRecorder() {
    cleanupPreviewUrl();
    stopTracks();
    recorderState.recorder = null;
    recorderState.chunks = [];
    recorderState.blob = null;
    recorderState.mimeType = "";
    recorderState.sourceLabel = "";
    recorderState.durationSeconds = 0;
  }

  function setPreviewBlob(blob, mimeType, sourceLabel) {
    recorderState.blob = blob;
    recorderState.mimeType = mimeType || blob.type || "video/webm";
    recorderState.sourceLabel = sourceLabel || "Video ready for review";
    cleanupPreviewUrl();
    recorderState.previewUrl = URL.createObjectURL(blob);
  }

  async function getStoredVideoUrl(mediaId) {
    if (!AppMediaStore || !mediaId) return "";
    try {
      const record = await AppMediaStore.getIntroVideo(mediaId);
      if (!record || !record.blob) return "";
      return URL.createObjectURL(record.blob);
    } catch (error) {
      console.error("Failed to load intro video", error);
      return "";
    }
  }

  function getVideoDuration(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = Number(video.duration || 0);
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read video duration"));
      };
      video.src = url;
    });
  }

  if (!user) {
    matchPanel.innerHTML = `<div class="empty-state">Open <a href="admin.html">Admin</a> and create or seed users first.</div>`;
    chatPanel.innerHTML = `<div class="empty-state">No active user.</div>`;
    return;
  }

  const match = AppData.getActiveMatchForUser(user.id);
  if (!match) {
    const latest = AppData.getLatestMatchForUser(user.id);
    if (!latest) {
      matchPanel.innerHTML = `<div class="empty-state">No active or past match yet.</div>`;
      chatPanel.innerHTML = `<div class="empty-state">Conversation opens only during an active match.</div>`;
      return;
    }

    const other = AppData.getOtherUser(latest, user.id);
    matchPanel.innerHTML = `
      <div class="match-card">
        <p class="profile-name">Latest match with ${other.name}</p>
        <p class="profile-meta">${latest.closedReason}</p>
        <div class="meta-row">
          <span class="status-pill">${latest.status.replace("_", " ")}</span>
          <a class="ghost-link" href="${latest.status === "attract" ? "success.html" : "browse.html"}">${latest.status === "attract" ? "Open Success Stories" : "Return To Browse"}</a>
        </div>
      </div>
    `;
    chatPanel.innerHTML = `<div class="empty-state">Conversation is unavailable because there is no active match.</div>`;
    return;
  }

  const otherUser = AppData.getOtherUser(match, user.id);
  AppData.markMessagesRead(user.id, match.id);
  const myIntro = match.introVideos[user.id] || null;
  const otherIntro = match.introVideos[otherUser.id] || null;
  const datePlanningState = AppData.getDatePlanningState(match, user.id);
  const myDecision = match.decisions[user.id];
  const myMediaId = (myIntro && myIntro.mediaId) || `intro:${match.id}:${user.id}`;
  const otherMediaId = otherIntro && otherIntro.mediaId;

  async function startRecording() {
    const errorEl = document.getElementById("intro-recorder-error");
    if (errorEl) errorEl.textContent = "";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      if (errorEl) errorEl.textContent = "This browser does not support video recording.";
      return;
    }

    resetRecorder();

    try {
      recorderState.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      recorderState.mimeType = preferredMimeType();
      recorderState.recorder = recorderState.mimeType
        ? new MediaRecorder(recorderState.stream, { mimeType: recorderState.mimeType })
        : new MediaRecorder(recorderState.stream);
      recorderState.chunks = [];
      recorderState.recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size) recorderState.chunks.push(event.data);
      });
      recorderState.recorder.addEventListener("stop", () => {
        const blob = new Blob(recorderState.chunks, {
          type: recorderState.recorder.mimeType || recorderState.mimeType || "video/webm",
        });
        const errorEl = document.getElementById("intro-recorder-error");
        if (errorEl) errorEl.textContent = "";
        getVideoDuration(blob)
          .then((durationSeconds) => {
            if (durationSeconds > INTRO_MAX_SECONDS) {
              resetRecorder();
              if (errorEl) errorEl.textContent = "Intro videos must be 60 seconds or less.";
              renderMatchPanel();
              return;
            }
            recorderState.durationSeconds = durationSeconds;
            setPreviewBlob(
              blob,
              recorderState.recorder.mimeType || recorderState.mimeType || "video/webm",
              `Recording ready for review • ${Math.max(1, Math.round(durationSeconds))} sec`
            );
            renderMatchPanel();
          })
          .catch(() => {
            resetRecorder();
            if (errorEl) errorEl.textContent = "Could not read the recorded video length.";
            renderMatchPanel();
          });
      });
      recorderState.recorder.start();
      renderMatchPanel();
    } catch (error) {
      console.error("Failed to start recorder", error);
      if (errorEl) errorEl.textContent = "Camera or microphone access was blocked.";
    }
  }

  function stopRecording() {
    if (!recorderState.recorder || recorderState.recorder.state !== "recording") return;
    recorderState.recorder.stop();
    stopTracks();
  }

  async function submitRecordedIntro() {
    const errorEl = document.getElementById("intro-recorder-error");
    if (errorEl) errorEl.textContent = "";
    if (!recorderState.blob) return;

    try {
      await AppMediaStore.saveIntroVideo(myMediaId, {
        blob: recorderState.blob,
        mimeType: recorderState.mimeType || recorderState.blob.type || "video/webm",
      });
      AppData.submitIntro(match.id, user.id, {
        mediaId: myMediaId,
        mimeType: recorderState.mimeType || recorderState.blob.type || "video/webm",
        sizeBytes: recorderState.blob.size,
        durationSeconds: recorderState.durationSeconds,
      });
      resetRecorder();
      location.reload();
    } catch (error) {
      console.error("Failed to save recorded intro", error);
      if (errorEl) errorEl.textContent = "Could not save the intro video in this browser.";
    }
  }

  function submitMockIntro() {
    AppData.submitIntro(match.id, user.id, {
      mediaId: "",
      mimeType: "mock/testing",
      sizeBytes: 0,
      durationSeconds: 0,
    });
    location.reload();
  }

  async function handleUploadSelection(event) {
    const errorEl = document.getElementById("intro-recorder-error");
    if (errorEl) errorEl.textContent = "";
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith("video/")) {
      if (errorEl) errorEl.textContent = "Choose a video file to upload.";
      event.target.value = "";
      return;
    }
    try {
      const durationSeconds = await getVideoDuration(file);
      if (durationSeconds > INTRO_MAX_SECONDS) {
        if (errorEl) errorEl.textContent = "Uploaded intro videos must be 60 seconds or less.";
        event.target.value = "";
        return;
      }
      resetRecorder();
      recorderState.durationSeconds = durationSeconds;
      setPreviewBlob(file, file.type, `Upload ready for review: ${file.name} • ${Math.max(1, Math.round(durationSeconds))} sec`);
      renderMatchPanel();
    } catch (error) {
      console.error("Failed to inspect uploaded video", error);
      if (errorEl) errorEl.textContent = "Could not read the uploaded video length.";
      event.target.value = "";
    }
  }

  function introStudioMarkup() {
    if (match.status !== "pending_intro") return "";

    if (myIntro) {
      return `
        <div class="summary-card intro-studio">
          <p class="profile-name">Your intro video</p>
          <div id="my-intro-slot" class="intro-video-stack">
            <div class="small-copy">Intro submitted. Playback appears below if the video exists in this browser.</div>
          </div>
        </div>
      `;
    }

    const isRecording = recorderState.recorder && recorderState.recorder.state === "recording";
    const hasReviewVideo = !!recorderState.previewUrl;
    return `
      <div class="summary-card intro-studio">
        <p class="profile-name">Record your intro</p>
        <p class="profile-meta">Record a real intro video with your camera and microphone, or upload a video file. Videos must be 60 seconds or less. Review it first, then send it into the match flow.</p>
        <div id="intro-recorder-error" class="auth-error"></div>
        <div class="intro-video-stack">
          ${isRecording ? `<video id="intro-live-preview" class="intro-video-player" autoplay muted playsinline></video>` : ""}
          ${recorderState.previewUrl ? `
            <div class="hint-box">
              <strong>Review before sending</strong>
              <div class="small-copy">${recorderState.sourceLabel || "Watch your video and confirm you are happy with it before sending."}</div>
            </div>
            <video class="intro-video-player" controls playsinline src="${recorderState.previewUrl}"></video>
            <div class="small-copy">Are you happy with this recording?</div>
          ` : ""}
        </div>
        <div class="button-row">
          <button id="start-recording-btn" class="ghost-button" type="button" ${isRecording ? "disabled" : ""}>Start Recording</button>
          <button id="stop-recording-btn" class="ghost-button" type="button" ${isRecording ? "" : "disabled"}>Stop Recording</button>
          <label class="ghost-button file-upload-button" for="intro-upload-input">Upload Video</label>
          <button id="submit-mock-intro-btn" class="ghost-button" type="button">Mark Intro As Sent</button>
        </div>
        <input id="intro-upload-input" class="visually-hidden" type="file" accept="video/*">
        <div class="small-copy">Testing shortcut: use "Mark Intro As Sent" to move forward without recording or uploading a real video.</div>
        ${hasReviewVideo ? `
          <div class="button-row">
            <button id="record-again-btn" class="ghost-button" type="button">Record Again</button>
            <button id="submit-recording-btn" class="primary-button" type="button">Yes, Send Video</button>
          </div>
        ` : ""}
      </div>
    `;
  }

  function partnerIntroMarkup() {
    if (match.status !== "pending_intro" && !otherIntro) return "";
    return `
      <div class="summary-card">
        <p class="profile-name">${otherUser.name}'s intro</p>
        <div id="other-intro-slot" class="intro-video-stack">
          <div class="small-copy">${otherIntro ? "Intro submitted. Playback appears below if this browser has access to the stored video." : "Waiting for intro submission."}</div>
        </div>
      </div>
    `;
  }

  function datePlannerMarkup() {
    if (match.status !== "date_planning") return "";

    const proposal = match.dateProposal;
    const hasProposal = !!(proposal && proposal.proposedFor);
    const proposedByOther = hasProposal && proposal.proposedByUserId !== user.id;
    const acceptedByMe = hasProposal && proposal.acceptedBy.includes(user.id);
    const proposedDateTimeValue = hasProposal ? proposal.proposedFor.slice(0, 16) : "";

    return `
      <div class="summary-card intro-studio">
        <p class="profile-name">Plan the first date</p>
        <p class="profile-meta">One live proposal stays active at a time. Either person can propose a time and place. The other person can confirm it or suggest a different plan. If the two-week timer expires before agreement, both people receive a Shun.</p>
        <div class="hint-box">
          <strong>${datePlanningState.title}</strong>
          <div class="small-copy">${datePlanningState.detail}</div>
        </div>
        ${hasProposal ? `
          <div class="detail-card">
            <p class="detail-heading">Current proposal</p>
            <div class="stack">
              <div class="small-copy"><strong>Proposed by:</strong> ${proposal.proposedByUserId === user.id ? "You" : otherUser.name}</div>
              <div class="small-copy"><strong>When:</strong> ${new Date(proposal.proposedFor).toLocaleString()}</div>
              <div class="small-copy"><strong>Where:</strong> ${proposal.location}</div>
              <div class="small-copy"><strong>Note:</strong> ${proposal.note || "No note added."}</div>
              <div class="small-copy"><strong>Accepted by:</strong> ${proposal.acceptedBy.map((id) => id === user.id ? "You" : otherUser.name).join(" and ")}</div>
            </div>
          </div>
        ` : ""}
        <div id="date-plan-error" class="auth-error"></div>
        <form id="date-proposal-form" class="stack">
          <label class="field">
            <span>${hasProposal ? "Suggest a different date and time" : "Propose a date and time"}</span>
            <input name="proposedFor" type="datetime-local" required value="${proposedDateTimeValue}">
          </label>
          <label class="field">
            <span>Location or venue</span>
            <input name="location" type="text" maxlength="80" required value="${hasProposal ? proposal.location : ""}" placeholder="Coffee shop, neighborhood, restaurant, etc.">
          </label>
          <label class="field">
            <span>Note</span>
            <textarea name="note" rows="4" maxlength="220" placeholder="Add a short note about the plan">${hasProposal ? (proposal.note || "") : ""}</textarea>
          </label>
          <div class="button-row">
            <button class="ghost-button" type="submit">${hasProposal ? "Suggest Different Time" : "Send Date Proposal"}</button>
            ${proposedByOther ? `
              <button id="accept-date-btn" class="primary-button" type="button" ${acceptedByMe ? "disabled" : ""}>${acceptedByMe ? "Confirmed" : "Confirm This Date"}</button>
            ` : ""}
          </div>
        </form>
      </div>
    `;
  }

  async function hydrateIntroVideos() {
    const mySlot = document.getElementById("my-intro-slot");
    if (mySlot && myIntro && myIntro.mediaId) {
      const url = await getStoredVideoUrl(myIntro.mediaId);
      if (url) {
        mySlot.innerHTML = `<video class="intro-video-player" controls playsinline src="${url}"></video>`;
      }
    }

    const otherSlot = document.getElementById("other-intro-slot");
    if (otherSlot && otherMediaId) {
      const url = await getStoredVideoUrl(otherMediaId);
      if (url) {
        otherSlot.innerHTML = `<video class="intro-video-player" controls playsinline src="${url}"></video>`;
      }
    }
  }

  function bindBaseActions() {
    const startButton = document.getElementById("start-recording-btn");
    const stopButton = document.getElementById("stop-recording-btn");
    const submitButton = document.getElementById("submit-recording-btn");
    const mockIntroButton = document.getElementById("submit-mock-intro-btn");
    const uploadInput = document.getElementById("intro-upload-input");
    const recordAgainButton = document.getElementById("record-again-btn");
    const livePreview = document.getElementById("intro-live-preview");

    if (livePreview && recorderState.stream) {
      livePreview.srcObject = recorderState.stream;
    }
    if (startButton) startButton.addEventListener("click", startRecording);
    if (stopButton) stopButton.addEventListener("click", stopRecording);
    if (submitButton) submitButton.addEventListener("click", submitRecordedIntro);
    if (mockIntroButton) mockIntroButton.addEventListener("click", submitMockIntro);
    if (uploadInput) uploadInput.addEventListener("change", handleUploadSelection);
    if (recordAgainButton) {
      recordAgainButton.addEventListener("click", () => {
        resetRecorder();
        renderMatchPanel();
      });
    }

    const dateProposalForm = document.getElementById("date-proposal-form");
    if (dateProposalForm) {
      dateProposalForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const errorEl = document.getElementById("date-plan-error");
        if (errorEl) errorEl.textContent = "";
        const formData = new FormData(dateProposalForm);
        const proposal = AppData.proposeDate(match.id, user.id, {
          proposedFor: formData.get("proposedFor"),
          location: formData.get("location"),
          note: formData.get("note"),
        });
        if (!proposal) {
          if (errorEl) errorEl.textContent = "Add a date, time, and location to send a proposal.";
          return;
        }
        location.reload();
      });
    }

    const acceptDateButton = document.getElementById("accept-date-btn");
    if (acceptDateButton) {
      acceptDateButton.addEventListener("click", () => {
        const accepted = AppData.acceptDateProposal(match.id, user.id);
        if (!accepted) return;
        location.reload();
      });
    }

    document.getElementById("unmatch-btn").addEventListener("click", () => {
      AppData.unmatchCurrent(user.id);
      location.reload();
    });

    if (match.status === "decision_window") {
      const actions = document.getElementById("decision-actions");
      actions.innerHTML = `
        <button id="attract-btn" class="success-button" type="button" ${myDecision ? "disabled" : ""}>Choose Attract</button>
        <button id="fit-btn" class="ghost-button" type="button" ${myDecision ? "disabled" : ""}>Mutual Not A Fit</button>
        <button id="shun-btn" class="danger-button" type="button" ${myDecision ? "disabled" : ""}>Choose Shun</button>
      `;
      document.getElementById("attract-btn").addEventListener("click", () => {
        AppData.submitDecision(match.id, user.id, "attract");
        location.reload();
      });
      document.getElementById("fit-btn").addEventListener("click", () => {
        AppData.submitDecision(match.id, user.id, "not_a_fit");
        location.reload();
      });
      document.getElementById("shun-btn").addEventListener("click", () => {
        AppData.submitDecision(match.id, user.id, "shun");
        location.reload();
      });
    }
  }

  function renderMatchPanel() {
    matchPanel.innerHTML = `
      <div class="match-card">
        <div class="profile-top">
          <div>
            <p class="profile-name">${otherUser.name}</p>
            <p class="profile-meta">One active match. One guided flow.</p>
          </div>
          <span class="status-pill">${match.status.replace("_", " ")}</span>
        </div>
        <div class="timeline">
          <div class="timeline-row ${match.status === "pending_intro" ? "active" : myIntro ? "done" : ""}">
            <div>
              <strong>Video intro</strong>
              <div class="small-copy">Submit a video intro within 24 hours by ${AppUI.formatDate(match.introDeadline)}. Time left: ${formatTimeRemaining(match.introDeadline)}. If both intros are not submitted in time, both people receive a Shun.</div>
            </div>
            <span class="interest-pill">${myIntro ? "Submitted" : "Pending"}</span>
          </div>
          <div class="timeline-row ${match.status === "date_planning" ? "active" : match.dateProposal && match.userIds.every((id) => match.dateProposal.acceptedBy.includes(id)) ? "done" : ""}">
            <div>
              <strong>Plan first date</strong>
              <div class="small-copy">${datePlanningState.detail} Time left: ${formatTimeRemaining(match.dateDeadline)}. If the timer runs out, both people receive a Shun.</div>
            </div>
            <span class="interest-pill">${match.status === "date_planning" ? datePlanningState.title : "Done"}</span>
          </div>
          <div class="timeline-row ${match.status === "decision_window" ? "active" : myDecision ? "done" : ""}">
            <div>
              <strong>Attract or shun</strong>
              <div class="small-copy">Choose the result by ${AppUI.formatDate(match.decisionDeadline)}. Time left: ${formatTimeRemaining(match.decisionDeadline)}. If the timer runs out, both people receive a Shun.</div>
            </div>
            <span class="interest-pill">${myDecision ? myDecision.replaceAll("_", " ") : "Awaiting choice"}</span>
          </div>
        </div>
        ${introStudioMarkup()}
        ${partnerIntroMarkup()}
        ${datePlannerMarkup()}
        <div class="decision-actions" id="decision-actions"></div>
        <div class="button-row">
          <button id="unmatch-btn" class="danger-button" type="button">Unmatch Now</button>
          <a class="ghost-link" href="reports.html">Report This Match</a>
        </div>
      </div>
    `;

    bindBaseActions();
    hydrateIntroVideos();
  }

  renderMatchPanel();

  const messages = AppData.getMessages(match.id);
  chatPanel.innerHTML = `
    <div class="chat-wrap">
      <div class="chat-head">
        <div>
          <p class="profile-name">${otherUser.name}</p>
          <p class="profile-meta">This is the only active conversation this user can hold.</p>
        </div>
        <span class="status-pill">${messages.length} messages</span>
      </div>
      <div class="chat-log" id="chat-log"></div>
      <form id="chat-form" class="chat-compose">
        <input id="chat-input" type="text" maxlength="240" placeholder="Send a message">
        <button class="primary-button" type="submit">Send</button>
      </form>
    </div>
  `;

  const log = document.getElementById("chat-log");
  if (!messages.length) {
    log.innerHTML = `<div class="empty-state">No messages yet. Start the conversation.</div>`;
  } else {
    messages.forEach((message) => {
      const messageEl = document.createElement("div");
      messageEl.className = `chat-message${message.senderId === user.id ? " mine" : ""}`;
      messageEl.innerHTML = `
        <div class="chat-bubble">
          <strong>${message.senderId === user.id ? "You" : otherUser.name}</strong>
          <div>${message.text}</div>
          <div class="small-copy">${new Date(message.createdAt).toLocaleString()}</div>
        </div>
      `;
      log.appendChild(messageEl);
    });
  }

  document.getElementById("chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    AppData.sendMessage(match.id, user.id, input.value);
    location.reload();
  });
})();

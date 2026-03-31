(function () {
  const AppData = window.AppData;
  const AppUI = window.AppUI;
  const user = AppData.currentUser();

  AppUI.injectExperienceRibbon();
  AppUI.setPageChip("success-user-chip", user ? `Stories for ${user.name}` : "No active user");

  const formZone = document.getElementById("success-form-zone");
  const storiesEl = document.getElementById("success-stories");

  if (!user) {
    formZone.innerHTML = AppUI.renderEntryState({
      kicker: "Attract stories",
      title: "Success stories come after real matches",
      copy: "Create a profile, move through the match flow, and mutual attract outcomes can publish here.",
      primaryHref: "create-account.html",
      primaryLabel: "Create Account",
      secondaryHref: "browse.html",
      secondaryLabel: "See Browse",
    });
    storiesEl.innerHTML = `<div class="empty-state">Published attract stories will appear here.</div>`;
    return;
  }

  const eligibleMatch = AppData.state.matches
    .filter((match) => match.status === "attract" && match.userIds.includes(user.id))
    .slice(-1)[0];

  if (!eligibleMatch) {
    formZone.innerHTML = `<div class="empty-state">No attract outcome yet for this user. Complete a match with mutual attract first.</div>`;
  } else {
    const otherUser = AppData.getOtherUser(eligibleMatch, user.id);
    const story = AppData.getDraftStory(eligibleMatch.id, user.id);
    formZone.innerHTML = `
      <form id="story-form" class="stack">
        <div class="summary-card">
          <p class="profile-name">Match with ${otherUser.name}</p>
          <p class="profile-meta">Share a short testimonial for the success page.</p>
        </div>
        <label class="field">
          <span>Testimonial</span>
          <textarea name="quote" rows="6" maxlength="300" required>${story ? story.quote : ""}</textarea>
        </label>
        <button class="primary-button" type="submit">Publish Story</button>
      </form>
    `;

    document.getElementById("story-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      AppData.updateSuccessStory(eligibleMatch.id, user.id, formData.get("quote"));
      AppUI.showToast("Story published.");
      setTimeout(() => location.reload(), 350);
    });
  }

  const stories = AppData.getStories();
  if (!stories.length) {
    storiesEl.innerHTML = `<div class="empty-state">No published success stories yet.</div>`;
    return;
  }

  storiesEl.innerHTML = "";
  stories.forEach((story) => {
    const author = AppData.getUser(story.authorId);
    const match = AppData.state.matches.find((entry) => entry.id === story.matchId);
    const partner = match ? AppData.getOtherUser(match, story.authorId) : null;
    const row = document.createElement("div");
    row.className = "summary-card";
    row.innerHTML = `
      <p class="profile-name">${author ? author.name : "Unknown"} ${partner ? `& ${partner.name}` : ""}</p>
      <p class="profile-meta">Attract outcome</p>
      <p class="small-copy">${story.quote}</p>
    `;
    storiesEl.appendChild(row);
  });
})();

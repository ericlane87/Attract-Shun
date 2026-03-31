(function () {
  const STORAGE_KEY = "attract-shun-local-prototype-v3";
  const DAY_MS = 24 * 60 * 60 * 1000;

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function defaultPreferences() {
    return {
      minAge: 24,
      maxAge: 38,
      distanceMiles: 25,
      minHeightInches: 0,
      preferredRace: "any",
      preferredChildrenStatus: "any",
      excludedRace: "none",
      excludedChildrenStatus: "none",
      excludedZodiac: "none",
      allowWeeklyFeature: false,
      notifications: true,
      showIntentBadge: true,
      profileVisible: true,
    };
  }

  function createEmptyState() {
    return {
      system: {
        now: new Date("2026-03-31T12:00:00-04:00").toISOString(),
      },
      currentUserId: "",
      users: [],
      swipes: [],
      matches: [],
      messages: [],
      reports: [],
      successStories: [],
    };
  }

  function normalizeUser(user) {
    return {
      id: user.id || uid("user"),
      name: user.name || "Unnamed",
      age: Number(user.age || 18),
      city: user.city || "",
      email: user.email || "",
      gender: user.gender || "",
      lookingFor: user.lookingFor || "",
      intent: user.intent || "long_term",
      bio: user.bio || "",
      zodiacSign: user.zodiacSign || "Aries",
      heightInches: Number(user.heightInches || 68),
      race: user.race || "Prefer not to say",
      childrenStatus: user.childrenStatus || "Open to kids",
      interests: Array.isArray(user.interests) ? user.interests : [],
      photos: Array.isArray(user.photos) ? user.photos.slice(0, 5) : [],
      profilePhotoIndex: Number.isInteger(user.profilePhotoIndex) ? user.profilePhotoIndex : 0,
      locationLabel: user.locationLabel || user.city || "",
      latitude: typeof user.latitude === "number" ? user.latitude : null,
      longitude: typeof user.longitude === "number" ? user.longitude : null,
      shunCount: Number(user.shunCount || 0),
      activeMatchId: user.activeMatchId || null,
      status: user.status || "available",
      accountStatus: user.accountStatus || "good",
      verified: user.verified !== false,
      onboardingCompleted: user.onboardingCompleted !== false,
      onboardingStep: user.onboardingStep || "complete",
      preferences: { ...defaultPreferences(), ...(user.preferences || {}) },
      createdAt: user.createdAt || new Date().toISOString(),
    };
  }

  function normalizeMatch(match) {
    return {
      id: match.id || uid("match"),
      userIds: Array.isArray(match.userIds) ? match.userIds : [],
      status: match.status || "pending_intro",
      createdAt: match.createdAt || new Date().toISOString(),
      introDeadline: match.introDeadline || new Date().toISOString(),
      dateDeadline: match.dateDeadline || new Date().toISOString(),
      decisionDeadline: match.decisionDeadline || new Date().toISOString(),
      introVideos: match.introVideos || {},
      dateConfirmedBy: Array.isArray(match.dateConfirmedBy) ? match.dateConfirmedBy : [],
      datePhotoUploaded: Boolean(match.datePhotoUploaded),
      decisions: match.decisions || {},
      closedReason: match.closedReason || "",
      testimonialReady: Boolean(match.testimonialReady),
    };
  }

  function normalizeReport(report) {
    return {
      id: report.id || uid("report"),
      matchId: report.matchId || "",
      reporterId: report.reporterId || "",
      reportedUserId: report.reportedUserId || "",
      category: report.category || "disrespect",
      details: report.details || "",
      status: report.status || "open",
      resolution: report.resolution || "",
      createdAt: report.createdAt || new Date().toISOString(),
    };
  }

  function normalizeStory(story) {
    return {
      id: story.id || uid("story"),
      matchId: story.matchId || "",
      authorId: story.authorId || "",
      quote: story.quote || "",
      createdAt: story.createdAt || new Date().toISOString(),
    };
  }

  function normalizeState(rawState) {
    const base = createEmptyState();
    const merged = { ...base, ...(rawState || {}) };
    return {
      system: {
        now: (merged.system && merged.system.now) || base.system.now,
      },
      currentUserId: merged.currentUserId || "",
      users: Array.isArray(merged.users) ? merged.users.map(normalizeUser) : [],
      swipes: Array.isArray(merged.swipes) ? merged.swipes : [],
      matches: Array.isArray(merged.matches) ? merged.matches.map(normalizeMatch) : [],
      messages: Array.isArray(merged.messages) ? merged.messages : [],
      reports: Array.isArray(merged.reports) ? merged.reports.map(normalizeReport) : [],
      successStories: Array.isArray(merged.successStories) ? merged.successStories.map(normalizeStory) : [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.error("Failed to load local state", error);
      return createEmptyState();
    }
  }

  let state = load();

  const AppData = {
    state,
  };

  function syncState() {
    AppData.state = state;
  }

  function save() {
    syncState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function nowIso() {
    return new Date(state.system.now).toISOString();
  }

  function addDays(dateIso, days) {
    return new Date(new Date(dateIso).getTime() + days * DAY_MS).toISOString();
  }

  function getUser(userId) {
    return state.users.find((user) => user.id === userId) || null;
  }

  function currentUser() {
    return getUser(state.currentUserId);
  }

  function formatIntent(intent) {
    return intent === "long_term" ? "Long term" : "Casual";
  }

  function setCurrentUser(userId) {
    state.currentUserId = userId;
    save();
  }

  function findUserByEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return null;
    return state.users.find((user) => String(user.email || "").trim().toLowerCase() === normalizedEmail) || null;
  }

  function createUser(payload) {
    const user = normalizeUser({
      id: uid("user"),
      name: payload.name,
      age: payload.age,
      city: payload.city,
      email: payload.email,
      gender: payload.gender,
      lookingFor: payload.lookingFor,
      intent: payload.intent,
      bio: payload.bio || "",
      onboardingCompleted: false,
      onboardingStep: "identity",
      preferences: defaultPreferences(),
      createdAt: nowIso(),
    });

    state.users.push(user);
    if (!state.currentUserId) {
      state.currentUserId = user.id;
    }
    save();
    return user;
  }

  function updateCurrentUserProfile(patch) {
    const user = currentUser();
    if (!user) return null;

    Object.assign(user, patch);
    if (patch.preferences) {
      user.preferences = { ...user.preferences, ...patch.preferences };
    }
    save();
    return user;
  }

  function completeOnboarding(userId, payload) {
    const user = getUser(userId);
    if (!user) return null;

    user.name = payload.name;
    user.email = payload.email;
    user.age = Number(payload.age);
    user.gender = payload.gender;
    user.lookingFor = payload.lookingFor;
    user.bio = payload.bio;
    user.intent = payload.intent;
    user.zodiacSign = payload.zodiacSign;
    user.heightInches = Number(payload.heightInches);
    user.race = payload.race;
    user.childrenStatus = payload.childrenStatus;
    user.interests = Array.isArray(payload.interests) ? payload.interests : [];
    user.photos = Array.isArray(payload.photos) ? payload.photos.slice(0, 5) : [];
    user.profilePhotoIndex = Math.max(0, Math.min(Number(payload.profilePhotoIndex || 0), Math.max(user.photos.length - 1, 0)));
    user.locationLabel = payload.locationLabel || user.locationLabel || "";
    user.latitude = typeof payload.latitude === "number" ? payload.latitude : user.latitude;
    user.longitude = typeof payload.longitude === "number" ? payload.longitude : user.longitude;
    user.city = user.locationLabel;
    user.verified = true;
    user.onboardingCompleted = true;
    user.onboardingStep = "complete";
    user.preferences = {
      ...user.preferences,
      minAge: Number(payload.minAge),
      maxAge: Number(payload.maxAge),
      distanceMiles: Number(payload.distanceMiles),
      minHeightInches: Number(payload.minHeightInches || 0),
      preferredRace: payload.preferredRace || "any",
      preferredChildrenStatus: payload.preferredChildrenStatus || "any",
      excludedRace: payload.excludedRace || "none",
      excludedChildrenStatus: payload.excludedChildrenStatus || "none",
      excludedZodiac: payload.excludedZodiac || "none",
      allowWeeklyFeature: Boolean(payload.allowWeeklyFeature),
    };
    save();
    return user;
  }

  function distanceMilesBetween(userA, userB) {
    if ([userA.latitude, userA.longitude, userB.latitude, userB.longitude].some((value) => typeof value !== "number")) {
      return null;
    }

    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusMiles = 3958.8;
    const dLat = toRadians(userB.latitude - userA.latitude);
    const dLon = toRadians(userB.longitude - userA.longitude);
    const lat1 = toRadians(userA.latitude);
    const lat2 = toRadians(userB.latitude);

    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
  }

  function getIncomingLikes(userId) {
    return state.swipes
      .filter((swipe) => swipe.toUserId === userId && swipe.direction === "right")
      .map((swipe) => ({ swipe, user: getUser(swipe.fromUserId) }))
      .filter((entry) => entry.user);
  }

  function getAvailableCandidates(userId) {
    const user = getUser(userId);
    if (!user) return [];

    const alreadySeen = new Set(
      state.swipes
        .filter((swipe) => swipe.fromUserId === userId)
        .map((swipe) => swipe.toUserId)
    );

    return state.users.filter((candidate) => {
      if (candidate.id === user.id) return false;
      if (candidate.intent !== user.intent) return false;
      if (alreadySeen.has(candidate.id)) return false;
      if (candidate.accountStatus === "banned") return false;
      if (!candidate.preferences.profileVisible) return false;
      if (!(candidate.age >= user.preferences.minAge && candidate.age <= user.preferences.maxAge)) return false;
      if (user.preferences.minHeightInches && candidate.heightInches < user.preferences.minHeightInches) return false;
      if (user.preferences.preferredRace !== "any" && candidate.race !== user.preferences.preferredRace) return false;
      if (user.preferences.preferredChildrenStatus !== "any" && candidate.childrenStatus !== user.preferences.preferredChildrenStatus) return false;
      if (user.preferences.excludedRace !== "none" && candidate.race === user.preferences.excludedRace) return false;
      if (user.preferences.excludedChildrenStatus !== "none" && candidate.childrenStatus === user.preferences.excludedChildrenStatus) return false;
      if (user.preferences.excludedZodiac !== "none" && candidate.zodiacSign === user.preferences.excludedZodiac) return false;

      const distance = distanceMilesBetween(user, candidate);
      if (distance !== null && distance > user.preferences.distanceMiles) return false;
      return true;
    });
  }

  function getActiveMatchForUser(userId) {
    return state.matches.find((match) => match.userIds.includes(userId) && ["pending_intro", "date_planning", "decision_window"].includes(match.status)) || null;
  }

  function getOtherUser(match, userId) {
    return getUser(match.userIds.find((id) => id !== userId));
  }

  function getLatestMatchForUser(userId) {
    return state.matches.filter((match) => match.userIds.includes(userId)).slice(-1)[0] || null;
  }

  function getMatchesForUser(userId) {
    return state.matches.filter((match) => match.userIds.includes(userId)).slice().reverse();
  }

  function maybeCreateMatch(fromUserId, toUserId) {
    const fromUser = getUser(fromUserId);
    const toUser = getUser(toUserId);
    if (!fromUser || !toUser) return null;
    if (fromUser.activeMatchId || toUser.activeMatchId) return null;

    const reciprocal = state.swipes.find((swipe) =>
      swipe.fromUserId === toUserId &&
      swipe.toUserId === fromUserId &&
      swipe.direction === "right"
    );
    if (!reciprocal) return null;

    const createdAt = nowIso();
    const match = normalizeMatch({
      id: uid("match"),
      userIds: [fromUserId, toUserId],
      status: "pending_intro",
      createdAt,
      introDeadline: addDays(createdAt, 1),
      dateDeadline: addDays(createdAt, 14),
      decisionDeadline: addDays(createdAt, 28),
      introVideos: {},
      dateConfirmedBy: [],
      datePhotoUploaded: false,
      decisions: {},
      closedReason: "",
      testimonialReady: false,
    });

    state.matches.push(match);
    fromUser.activeMatchId = match.id;
    toUser.activeMatchId = match.id;
    fromUser.status = "matched";
    toUser.status = "matched";
    save();
    return match;
  }

  function recordSwipe(fromUserId, toUserId, direction, interestScore) {
    state.swipes.push({
      id: uid("swipe"),
      fromUserId,
      toUserId,
      direction,
      interestScore: direction === "right" ? Number(interestScore) : null,
      createdAt: nowIso(),
    });
    const match = direction === "right" ? maybeCreateMatch(fromUserId, toUserId) : null;
    save();
    return match;
  }

  function closeMatch(match, status, reason, applyShunToAll) {
    match.status = status;
    match.closedReason = reason;
    match.userIds.forEach((userId) => {
      const user = getUser(userId);
      if (!user) return;
      if (applyShunToAll) user.shunCount += 1;
      user.activeMatchId = null;
      user.status = "available";
    });
  }

  function createSuccessStory(matchId) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match) return;
    match.userIds.forEach((userId) => {
      const existing = state.successStories.find((story) => story.matchId === matchId && story.authorId === userId);
      if (!existing) {
        state.successStories.push(normalizeStory({
          id: uid("story"),
          matchId,
          authorId: userId,
          quote: "",
          createdAt: nowIso(),
        }));
      }
    });
  }

  function finalizeDecisionMatch(match) {
    const decisions = match.userIds.map((userId) => match.decisions[userId]).filter(Boolean);
    if (decisions.length < 2) return false;

    if (decisions.every((entry) => entry === "attract")) {
      match.testimonialReady = true;
      createSuccessStory(match.id);
      closeMatch(match, "attract", "Both users chose attract.", false);
      save();
      return true;
    }

    if (decisions.every((entry) => entry === "not_a_fit")) {
      closeMatch(match, "unmatched", "Mutual close. No shun assigned.", false);
      save();
      return true;
    }

    closeMatch(match, "shun", "Non-mutual withdrawal or negative fit decision.", true);
    save();
    return true;
  }

  function submitIntro(matchId, userId) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || match.status !== "pending_intro") return;
    match.introVideos[userId] = { uploadedAt: nowIso(), mockAsset: true };
    if (match.userIds.every((id) => match.introVideos[id])) {
      match.status = "date_planning";
    }
    save();
  }

  function confirmDate(matchId, userId) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || match.status !== "date_planning") return;
    if (!match.dateConfirmedBy.includes(userId)) {
      match.dateConfirmedBy.push(userId);
    }
    if (match.dateConfirmedBy.length === 2) {
      match.datePhotoUploaded = true;
      match.status = "decision_window";
    }
    save();
  }

  function submitDecision(matchId, userId, decision) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || match.status !== "decision_window") return false;
    match.decisions[userId] = decision;
    const finalized = finalizeDecisionMatch(match);
    save();
    return finalized;
  }

  function unmatchCurrent(userId) {
    const match = getActiveMatchForUser(userId);
    if (!match) return;
    closeMatch(match, "shun", "Unmatched before completing the process.", true);
    save();
  }

  function getMessages(matchId) {
    return state.messages.filter((message) => message.matchId === matchId);
  }

  function sendMessage(matchId, senderId, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    state.messages.push({
      id: uid("message"),
      matchId,
      senderId,
      text: trimmed,
      createdAt: nowIso(),
    });
    save();
  }

  function createReport(payload) {
    const report = normalizeReport({
      id: uid("report"),
      matchId: payload.matchId,
      reporterId: payload.reporterId,
      reportedUserId: payload.reportedUserId,
      category: payload.category,
      details: payload.details,
      status: "open",
      resolution: "",
      createdAt: nowIso(),
    });
    state.reports.push(report);
    save();
    return report;
  }

  function updateReportStatus(reportId, status, resolution) {
    const report = state.reports.find((entry) => entry.id === reportId);
    if (!report) return null;
    report.status = status;
    report.resolution = resolution || "";

    if (status === "actioned") {
      const user = getUser(report.reportedUserId);
      if (user) {
        if (report.category === "harassment") {
          user.accountStatus = "banned";
          user.status = "banned";
          user.activeMatchId = null;
        } else {
          user.shunCount += 1;
        }
      }
    }

    save();
    return report;
  }

  function getReportsForUser(userId) {
    return state.reports.filter((report) => report.reporterId === userId || report.reportedUserId === userId);
  }

  function getOpenReports() {
    return state.reports.filter((report) => report.status === "open");
  }

  function updateSuccessStory(matchId, authorId, quote) {
    const story = state.successStories.find((entry) => entry.matchId === matchId && entry.authorId === authorId);
    if (!story) return null;
    story.quote = quote.trim();
    save();
    return story;
  }

  function getStories() {
    return state.successStories.filter((story) => story.quote.trim().length > 0);
  }

  function getDraftStory(matchId, authorId) {
    return state.successStories.find((entry) => entry.matchId === matchId && entry.authorId === authorId) || null;
  }

  function processDeadlines() {
    const currentTime = new Date(state.system.now).getTime();
    state.matches.forEach((match) => {
      if (!["pending_intro", "date_planning", "decision_window"].includes(match.status)) return;
      if (match.status === "pending_intro" && currentTime > new Date(match.introDeadline).getTime()) {
        closeMatch(match, "shun", "Failed to submit both intro videos in time.", true);
      } else if (match.status === "date_planning" && currentTime > new Date(match.dateDeadline).getTime()) {
        closeMatch(match, "shun", "Failed to plan and verify the first date in time.", true);
      } else if (match.status === "decision_window" && currentTime > new Date(match.decisionDeadline).getTime()) {
        finalizeDecisionMatch(match);
      }
    });
    save();
  }

  function advanceDay() {
    state.system.now = new Date(new Date(state.system.now).getTime() + DAY_MS).toISOString();
    processDeadlines();
    save();
  }

  function resetAll() {
    state = createEmptyState();
    save();
  }

  function seedDemoUsers() {
    if (state.users.length > 0) return;
    [
      ["Ava Brooks", 28, "Brooklyn", "long_term", "Reader, graceful communicator, wants one serious relationship not endless swiping."],
      ["Noah Ellis", 31, "Queens", "long_term", "Chef, emotionally direct, family-minded, and not interested in casual ambiguity."],
      ["Elena Price", 33, "Brooklyn", "long_term", "Calm, polished, affectionate, and ready for commitment with the right person."],
      ["Theo Grant", 30, "Astoria", "long_term", "Designer, active, consistent, and willing to lead with effort."],
      ["Jade Carter", 26, "Harlem", "casual", "Bold, social, and looking for chemistry without pretending it is more than it is."],
      ["Miles Bennett", 29, "Jersey City", "casual", "Live music, rooftop nights, and honest casual dating."],
    ].forEach(([name, age, city, intent, bio]) => {
      const user = createUser({ name, age, city, intent, bio });
      user.onboardingCompleted = true;
      user.onboardingStep = "complete";
    });
    if (!state.currentUserId && state.users[0]) {
      state.currentUserId = state.users[0].id;
    }
    save();
  }

  Object.assign(AppData, {
    createEmptyState,
    save,
    load,
    nowIso,
    addDays,
    formatIntent,
    currentUser,
    getUser,
    setCurrentUser,
    findUserByEmail,
    createUser,
    updateCurrentUserProfile,
    completeOnboarding,
    seedDemoUsers,
    getIncomingLikes,
    getAvailableCandidates,
    getActiveMatchForUser,
    getOtherUser,
    getLatestMatchForUser,
    getMatchesForUser,
    recordSwipe,
    submitIntro,
    confirmDate,
    submitDecision,
    unmatchCurrent,
    getMessages,
    sendMessage,
    createReport,
    updateReportStatus,
    getReportsForUser,
    getOpenReports,
    updateSuccessStory,
    getStories,
    getDraftStory,
    advanceDay,
    resetAll,
    defaultPreferences,
  });

  syncState();
  window.AppData = AppData;
})();

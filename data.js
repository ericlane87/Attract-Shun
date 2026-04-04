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
      session: {
        loggedInUserId: "",
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
      email: (user.email || "").trim().toLowerCase(),
      password: user.password || "demo1234",
      sex: user.sex || "",
      age: Number(user.age || 18),
      city: user.city || "",
      intent: user.intent || "long_term",
      bio: user.bio || "",
      photos: Array.isArray(user.photos) ? user.photos : [],
      dealMakers: Array.isArray(user.dealMakers) ? user.dealMakers : [],
      dealBreakers: Array.isArray(user.dealBreakers) ? user.dealBreakers : [],
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
      session: {
        loggedInUserId: (merged.session && merged.session.loggedInUserId) || "",
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

  function loggedInUser() {
    return getUser(state.session.loggedInUserId);
  }

  function formatIntent(intent) {
    return intent === "long_term" ? "Long term" : "Casual";
  }

  function setCurrentUser(userId) {
    state.currentUserId = userId;
    save();
  }

  function setLoggedInUser(userId) {
    state.session.loggedInUserId = userId || "";
    state.currentUserId = userId || "";
    save();
  }

  function isAuthenticated() {
    return Boolean(state.session.loggedInUserId && getUser(state.session.loggedInUserId));
  }

  function logout() {
    state.session.loggedInUserId = "";
    state.currentUserId = "";
    save();
  }

  function login(identifier, password) {
    const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const user = state.users.find((entry) => {
      const nameMatch = entry.name.trim().toLowerCase() === normalizedIdentifier;
      const emailMatch = entry.email === normalizedIdentifier;
      return (nameMatch || emailMatch) && entry.password === normalizedPassword;
    });
    if (!user) return null;
    setLoggedInUser(user.id);
    return user;
  }

  function createUser(payload) {
    const user = normalizeUser({
      id: uid("user"),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      sex: payload.sex,
      age: payload.age,
      city: payload.city,
      intent: payload.intent,
      bio: payload.bio,
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

    user.bio = payload.bio;
    user.intent = payload.intent;
    user.verified = true;
    user.onboardingCompleted = true;
    user.onboardingStep = "complete";
    user.preferences = {
      ...user.preferences,
      minAge: Number(payload.minAge),
      maxAge: Number(payload.maxAge),
      distanceMiles: Number(payload.distanceMiles),
      allowWeeklyFeature: Boolean(payload.allowWeeklyFeature),
    };
    save();
    return user;
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
      if (user.sex && candidate.sex && candidate.sex === user.sex) return false;
      if (alreadySeen.has(candidate.id)) return false;
      if (candidate.accountStatus === "banned") return false;
      if (!candidate.preferences.profileVisible) return false;
      return candidate.age >= user.preferences.minAge && candidate.age <= user.preferences.maxAge;
    });
  }

  function getBrowseCandidates(userId) {
    const user = getUser(userId);
    if (!user) return [];

    const alreadySeen = new Set(
      state.swipes
        .filter((swipe) => swipe.fromUserId === userId)
        .map((swipe) => swipe.toUserId)
    );

    return state.users
      .filter((candidate) => {
        if (candidate.id === user.id) return false;
        if (candidate.accountStatus === "banned") return false;
        if (!candidate.preferences.profileVisible) return false;
        return true;
      })
      .sort((left, right) => {
        const leftSeen = alreadySeen.has(left.id) ? 1 : 0;
        const rightSeen = alreadySeen.has(right.id) ? 1 : 0;
        if (leftSeen !== rightSeen) return leftSeen - rightSeen;
        return left.name.localeCompare(right.name);
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
    const targetCount = 100;
    if (state.users.length >= targetCount) return;

    const femaleFirstNames = [
      "Ava", "Mia", "Nora", "Elena", "Jade", "Lena", "Sofia", "Ruby", "Chloe", "Zoe",
      "Maya", "Layla", "Aria", "Cora", "Ivy", "Naomi", "Clara", "Lucy", "Tessa", "Paige",
      "Violet", "Hazel", "Julia", "Brielle", "Sabrina", "Camila", "Eva", "Summer", "Sadie", "Keira",
      "Adeline", "Celeste", "Daphne", "Esme", "Freya", "Gia", "Holly", "Isla", "Josephine", "Kira",
      "Leila", "Marina", "Noelle", "Olive", "Piper", "Quinn", "Rosalie", "Sienna", "Valerie", "Willa"
    ];
    const maleFirstNames = [
      "Noah", "Liam", "Theo", "Miles", "Ethan", "Julian", "Caleb", "Owen", "Grant", "Roman",
      "Lucas", "Mason", "Hudson", "Logan", "Wyatt", "Cole", "Asher", "Nolan", "Brooks", "Dean",
      "Eli", "Felix", "Gavin", "Holden", "Isaac", "Jasper", "Kai", "Levi", "Micah", "Nico",
      "Orion", "Parker", "Reid", "Silas", "Tristan", "Vincent", "Wesley", "Xavier", "Yuri", "Zane",
      "Alden", "Beckett", "Carter", "Damian", "Emmett", "Finley", "Graham", "Harvey", "Jonah", "Knox"
    ];
    const lastNames = [
      "Brooks", "Ellis", "Price", "Grant", "Carter", "Bennett", "Hayes", "Monroe", "Sullivan", "Reed",
      "Coleman", "Bryant", "Foster", "Bailey", "Porter", "Wallace", "Perry", "Hughes", "Ward", "Russell",
      "Jenkins", "Powell", "Myers", "Long", "Greene", "Parker", "Cook", "Bell", "Murphy", "Rivera",
      "Hayden", "Kim", "Brody", "Morris", "Spencer", "Diaz", "Warren", "Fisher", "West", "Holland",
      "Bishop", "Stephens", "Woods", "Carr", "Griffin", "Pierce", "Fox", "Barnes", "Santos", "Mills"
    ];
    const cities = [
      "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin",
      "Jacksonville", "San Jose", "Columbus", "Charlotte", "Indianapolis", "Seattle", "Denver", "Boston", "Nashville", "Detroit",
      "Portland", "Las Vegas", "Baltimore", "Atlanta", "Miami", "Orlando", "Tampa", "Cleveland", "Cincinnati", "Pittsburgh",
      "St. Louis", "Kansas City", "Minneapolis", "Milwaukee", "Omaha", "Raleigh", "Richmond", "Buffalo", "Rochester", "Albany",
      "Jersey City", "Newark", "Hoboken", "Yonkers", "Irvine", "Pasadena", "Burbank", "Sacramento", "Fresno", "Oakland"
    ];
    const longTermTraits = [
      "values consistency", "wants a real partner", "prefers intentional communication", "is ready for commitment", "likes thoughtful dates",
      "cares about emotional maturity", "wants to build something steady", "takes dating seriously", "enjoys honest conversations", "likes calm chemistry"
    ];
    const casualTraits = [
      "likes easy chemistry", "wants something fun and direct", "enjoys spontaneous plans", "prefers low-pressure dating", "likes playful energy",
      "is open about keeping it casual", "enjoys nightlife and quick connection", "wants attraction without confusion", "likes fast banter", "prefers going with the flow"
    ];
    const hobbies = [
      "coffee walks", "live music", "morning workouts", "museum stops", "weekend road trips",
      "bookstores", "rooftop dinners", "pickleball", "cooking at home", "photography",
      "farmers markets", "concert nights", "trail runs", "vinyl collecting", "brunch spots"
    ];
    const dealMakerPool = [
      "Clear communication", "Emotionally available", "Consistent effort", "Family minded", "Ambitious",
      "Playful humor", "Healthy lifestyle", "Wants commitment", "Travel curious", "Kind under pressure",
      "Faith or values driven", "Financially responsible", "Good listener", "Affectionate", "Creative"
    ];
    const dealBreakerPool = [
      "Dishonesty", "Flaky communication", "Cruel humor", "Smoking", "Still hung up on an ex",
      "Avoids commitment", "Disrespectful tone", "Heavy partying", "No work-life balance", "Jealous behavior",
      "No ambition", "Poor hygiene", "Love bombing", "Zero accountability", "Rude to service staff"
    ];

    function buildBio(name, intent, index) {
      const traitList = intent === "long_term" ? longTermTraits : casualTraits;
      const hobbyA = hobbies[index % hobbies.length];
      const hobbyB = hobbies[(index + 4) % hobbies.length];
      return `${name} ${traitList[index % traitList.length]}, enjoys ${hobbyA} and ${hobbyB}, and wants dating to feel clear, respectful, and worth showing up for.`;
    }

    function createSeedUser(firstName, sex, index) {
      const lastName = lastNames[index % lastNames.length];
      const name = `${firstName} ${lastName}`;
      const age = 24 + (index % 15);
      const city = cities[index % cities.length];
      const intent = index % 2 === 0 ? "long_term" : "casual";
      const emailBase = `${firstName}.${lastName}.${index + 1}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
      const email = `${emailBase}@attract.local`;
      const bio = buildBio(firstName, intent, index);
      const photos = [0, 1, 2].map((offset) => ({
        id: `${emailBase}-photo-${offset + 1}`,
        label: offset === 0 ? "Main profile photo" : offset === 1 ? "Lifestyle photo" : "Weekend photo",
      }));
      const dealMakers = [
        dealMakerPool[index % dealMakerPool.length],
        dealMakerPool[(index + 3) % dealMakerPool.length],
        dealMakerPool[(index + 7) % dealMakerPool.length],
      ];
      const dealBreakers = [
        dealBreakerPool[index % dealBreakerPool.length],
        dealBreakerPool[(index + 4) % dealBreakerPool.length],
        dealBreakerPool[(index + 8) % dealBreakerPool.length],
      ];
      const user = createUser({
        name,
        email,
        password: "demo1234",
        sex,
        age,
        city,
        intent,
        bio,
        photos,
        dealMakers,
        dealBreakers,
      });
      user.onboardingCompleted = true;
      user.onboardingStep = "complete";
    }

    const seedPool = [
      ...femaleFirstNames.map((firstName, index) => ({ firstName, sex: "female", index })),
      ...maleFirstNames.map((firstName, index) => ({ firstName, sex: "male", index: index + femaleFirstNames.length })),
    ];

    const availableSeeds = seedPool.filter((entry) => {
      const lastName = lastNames[entry.index % lastNames.length];
      const emailBase = `${entry.firstName}.${lastName}.${entry.index + 1}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
      const email = `${emailBase}@attract.local`;
      return !state.users.some((user) => user.email === email);
    });

    availableSeeds.slice(0, targetCount - state.users.length).forEach((entry) => {
      createSeedUser(entry.firstName, entry.sex, entry.index);
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
    loggedInUser,
    getUser,
    setCurrentUser,
    setLoggedInUser,
    isAuthenticated,
    login,
    logout,
    createUser,
    updateCurrentUserProfile,
    completeOnboarding,
    seedDemoUsers,
    getIncomingLikes,
    getAvailableCandidates,
    getBrowseCandidates,
    getActiveMatchForUser,
    getOtherUser,
    getLatestMatchForUser,
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

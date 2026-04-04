(function () {
  const STORAGE_KEY = "attract-shun-local-prototype-v7";
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

  function defaultShunBreakdown() {
    return {
      intro_timeout: 0,
      date_timeout: 0,
      decision_timeout: 0,
      decision_shun: 0,
      unmatch_not_mutual: 0,
      unmatch_no_response: 0,
      moderation: 0,
    };
  }

  const DEAL_MAKER_POOL = [
    "Clear communication", "Emotionally available", "Consistent effort", "Family minded", "Ambitious",
    "Playful humor", "Healthy lifestyle", "Wants commitment", "Travel curious", "Kind under pressure",
    "Faith or values driven", "Financially responsible", "Good listener", "Affectionate", "Creative"
  ];

  const DEAL_BREAKER_POOL = [
    "Dishonesty", "Flaky communication", "Cruel humor", "Smoking", "Still hung up on an ex",
    "Avoids commitment", "Disrespectful tone", "Heavy partying", "No work-life balance", "Jealous behavior",
    "No ambition", "Poor hygiene", "Love bombing", "Zero accountability", "Rude to service staff"
  ];

  const HARD_CODED_TEST_USERS = [
    {
      name: "Ava Brooks",
      email: "ava.brooks.1@attract.local",
      password: "demo1234",
      sex: "female",
      age: 24,
      city: "New York",
      intent: "long_term",
      bio: "Ava values consistency, enjoys coffee walks and weekend road trips, and wants dating to feel clear, respectful, and worth showing up for.",
      photos: [
        { id: "ava-brooks-photo-1", label: "Main profile photo" },
        { id: "ava-brooks-photo-2", label: "Lifestyle photo" },
        { id: "ava-brooks-photo-3", label: "Weekend photo" },
      ],
      dealMakers: ["Clear communication", "Consistent effort", "Good listener"],
      dealBreakers: ["Dishonesty", "Smoking", "Zero accountability"],
      lastLoginAt: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
    },
    {
      name: "Noah Brooks",
      email: "noah.brooks.1@attract.local",
      password: "demo1234",
      sex: "male",
      age: 29,
      city: "New York",
      intent: "long_term",
      bio: "Noah values consistency, enjoys bookstores and photography, and wants dating to feel clear, respectful, and worth showing up for.",
      photos: [
        { id: "noah-brooks-photo-1", label: "Main profile photo" },
        { id: "noah-brooks-photo-2", label: "Lifestyle photo" },
        { id: "noah-brooks-photo-3", label: "Weekend photo" },
      ],
      dealMakers: ["Emotionally available", "Healthy lifestyle", "Affectionate"],
      dealBreakers: ["Flaky communication", "Cruel humor", "Rude to service staff"],
      lastLoginAt: new Date(Date.now() - (4 * 60 * 60 * 1000)).toISOString(),
    },
    {
      name: "Mia Ellis",
      email: "mia.ellis.25@attract.local",
      password: "demo1234",
      sex: "female",
      age: 25,
      city: "Los Angeles",
      intent: "casual",
      bio: "Mia wants something fun and direct, enjoys live music and bookstores, and wants dating to feel clear, respectful, and worth showing up for.",
      photos: [
        { id: "mia-ellis-photo-1", label: "Main profile photo" },
        { id: "mia-ellis-photo-2", label: "Lifestyle photo" },
        { id: "mia-ellis-photo-3", label: "Weekend photo" },
      ],
      dealMakers: ["Playful humor", "Creative", "Travel curious"],
      dealBreakers: ["Love bombing", "Jealous behavior", "Poor hygiene"],
      lastLoginAt: new Date(Date.now() - (6 * 60 * 60 * 1000)).toISOString(),
    },
  ];

  function nameSeed(name) {
    return String(name || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function fallbackDealMakers(name) {
    const seed = nameSeed(name);
    return [
      DEAL_MAKER_POOL[seed % DEAL_MAKER_POOL.length],
      DEAL_MAKER_POOL[(seed + 3) % DEAL_MAKER_POOL.length],
      DEAL_MAKER_POOL[(seed + 7) % DEAL_MAKER_POOL.length],
    ];
  }

  function fallbackDealBreakers(name) {
    const seed = nameSeed(name);
    return [
      DEAL_BREAKER_POOL[seed % DEAL_BREAKER_POOL.length],
      DEAL_BREAKER_POOL[(seed + 4) % DEAL_BREAKER_POOL.length],
      DEAL_BREAKER_POOL[(seed + 8) % DEAL_BREAKER_POOL.length],
    ];
  }

  function fallbackPhotos(user) {
    return [0, 1, 2].map((offset) => ({
      id: `${user.id || "profile"}-photo-${offset + 1}`,
      label: offset === 0 ? "Main profile photo" : offset === 1 ? "Lifestyle photo" : "Weekend photo",
    }));
  }

  function createEmptyState() {
    return {
      system: {
        now: new Date().toISOString(),
      },
      session: {
        loggedInUserId: "",
      },
      currentUserId: "",
      users: [],
      swipes: [],
      matchRequests: [],
      unmatchRequests: [],
      matches: [],
      messages: [],
      messageReads: {},
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
      photos: Array.isArray(user.photos) && user.photos.length ? user.photos : fallbackPhotos(user),
      dealMakers: Array.isArray(user.dealMakers) && user.dealMakers.length ? user.dealMakers : fallbackDealMakers(user.name),
      dealBreakers: Array.isArray(user.dealBreakers) && user.dealBreakers.length ? user.dealBreakers : fallbackDealBreakers(user.name),
      shunCount: Number(user.shunCount || 0),
      shunBreakdown: { ...defaultShunBreakdown(), ...(user.shunBreakdown || {}) },
      activeMatchId: user.activeMatchId || null,
      status: user.status || "available",
      accountStatus: user.accountStatus || "good",
      verified: user.verified !== false,
      onboardingCompleted: user.onboardingCompleted !== false,
      onboardingStep: user.onboardingStep || "complete",
      preferences: { ...defaultPreferences(), ...(user.preferences || {}) },
      createdAt: user.createdAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt || "",
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
      dateProposal: match.dateProposal ? {
        proposedByUserId: match.dateProposal.proposedByUserId || "",
        proposedFor: match.dateProposal.proposedFor || "",
        location: match.dateProposal.location || "",
        note: match.dateProposal.note || "",
        proposedAt: match.dateProposal.proposedAt || "",
        acceptedBy: Array.isArray(match.dateProposal.acceptedBy) ? match.dateProposal.acceptedBy : [],
      } : null,
      dateProposalHistory: Array.isArray(match.dateProposalHistory) ? match.dateProposalHistory : [],
      datePhotoUploaded: Boolean(match.datePhotoUploaded),
      decisions: match.decisions || {},
      closedReason: match.closedReason || "",
      testimonialReady: Boolean(match.testimonialReady),
    };
  }

  function normalizeMatchRequest(request) {
    return {
      id: request.id || uid("matchreq"),
      fromUserId: request.fromUserId || "",
      toUserId: request.toUserId || "",
      status: request.status || "pending",
      createdAt: request.createdAt || new Date().toISOString(),
      respondedAt: request.respondedAt || "",
    };
  }

  function normalizeUnmatchRequest(request) {
    return {
      id: request.id || uid("unmatch"),
      matchId: request.matchId || "",
      initiatorId: request.initiatorId || "",
      responderId: request.responderId || "",
      reason: request.reason || "not_interested",
      status: request.status || "pending",
      createdAt: request.createdAt || new Date().toISOString(),
      respondBy: request.respondBy || new Date(Date.now() + DAY_MS).toISOString(),
      respondedAt: request.respondedAt || "",
      responderAnswer: request.responderAnswer || "",
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
      matchRequests: Array.isArray(merged.matchRequests) ? merged.matchRequests.map(normalizeMatchRequest) : [],
      unmatchRequests: Array.isArray(merged.unmatchRequests) ? merged.unmatchRequests.map(normalizeUnmatchRequest) : [],
      matches: Array.isArray(merged.matches) ? merged.matches.map(normalizeMatch) : [],
      messages: Array.isArray(merged.messages) ? merged.messages : [],
      messageReads: merged.messageReads && typeof merged.messageReads === "object" ? merged.messageReads : {},
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

  function emitChange(type = "state") {
    if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
    window.dispatchEvent(new CustomEvent("appdata:changed", {
      detail: {
        type,
        at: new Date().toISOString(),
      },
    }));
  }

  function save(type = "state") {
    syncState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    emitChange(type);
  }

  function refreshSystemNow() {
    state.system.now = new Date().toISOString();
    return state.system.now;
  }

  function nowIso() {
    return refreshSystemNow();
  }

  function addDays(dateIso, days) {
    return new Date(new Date(dateIso).getTime() + days * DAY_MS).toISOString();
  }

  function getUser(userId) {
    return state.users.find((user) => user.id === userId) || null;
  }

  function addShunToUser(userId, category) {
    const user = getUser(userId);
    if (!user) return;
    const nextCategory = category || "moderation";
    user.shunCount += 1;
    user.shunBreakdown = {
      ...defaultShunBreakdown(),
      ...(user.shunBreakdown || {}),
      [nextCategory]: Number((user.shunBreakdown && user.shunBreakdown[nextCategory]) || 0) + 1,
    };
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
    const user = getUser(userId);
    if (user) {
      user.lastLoginAt = nowIso();
    }
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
    ensureHardcodedTestUsers();
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
      photos: payload.photos,
      dealMakers: payload.dealMakers,
      dealBreakers: payload.dealBreakers,
      lastLoginAt: payload.lastLoginAt,
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
    const latestByUser = new Map();
    state.swipes
      .filter((swipe) => swipe.toUserId === userId && swipe.direction === "right")
      .forEach((swipe) => {
        const existing = latestByUser.get(swipe.fromUserId);
        if (!existing || new Date(swipe.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
          latestByUser.set(swipe.fromUserId, swipe);
        }
      });

    return Array.from(latestByUser.values())
      .map((swipe) => ({ swipe, user: getUser(swipe.fromUserId) }))
      .filter((entry) => entry.user)
      .sort((left, right) => new Date(right.swipe.createdAt).getTime() - new Date(left.swipe.createdAt).getTime());
  }

  function getLatestRightSwipe(fromUserId, toUserId) {
    const matches = state.swipes
      .filter((swipe) =>
        swipe.fromUserId === fromUserId &&
        swipe.toUserId === toUserId &&
        swipe.direction === "right"
      )
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    return matches[0] || null;
  }

  function hasIncomingLike(fromUserId, toUserId) {
    return state.swipes.some((swipe) =>
      swipe.fromUserId === fromUserId &&
      swipe.toUserId === toUserId &&
      swipe.direction === "right"
    );
  }

  function getAvailableCandidates(userId) {
    const user = getUser(userId);
    if (!user) return [];
    if (user.activeMatchId) return [];

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
    if (user.activeMatchId) return [];

    const recentThreshold = Date.now() - (30 * DAY_MS);
    const baseCandidates = state.users
      .filter((candidate) => {
        if (candidate.id === user.id) return false;
        if (candidate.accountStatus === "banned") return false;
        if (!candidate.preferences.profileVisible) return false;
        if (user.sex && candidate.sex && candidate.sex === user.sex) return false;
        return true;
      });

    const recentCandidates = baseCandidates
      .filter((candidate) => candidate.lastLoginAt)
      .filter((candidate) => new Date(candidate.lastLoginAt).getTime() >= recentThreshold);

    const sortByRecentLogin = (left, right) => {
      const leftTime = new Date(left.lastLoginAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.lastLoginAt || right.createdAt || 0).getTime();
      if (rightTime !== leftTime) return rightTime - leftTime;
      return left.name.localeCompare(right.name);
    };

    return (recentCandidates.length ? recentCandidates : baseCandidates)
      .sort((left, right) => {
        return sortByRecentLogin(left, right);
      });
  }

  function getActiveMatchForUser(userId) {
    return state.matches.find((match) => match.userIds.includes(userId) && ["pending_intro", "date_planning", "decision_window"].includes(match.status)) || null;
  }

  function getPendingUnmatchRequestForUser(userId) {
    return state.unmatchRequests.find((request) =>
      request.status === "pending" &&
      (request.initiatorId === userId || request.responderId === userId)
    ) || null;
  }

  function getPendingUnmatchRequestToRespond(userId) {
    return state.unmatchRequests.find((request) =>
      request.status === "pending" &&
      request.responderId === userId
    ) || null;
  }

  function getLatestUnmatchOutcomeForUser(userId) {
    return state.unmatchRequests
      .filter((request) =>
        request.status !== "pending" &&
        (request.initiatorId === userId || request.responderId === userId)
      )
      .sort((left, right) => new Date(right.respondedAt || right.createdAt).getTime() - new Date(left.respondedAt || left.createdAt).getTime())[0] || null;
  }

  function getOtherUser(match, userId) {
    return getUser(match.userIds.find((id) => id !== userId));
  }

  function getLatestMatchForUser(userId) {
    return state.matches.filter((match) => match.userIds.includes(userId)).slice(-1)[0] || null;
  }

  function createMatch(fromUserId, toUserId) {
    const fromUser = getUser(fromUserId);
    const toUser = getUser(toUserId);
    if (!fromUser || !toUser) return null;
    if (fromUser.activeMatchId || toUser.activeMatchId) return null;

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
      dateProposal: null,
      dateProposalHistory: [],
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
    const fromUser = getUser(fromUserId);
    const toUser = getUser(toUserId);
    if (!fromUser || !toUser) return null;
    if (fromUser.activeMatchId || toUser.activeMatchId) return null;

    state.swipes.push({
      id: uid("swipe"),
      fromUserId,
      toUserId,
      direction,
      interestScore: direction === "right" ? Number(interestScore) : null,
      createdAt: nowIso(),
    });
    save();
    return null;
  }

  function getPendingMatchRequestBetween(userId, otherUserId) {
    return state.matchRequests.find((request) =>
      request.status === "pending" &&
      ((request.fromUserId === userId && request.toUserId === otherUserId) ||
      (request.fromUserId === otherUserId && request.toUserId === userId))
    ) || null;
  }

  function hasPendingMatchRequestBetween(userId, otherUserId) {
    return Boolean(getPendingMatchRequestBetween(userId, otherUserId));
  }

  function getIncomingMatchRequests(userId) {
    return state.matchRequests
      .filter((request) => request.toUserId === userId && request.status === "pending")
      .map((request) => ({ request, user: getUser(request.fromUserId) }))
      .filter((entry) => entry.user)
      .sort((left, right) => new Date(right.request.createdAt).getTime() - new Date(left.request.createdAt).getTime());
  }

  function getOutgoingMatchRequests(userId) {
    return state.matchRequests
      .filter((request) => request.fromUserId === userId && request.status === "pending")
      .map((request) => ({ request, user: getUser(request.toUserId) }))
      .filter((entry) => entry.user)
      .sort((left, right) => new Date(right.request.createdAt).getTime() - new Date(left.request.createdAt).getTime());
  }

  function sendMatchRequest(fromUserId, toUserId) {
    const fromUser = getUser(fromUserId);
    const toUser = getUser(toUserId);
    if (!fromUser || !toUser) return null;
    if (fromUser.activeMatchId || toUser.activeMatchId) return null;
    if (!hasIncomingLike(toUserId, fromUserId)) return null;

    const existing = getPendingMatchRequestBetween(fromUserId, toUserId);
    if (existing) return existing;

    const request = normalizeMatchRequest({
      id: uid("matchreq"),
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: nowIso(),
    });
    state.matchRequests.push(request);
    save();
    return request;
  }

  function confirmMatchRequest(requestId, userId) {
    const request = state.matchRequests.find((entry) => entry.id === requestId && entry.status === "pending");
    if (!request || request.toUserId !== userId) return null;
    const confirmer = getUser(userId);
    if (!confirmer || confirmer.activeMatchId) return null;

    const match = createMatch(request.fromUserId, request.toUserId);
    if (!match) return null;

    request.status = "confirmed";
    request.respondedAt = nowIso();
    state.matchRequests.forEach((entry) => {
      const samePair = [entry.fromUserId, entry.toUserId].includes(request.fromUserId) &&
        [entry.fromUserId, entry.toUserId].includes(request.toUserId);
      const touchesEitherUser = [entry.fromUserId, entry.toUserId].includes(request.fromUserId) ||
        [entry.fromUserId, entry.toUserId].includes(request.toUserId);
      if (entry.id !== request.id && samePair && entry.status === "pending") {
        entry.status = "confirmed";
        entry.respondedAt = request.respondedAt;
      } else if (entry.id !== request.id && touchesEitherUser && entry.status === "pending") {
        entry.status = "closed_locked";
        entry.respondedAt = request.respondedAt;
      }
    });
    save();
    return match;
  }

  function closeMatch(match, status, reason, applyShunToAll, shunCategory) {
    match.status = status;
    match.closedReason = reason;
    state.unmatchRequests.forEach((request) => {
      if (request.matchId !== match.id || request.status !== "pending") return;
      request.status = "closed_match_ended";
      request.respondedAt = nowIso();
      request.responderAnswer = "match_closed";
    });
    match.userIds.forEach((userId) => {
      const user = getUser(userId);
      if (!user) return;
      if (applyShunToAll) addShunToUser(userId, shunCategory);
      user.activeMatchId = null;
      user.status = "available";
    });
  }

  function closeMatchForSpecificUsers(match, status, reason, usersToShun, shunCategory) {
    match.status = status;
    match.closedReason = reason;
    state.unmatchRequests.forEach((request) => {
      if (request.matchId !== match.id || request.status !== "pending") return;
      request.status = "closed_match_ended";
      request.respondedAt = nowIso();
      request.responderAnswer = "match_closed";
    });
    const shunSet = new Set(usersToShun || []);
    match.userIds.forEach((userId) => {
      const user = getUser(userId);
      if (!user) return;
      if (shunSet.has(userId)) addShunToUser(userId, shunCategory);
      user.activeMatchId = null;
      user.status = "available";
    });
  }

  function getUsersMissingIntro(match) {
    return match.userIds.filter((userId) => !match.introVideos[userId]);
  }

  function getUsersMissingDateParticipation(match) {
    const proposal = match.dateProposal;
    if (!proposal || !proposal.proposedFor) {
      return [...match.userIds];
    }
    return match.userIds.filter((userId) => !proposal.acceptedBy.includes(userId));
  }

  function getUsersMissingDecision(match) {
    return match.userIds.filter((userId) => !match.decisions[userId]);
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

    closeMatch(match, "shun", "Non-mutual withdrawal or negative fit decision.", true, "decision_shun");
    save();
    return true;
  }

  function submitIntro(matchId, userId, payload = {}) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || match.status !== "pending_intro") return;
    match.introVideos[userId] = {
      uploadedAt: nowIso(),
      hasVideo: true,
      mediaId: payload.mediaId || "",
      mimeType: payload.mimeType || "",
      sizeBytes: Number(payload.sizeBytes || 0),
      durationSeconds: Number(payload.durationSeconds || 0),
    };
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

  function proposeDate(matchId, userId, payload) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || match.status !== "date_planning") {
      return { ok: false, error: "Date planning is not active." };
    }
    if (!match.userIds.includes(userId)) {
      return { ok: false, error: "Only matched users can propose a date." };
    }

    const proposedFor = String(payload.proposedFor || "").trim();
    const location = String(payload.location || "").trim();
    const note = String(payload.note || "").trim();
    if (!proposedFor || !location) {
      return { ok: false, error: "Add a date, time, and location." };
    }

    const proposedTime = new Date(proposedFor).getTime();
    if (Number.isNaN(proposedTime)) {
      return { ok: false, error: "Choose a valid date and time." };
    }
    if (proposedTime <= Date.now()) {
      return { ok: false, error: "The proposed date has to be in the future." };
    }
    if (proposedTime > new Date(match.dateDeadline).getTime()) {
      return { ok: false, error: "The proposed date must happen before the date-planning deadline." };
    }

    const currentProposal = match.dateProposal;
    const isSameAsCurrent = currentProposal &&
      currentProposal.proposedFor === proposedFor &&
      currentProposal.location === location &&
      String(currentProposal.note || "") === note;
    if (isSameAsCurrent) {
      return { ok: false, error: "This is already the current proposal. Confirm it or change the details." };
    }

    const entryType = match.dateProposal && match.dateProposal.proposedFor ? "counter" : "proposal";
    match.dateProposal = {
      proposedByUserId: userId,
      proposedFor,
      location,
      note,
      proposedAt: nowIso(),
      acceptedBy: [userId],
    };
    match.dateProposalHistory = Array.isArray(match.dateProposalHistory) ? match.dateProposalHistory : [];
    match.dateProposalHistory.push({
      id: uid("dateplan"),
      type: entryType,
      actorUserId: userId,
      proposedFor,
      location,
      note,
      createdAt: nowIso(),
    });
    match.dateConfirmedBy = [userId];
    save();
    return { ok: true, proposal: match.dateProposal };
  }

  function acceptDateProposal(matchId, userId) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || match.status !== "date_planning" || !match.dateProposal) return false;
    if (!match.userIds.includes(userId)) return false;

    if (!match.dateProposal.acceptedBy.includes(userId)) {
      match.dateProposal.acceptedBy.push(userId);
      match.dateProposalHistory = Array.isArray(match.dateProposalHistory) ? match.dateProposalHistory : [];
      match.dateProposalHistory.push({
        id: uid("dateplan"),
        type: "accept",
        actorUserId: userId,
        proposedFor: match.dateProposal.proposedFor,
        location: match.dateProposal.location,
        note: match.dateProposal.note,
        createdAt: nowIso(),
      });
    }
    if (!match.dateConfirmedBy.includes(userId)) {
      match.dateConfirmedBy.push(userId);
    }

    if (match.userIds.every((id) => match.dateProposal.acceptedBy.includes(id))) {
      match.datePhotoUploaded = true;
      match.status = "decision_window";
    }
    save();
    return true;
  }

  function getDatePlanningState(match, userId) {
    if (!match || match.status !== "date_planning") {
      return {
        key: "inactive",
        title: "Date planning inactive",
        detail: "",
      };
    }

    const proposal = match.dateProposal;
    if (!proposal || !proposal.proposedFor) {
      return {
        key: "awaiting_proposal",
        title: "Waiting for first date proposal",
        detail: "No date has been proposed yet. Either person can suggest the first plan.",
      };
    }

    if (match.userIds.every((id) => proposal.acceptedBy.includes(id))) {
      return {
        key: "date_confirmed",
        title: "Date agreed",
        detail: `Both people agreed on ${proposal.proposedFor} at ${proposal.location}.`,
      };
    }

    if (proposal.proposedByUserId === userId) {
      return {
        key: "waiting_on_them",
        title: "Waiting for their response",
        detail: `You proposed ${proposal.proposedFor} at ${proposal.location}. They can confirm it or suggest a different time.`,
      };
    }

    return {
      key: "waiting_on_you",
      title: "Review their date proposal",
      detail: `${getUser(proposal.proposedByUserId)?.name || "Your match"} proposed ${proposal.proposedFor} at ${proposal.location}. You can confirm it or suggest a different time.`,
    };
  }

  function getUnmatchOutcomeSummary(userId, request) {
    if (!request) return null;
    const initiator = getUser(request.initiatorId);
    const responder = getUser(request.responderId);
    const initiatedByMe = request.initiatorId === userId;
    const otherUser = initiatedByMe ? responder : initiator;
    const otherName = otherUser ? otherUser.name : "your match";

    if (request.status === "confirmed_mutual") {
      return {
        key: "mutual_unmatch",
        title: "Mutual unmatch completed",
        detail: `You and ${otherName} both agreed to end the match. No shun was assigned.`,
      };
    }

    if (request.status === "rejected_not_mutual") {
      return {
        key: "unmatch_rejected",
        title: initiatedByMe ? "Unmatch was not mutual" : "You rejected the unmatch",
        detail: initiatedByMe
          ? `${otherName} said the unmatch was not mutual. The requester received a Shun.`
          : `You marked the unmatch as not mutual. The requester received a Shun.`,
      };
    }

    if (request.status === "expired_no_response") {
      return {
        key: "unmatch_no_response",
        title: request.responderId === userId ? "Unmatch response timed out" : "Unmatch timed out",
        detail: request.responderId === userId
          ? `You did not answer ${otherName}'s unmatch request in time and received a Shun.`
          : `${otherName} did not answer the unmatch request in time and received a Shun.`,
      };
    }

    if (request.status === "closed_match_ended") {
      return {
        key: "unmatch_closed",
        title: "Unmatch request closed",
        detail: `The match ended for another reason before the unmatch request was resolved.`,
      };
    }

    return null;
  }

  function getDateProposalHistory(matchId) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match) return [];
    return (match.dateProposalHistory || [])
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
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
    if (!match) return null;
    const existing = getPendingUnmatchRequestForUser(userId);
    if (existing && existing.matchId === match.id) return existing;

    const responderId = match.userIds.find((id) => id !== userId);
    const request = normalizeUnmatchRequest({
      id: uid("unmatch"),
      matchId: match.id,
      initiatorId: userId,
      responderId,
      reason: "not_interested",
      status: "pending",
      createdAt: nowIso(),
      respondBy: addDays(nowIso(), 1),
      respondedAt: "",
      responderAnswer: "",
    });
    state.unmatchRequests.push(request);
    save();
    return request;
  }

  function submitUnmatchRequest(matchId, initiatorId, reason) {
    const match = state.matches.find((entry) => entry.id === matchId);
    if (!match || !match.userIds.includes(initiatorId)) return null;
    if (!["pending_intro", "date_planning", "decision_window"].includes(match.status)) return null;

    const existing = state.unmatchRequests.find((request) => request.matchId === matchId && request.status === "pending");
    if (existing) return existing;

    const responderId = match.userIds.find((id) => id !== initiatorId);
    const createdAt = nowIso();
    const request = normalizeUnmatchRequest({
      id: uid("unmatch"),
      matchId,
      initiatorId,
      responderId,
      reason,
      status: "pending",
      createdAt,
      respondBy: addDays(createdAt, 1),
      respondedAt: "",
      responderAnswer: "",
    });
    state.unmatchRequests.push(request);
    save();
    return request;
  }

  function respondToUnmatchRequest(requestId, responderId, isMutual) {
    const request = state.unmatchRequests.find((entry) => entry.id === requestId && entry.status === "pending");
    if (!request || request.responderId !== responderId) return null;

    const match = state.matches.find((entry) => entry.id === request.matchId);
    if (!match) return null;

    request.status = isMutual ? "confirmed_mutual" : "rejected_not_mutual";
    request.respondedAt = nowIso();
    request.responderAnswer = isMutual ? "yes" : "no";

    if (isMutual) {
      closeMatch(match, "unmatched", "Mutual unmatch confirmed by both people.", false);
    } else {
      closeMatchForSpecificUsers(match, "shun", "Unmatch was not mutual.", [request.initiatorId], "unmatch_not_mutual");
    }

    save();
    return request;
  }

  function getMessages(matchId) {
    return state.messages.filter((message) => message.matchId === matchId);
  }

  function getUnreadMessagesForUser(userId) {
    const activeMatch = getActiveMatchForUser(userId);
    const latestMatch = getLatestMatchForUser(userId);
    const match = activeMatch || latestMatch;
    if (!match) return [];

    const lastReadAt = (state.messageReads && state.messageReads[userId] && state.messageReads[userId][match.id]) || "";
    return getMessages(match.id).filter((message) => {
      if (message.senderId === userId) return false;
      if (!lastReadAt) return true;
      return new Date(message.createdAt).getTime() > new Date(lastReadAt).getTime();
    });
  }

  function getUnreadMessageCount(userId) {
    return getUnreadMessagesForUser(userId).length;
  }

  function markMessagesRead(userId, matchId, options = {}) {
    if (!userId || !matchId) return;
    state.messageReads = state.messageReads || {};
    state.messageReads[userId] = state.messageReads[userId] || {};
    const current = state.messageReads[userId][matchId] || "";
    const next = nowIso();
    if (current === next) return;
    state.messageReads[userId][matchId] = next;
    if (options.silent) {
      syncState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    }
    save("messages_read");
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
          addShunToUser(user.id, "moderation");
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

  function getNotificationsForUser(userId) {
    const user = getUser(userId);
    if (!user) return [];

    const notifications = [];
    const incomingRequests = getIncomingMatchRequests(userId);
    const outgoingRequests = getOutgoingMatchRequests(userId);
    const incomingLikes = getIncomingLikes(userId);
    const pendingUnmatch = getPendingUnmatchRequestToRespond(userId);
    const anyPendingUnmatch = getPendingUnmatchRequestForUser(userId);
    const activeMatch = getActiveMatchForUser(userId);

    if (!activeMatch && incomingLikes.length) {
      notifications.push({
        id: `likes-${userId}`,
        type: "likes",
        title: `${incomingLikes.length} incoming like${incomingLikes.length === 1 ? "" : "s"}`,
        detail: "Review who liked you and decide whether to send a match request.",
        href: "likes.html",
        priority: 1,
      });
    }

    if (incomingRequests.length) {
      notifications.push({
        id: `match-requests-${userId}`,
        type: "match_request",
        title: `${incomingRequests.length} match request${incomingRequests.length === 1 ? "" : "s"} waiting`,
        detail: "Review and confirm pending match requests.",
        href: "match-requests.html",
        priority: 1,
      });
    }

    if (!activeMatch && outgoingRequests.length) {
      notifications.push({
        id: `outgoing-match-requests-${userId}`,
        type: "outgoing_match_request",
        title: `${outgoingRequests.length} match request${outgoingRequests.length === 1 ? "" : "s"} awaiting response`,
        detail: "These people still need to confirm or ignore your request.",
        href: "likes.html",
        priority: 2,
      });
    }

    if (pendingUnmatch) {
      const otherUser = getUser(pendingUnmatch.initiatorId);
      notifications.push({
        id: `unmatch-response-${pendingUnmatch.id}`,
        type: "unmatch_response",
        title: "Unmatch response required",
        detail: `${otherUser ? otherUser.name : "Your match"} requested to unmatch. Respond within 24 hours or receive a Shun.`,
        href: "match.html",
        priority: 0,
      });
    }

    if (anyPendingUnmatch && anyPendingUnmatch.initiatorId === userId) {
      const otherUser = getUser(anyPendingUnmatch.responderId);
      notifications.push({
        id: `unmatch-waiting-${anyPendingUnmatch.id}`,
        type: "unmatch_waiting",
        title: "Waiting on unmatch response",
        detail: `${otherUser ? otherUser.name : "Your match"} has 24 hours to answer your unmatch request.`,
        href: "match.html",
        priority: 1,
      });
    }

    const latestUnmatchOutcome = getLatestUnmatchOutcomeForUser(userId);
    const unmatchSummary = getUnmatchOutcomeSummary(userId, latestUnmatchOutcome);
    if (unmatchSummary) {
      notifications.push({
        id: `unmatch-outcome-${latestUnmatchOutcome.id}`,
        type: "unmatch_outcome",
        title: unmatchSummary.title,
        detail: unmatchSummary.detail,
        href: "match.html",
        priority: 2,
      });
    }

    if (activeMatch && activeMatch.status === "pending_intro") {
      const hoursRemaining = Math.ceil((new Date(activeMatch.introDeadline).getTime() - new Date(state.system.now).getTime()) / (60 * 60 * 1000));
      const hasMyIntro = Boolean(activeMatch.introVideos[userId]);
      const otherUser = getOtherUser(activeMatch, userId);
      const hasOtherIntro = Boolean(otherUser && activeMatch.introVideos[otherUser.id]);
      notifications.push({
        id: `intro-deadline-${activeMatch.id}`,
        type: "intro_deadline",
        title: hasMyIntro ? `Waiting for ${otherUser ? otherUser.name : "your match"}'s intro` : "Your intro video is due",
        detail: hoursRemaining > 0
          ? hasMyIntro
            ? `${otherUser ? otherUser.name : "Your match"} still needs to submit their intro within ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}.`
            : `Submit the intro video within ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"} to avoid a Shun.`
          : "Intro deadline has expired. Reload to process the result.",
        href: "match.html",
        priority: hasMyIntro && hasOtherIntro ? 2 : 1,
      });
    }

    if (activeMatch && activeMatch.status === "date_planning") {
      const dateState = getDatePlanningState(activeMatch, userId);
      notifications.push({
        id: `date-planning-${activeMatch.id}`,
        type: "date_planning",
        title: dateState.title,
        detail: `${dateState.detail} Finish setting the date before ${new Date(activeMatch.dateDeadline).toLocaleString()} or both people receive a Shun.`,
        href: "match.html",
        priority: 1,
      });
    }

    if (activeMatch && activeMatch.status === "decision_window") {
      const myDecision = activeMatch.decisions[userId];
      const otherUser = getOtherUser(activeMatch, userId);
      notifications.push({
        id: `decision-window-${activeMatch.id}`,
        type: "decision_window",
        title: myDecision ? `Waiting for ${otherUser ? otherUser.name : "your match"}'s final decision` : "Final decision required",
        detail: myDecision
          ? `You already responded. ${otherUser ? otherUser.name : "Your match"} still needs to finish the final step before the deadline.`
          : "Choose attract, mutual not a fit, or shun before the deadline expires.",
        href: "match.html",
        priority: 1,
      });
    }

    const unreadMessages = getUnreadMessagesForUser(userId);
    if (unreadMessages.length) {
      const latestUnread = unreadMessages[unreadMessages.length - 1];
      const sender = getUser(latestUnread.senderId);
      notifications.push({
        id: `message-${latestUnread.id}`,
        type: "message",
        title: `New message from ${sender ? sender.name : "your match"}`,
        detail: "Open the conversation to read and reply.",
        href: "messages.html",
        priority: 0,
      });
    }

    const shunEntries = Object.entries(user.shunBreakdown || {}).filter(([, count]) => Number(count) > 0);
    if (shunEntries.length) {
      notifications.push({
        id: `shun-summary-${userId}`,
        type: "shun_summary",
        title: `${user.shunCount} total Shun${user.shunCount === 1 ? "" : "s"}`,
        detail: "Open your profile summary and click the Shun badge to see the full category breakdown.",
        href: "dashboard.html",
        priority: 2,
      });
    }

    return notifications.sort((left, right) => left.priority - right.priority);
  }

  function processDeadlines() {
    const currentTime = new Date(refreshSystemNow()).getTime();
    let changed = false;
    state.matches.forEach((match) => {
      if (!["pending_intro", "date_planning", "decision_window"].includes(match.status)) return;
      if (match.status === "pending_intro" && currentTime > new Date(match.introDeadline).getTime()) {
        const missingUsers = getUsersMissingIntro(match);
        const allMissing = missingUsers.length === match.userIds.length;
        if (allMissing) {
          closeMatch(match, "shun", "Neither person submitted the intro video in time.", true, "intro_timeout");
        } else {
          closeMatchForSpecificUsers(match, "shun", "Only the person who failed to submit the intro video in time received a Shun.", missingUsers, "intro_timeout");
        }
        changed = true;
      } else if (match.status === "date_planning" && currentTime > new Date(match.dateDeadline).getTime()) {
        const missingUsers = getUsersMissingDateParticipation(match);
        const allMissing = missingUsers.length === match.userIds.length;
        if (allMissing) {
          closeMatch(match, "shun", "Neither person participated in setting the first date in time.", true, "date_timeout");
        } else {
          closeMatchForSpecificUsers(match, "shun", "Only the person who failed to respond to the live date proposal in time received a Shun.", missingUsers, "date_timeout");
        }
        changed = true;
      } else if (match.status === "decision_window" && currentTime > new Date(match.decisionDeadline).getTime()) {
        const missingUsers = getUsersMissingDecision(match);
        const allMissing = missingUsers.length === match.userIds.length;
        if (allMissing) {
          closeMatch(match, "shun", "Neither person finished the final decision step in time.", true, "decision_timeout");
        } else {
          closeMatchForSpecificUsers(match, "shun", "Only the person who failed to submit the final decision in time received a Shun.", missingUsers, "decision_timeout");
        }
        changed = true;
      }
    });
    state.unmatchRequests.forEach((request) => {
      if (request.status !== "pending") return;
      if (currentTime <= new Date(request.respondBy).getTime()) return;
      const match = state.matches.find((entry) => entry.id === request.matchId);
      request.status = "expired_no_response";
      request.respondedAt = nowIso();
      request.responderAnswer = "no_response";
      if (match) {
        closeMatchForSpecificUsers(match, "shun", "Unmatch response deadline expired. Responder received a Shun.", [request.responderId], "unmatch_no_response");
      } else {
        const responder = getUser(request.responderId);
        if (responder) {
          addShunToUser(responder.id, "unmatch_no_response");
        }
      }
      changed = true;
    });
    if (changed) {
      save();
    } else {
      syncState();
    }
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

  function ensureHardcodedTestUsers() {
    let changed = false;

    HARD_CODED_TEST_USERS.forEach((payload) => {
      const existing = state.users.find((user) => user.email === payload.email);
      if (existing) return;

      const user = createUser(payload);
      user.onboardingCompleted = true;
      user.onboardingStep = "complete";
      changed = true;
    });

    if (!state.currentUserId && state.users[0]) {
      state.currentUserId = state.users[0].id;
      changed = true;
    }

    if (changed) {
      save();
    }
  }

  function seedDemoUsers() {
    const targetCount = 100;
    if (state.users.length >= targetCount) return;

    ensureHardcodedTestUsers();

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
      const lastLoginAt = new Date(Date.now() - ((index % 20) * DAY_MS)).toISOString();
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
        lastLoginAt,
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
    ensureHardcodedTestUsers,
    seedDemoUsers,
    getIncomingLikes,
    getLatestRightSwipe,
    hasIncomingLike,
    getAvailableCandidates,
    getBrowseCandidates,
    getPendingMatchRequestBetween,
    hasPendingMatchRequestBetween,
    getIncomingMatchRequests,
    getOutgoingMatchRequests,
    sendMatchRequest,
    confirmMatchRequest,
    getActiveMatchForUser,
    getPendingUnmatchRequestForUser,
    getPendingUnmatchRequestToRespond,
    getLatestUnmatchOutcomeForUser,
    getOtherUser,
    getLatestMatchForUser,
    recordSwipe,
    submitIntro,
    confirmDate,
    proposeDate,
    acceptDateProposal,
    submitDecision,
    unmatchCurrent,
    submitUnmatchRequest,
    respondToUnmatchRequest,
    getMessages,
    getUnreadMessagesForUser,
    getUnreadMessageCount,
    markMessagesRead,
    sendMessage,
    createReport,
    updateReportStatus,
    getReportsForUser,
    getOpenReports,
    updateSuccessStory,
    getStories,
    getDraftStory,
    getNotificationsForUser,
    getDatePlanningState,
    getDateProposalHistory,
    getUnmatchOutcomeSummary,
    advanceDay,
    resetAll,
    defaultPreferences,
  });

  processDeadlines();
  syncState();
  window.AppData = AppData;
})();

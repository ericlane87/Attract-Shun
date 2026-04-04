const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createSandbox() {
  const storage = new Map();
  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
      clear() {
        storage.clear();
      },
    },
  };
  sandbox.window = sandbox;
  return sandbox;
}

function loadAppData() {
  const sandbox = createSandbox();
  const source = fs.readFileSync(path.join(__dirname, "data.js"), "utf8");
  vm.runInNewContext(source, sandbox, { filename: "data.js" });
  return sandbox.window.AppData;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createUser(AppData, payload) {
  const user = AppData.createUser(payload);
  user.onboardingCompleted = true;
  user.onboardingStep = "complete";
  user.verified = true;
  user.preferences.profileVisible = true;
  return user;
}

function createMatchedPair(AppData, suffix = "1") {
  AppData.resetAll();
  const woman = createUser(AppData, {
    name: `Ava ${suffix}`,
    email: `ava.${suffix}@test.local`,
    password: "demo1234",
    sex: "female",
    age: 28,
    city: "New York",
    intent: "long_term",
    bio: "Test profile",
  });
  const man = createUser(AppData, {
    name: `Noah ${suffix}`,
    email: `noah.${suffix}@test.local`,
    password: "demo1234",
    sex: "male",
    age: 30,
    city: "New York",
    intent: "long_term",
    bio: "Test profile",
  });

  AppData.recordSwipe(man.id, woman.id, "right", 8);
  const request = AppData.sendMatchRequest(woman.id, man.id);
  assert(request, "Expected match request to be created");
  const match = AppData.confirmMatchRequest(request.id, man.id);
  assert(match, "Expected match to be confirmed");

  return { woman, man, match };
}

function isoLocalDaysFromNow(daysAhead) {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function expireMatchStep(AppData, match, key) {
  AppData.state.matches.find((entry) => entry.id === match.id)[key] = "2000-01-01T00:00:00.000Z";
  AppData.advanceDay();
}

function testActiveMatchLock() {
  const AppData = loadAppData();
  const { woman, man } = createMatchedPair(AppData, "lock");
  assert(AppData.getBrowseCandidates(woman.id).length === 0, "Browse should be locked during active match");
  assert(AppData.recordSwipe(woman.id, man.id, "right", 9) === null, "recordSwipe should not create swipes during active match");
  return "active match lock";
}

function testIntroTimeoutFairness() {
  const AppData = loadAppData();
  const { woman, man, match } = createMatchedPair(AppData, "intro");
  AppData.submitIntro(match.id, woman.id, { mediaId: "mock" });
  expireMatchStep(AppData, match, "introDeadline");
  assert(AppData.getUser(woman.id).shunCount === 0, "Intro submitter should not get a shun");
  assert(AppData.getUser(man.id).shunCount === 1, "Missing intro user should get a shun");
  assert(!AppData.getActiveMatchForUser(woman.id), "Match should be closed after intro timeout");
  return "intro timeout fairness";
}

function testDateTimeoutFairness() {
  const AppData = loadAppData();
  const { woman, man, match } = createMatchedPair(AppData, "date");
  AppData.submitIntro(match.id, woman.id, { mediaId: "a" });
  AppData.submitIntro(match.id, man.id, { mediaId: "b" });
  const proposal = AppData.proposeDate(match.id, woman.id, {
    proposedFor: isoLocalDaysFromNow(7),
    location: "Cafe",
    note: "Coffee",
  });
  assert(proposal && proposal.ok, "Expected valid date proposal");
  expireMatchStep(AppData, match, "dateDeadline");
  assert(AppData.getUser(woman.id).shunCount === 0, "Date proposer should not get a shun");
  assert(AppData.getUser(man.id).shunCount === 1, "Non-responding date user should get a shun");
  return "date timeout fairness";
}

function testDecisionTimeoutFairness() {
  const AppData = loadAppData();
  const { woman, man, match } = createMatchedPair(AppData, "decision");
  AppData.submitIntro(match.id, woman.id, { mediaId: "a" });
  AppData.submitIntro(match.id, man.id, { mediaId: "b" });
  AppData.proposeDate(match.id, woman.id, {
    proposedFor: isoLocalDaysFromNow(7),
    location: "Cafe",
    note: "Coffee",
  });
  AppData.acceptDateProposal(match.id, man.id);
  AppData.submitDecision(match.id, woman.id, "attract");
  expireMatchStep(AppData, match, "decisionDeadline");
  assert(AppData.getUser(woman.id).shunCount === 0, "Decision submitter should not get a shun");
  assert(AppData.getUser(man.id).shunCount === 1, "Non-responding decision user should get a shun");
  return "decision timeout fairness";
}

function testUnmatchTimeoutFairness() {
  const AppData = loadAppData();
  const { woman, man, match } = createMatchedPair(AppData, "unmatch");
  const request = AppData.submitUnmatchRequest(match.id, woman.id, "not_interested");
  assert(request, "Expected unmatch request");
  AppData.state.unmatchRequests.find((entry) => entry.id === request.id).respondBy = "2000-01-01T00:00:00.000Z";
  AppData.advanceDay();
  assert(AppData.getUser(woman.id).shunCount === 0, "Unmatch requester should not get a shun on timeout");
  assert(AppData.getUser(man.id).shunCount === 1, "Non-responding unmatch responder should get a shun");
  return "unmatch timeout fairness";
}

function testClosedMatchCleansPendingUnmatch() {
  const AppData = loadAppData();
  const { woman, man, match } = createMatchedPair(AppData, "cleanup");
  const request = AppData.submitUnmatchRequest(match.id, woman.id, "not_interested");
  assert(request, "Expected unmatch request");
  AppData.submitIntro(match.id, woman.id, { mediaId: "only-one" });
  expireMatchStep(AppData, match, "introDeadline");
  const latestUnmatch = AppData.getLatestUnmatchOutcomeForUser(woman.id);
  assert(latestUnmatch && latestUnmatch.status === "closed_match_ended", "Pending unmatch should close when match ends another way");
  return "pending unmatch cleanup";
}

function testDateProposalValidation() {
  const AppData = loadAppData();
  const { woman, man, match } = createMatchedPair(AppData, "validation");
  AppData.submitIntro(match.id, woman.id, { mediaId: "a" });
  AppData.submitIntro(match.id, man.id, { mediaId: "b" });

  const past = AppData.proposeDate(match.id, woman.id, {
    proposedFor: "2000-01-01T19:00",
    location: "Cafe",
    note: "Coffee",
  });
  assert(!past.ok, "Past proposal should fail");

  const first = AppData.proposeDate(match.id, woman.id, {
    proposedFor: isoLocalDaysFromNow(7),
    location: "Cafe",
    note: "Coffee",
  });
  assert(first.ok, "Future proposal should pass");

  const duplicate = AppData.proposeDate(match.id, man.id, {
    proposedFor: isoLocalDaysFromNow(7),
    location: "Cafe",
    note: "Coffee",
  });
  assert(!duplicate.ok, "Duplicate counter proposal should fail");
  return "date proposal validation";
}

const tests = [
  testActiveMatchLock,
  testIntroTimeoutFairness,
  testDateTimeoutFairness,
  testDecisionTimeoutFairness,
  testUnmatchTimeoutFairness,
  testClosedMatchCleansPendingUnmatch,
  testDateProposalValidation,
];

const results = [];
for (const test of tests) {
  try {
    results.push({ name: test(), ok: true });
  } catch (error) {
    results.push({ name: test.name, ok: false, error: error.message });
  }
}

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({ results }, null, 2));
if (failed.length) {
  process.exitCode = 1;
}

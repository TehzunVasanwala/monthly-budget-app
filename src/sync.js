const FIREBASE_URLS = {
  app: "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
  firestore: "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
};

let firebaseContext = null;

export function resetCloudContext() {
  firebaseContext = null;
}

export async function pushCloudState(state) {
  const context = await getFirebaseContext(state);
  const ref = context.doc(context.db, ...state.cloudSync.documentPath.split("/"));
  await context.setDoc(ref, { state, updatedAt: new Date().toISOString() });
  state.cloudSync.lastSyncedAt = new Date().toLocaleString("en-IN");
}

export async function pullCloudState(state, normalizeState) {
  const context = await getFirebaseContext(state);
  const ref = context.doc(context.db, ...state.cloudSync.documentPath.split("/"));
  const snapshot = await context.getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error("No cloud document found at that path.");
  }
  return normalizeState(snapshot.data().state || {});
}

async function getFirebaseContext(state) {
  if (firebaseContext) {
    return firebaseContext;
  }
  if (!state.cloudSync.firebaseConfigText || !state.cloudSync.documentPath) {
    throw new Error("Add Firebase config JSON and Firestore document path first.");
  }
  const parts = state.cloudSync.documentPath.split("/").filter(Boolean);
  if (parts.length < 2 || parts.length % 2 !== 0) {
    throw new Error("Firestore document path must have an even number of parts.");
  }
  let config;
  try {
    config = parseFirebaseConfig(state.cloudSync.firebaseConfigText);
  } catch (error) {
    throw new Error("Firebase config JSON is invalid. Paste only the Firebase config object or the full firebaseConfig block.");
  }

  const [{ initializeApp }, firestore] = await Promise.all([
    import(FIREBASE_URLS.app),
    import(FIREBASE_URLS.firestore),
  ]);

  const app = initializeApp(config, `monthly-budget-${config.projectId || "app"}`);
  firebaseContext = { ...firestore, db: firestore.getFirestore(app) };
  return firebaseContext;
}

function parseFirebaseConfig(input) {
  const cleaned = normalizeFirebaseConfigText(input);
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid Firebase config.");
  }
  if (!parsed.apiKey || !parsed.projectId || !parsed.appId) {
    throw new Error("Missing Firebase config fields.");
  }
  return parsed;
}

function normalizeFirebaseConfigText(input) {
  let text = String(input || "").trim();
  if (!text) {
    throw new Error("Empty Firebase config.");
  }

  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, " ");

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Firebase config object not found.");
  }
  text = text.slice(start, end + 1).trim();

  text = text
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");

  if (/"[A-Za-z0-9_]+"\s*:/.test(text)) {
    return text;
  }

  text = text.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
  text = text.replace(/:\s*'([^']*)'/g, ': "$1"');

  return text;
}

const admin = require("firebase-admin");
// const serviceAccount = require("../serviceAccountKey.json");

let firestore = null;

/**
 * Connects to Firestore on first use rather than when this file is loaded, so scripts that only
 * load the command definitions (like deploy-commands.js) don't need the Firebase key.
 * index.js calls this at startup so a missing key fails immediately.
 */
function getDb() {
  if (!firestore) {
    const serviceAccount = process.env.SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY) : null;
    if (!serviceAccount) {
      throw new Error('Missing SERVICE_ACCOUNT_KEY environment variable (Firebase service account JSON).');
    }
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestore = admin.firestore();
  }
  return firestore;
}

const db = {
  collection: (...args) => getDb().collection(...args),
  runTransaction: (...args) => getDb().runTransaction(...args),
};

/**
 * Get a user by Discord ID
 */
async function getUser(discordId) {
  const userRef = db.collection("users").doc(discordId);
  const doc = await userRef.get();
  return doc.exists ? normalizeUser(doc.data()) : null;
}

/**
 * Profiles used to store separate highPrio/lowPrio lists. Fold those into a
 * single `cards` array so old profiles keep working without a migration script.
 */
function normalizeUser(data) {
  if (!Array.isArray(data.cards)) {
    data.cards = [...(data.highPrio || []), ...(data.lowPrio || [])];
  }
  return data;
}

// Writing `cards` also removes the legacy fields.
function cardsUpdate(cards) {
  return {
    cards,
    highPrio: admin.firestore.FieldValue.delete(),
    lowPrio: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Replace a user's whole card list.
 * @returns {Promise<void>}
 */
async function setCards(discordId, cards) {
  await db.collection('users').doc(discordId).update(cardsUpdate(cards));
}

/**
 * Add cards to a user's list, skipping ones already on it (case-insensitive).
 * @returns {Promise<{added: string[], total: number}|null>} null if the user has no profile
 */
async function addCards(discordId, newCards) {
  const ref = db.collection('users').doc(discordId);
  return db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return null;

    const cards = normalizeUser(doc.data()).cards;
    const have = new Set(cards.map(c => c.toLowerCase()));
    const added = newCards.filter(c => !have.has(c.toLowerCase()));

    if (added.length) t.update(ref, cardsUpdate([...cards, ...added]));
    return { added, total: cards.length + added.length };
  });
}

/**
 * Remove one card (case-insensitive) from a user's list.
 * @returns {Promise<boolean|null>} true if removed, false if not on the list, null if no profile
 */
async function removeCard(discordId, cardName) {
  const ref = db.collection('users').doc(discordId);
  return db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return null;

    const cards = normalizeUser(doc.data()).cards;
    const remaining = cards.filter(c => c.toLowerCase() !== cardName.toLowerCase());
    if (remaining.length === cards.length) return false;

    t.update(ref, cardsUpdate(remaining));
    return true;
  });
}

/**
 * Create a new user profile.
 * Uses a transaction so two simultaneous calls can't both create the profile.
 * @returns {Promise<boolean>} true if created, false if the profile already existed.
 */
async function createUser(discordId, collectionUrl = null, tradebinderUrl = null) {
  const userRef = db.collection("users").doc(discordId);

  return db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    if (doc.exists) return false;

    t.set(userRef, {
      cards: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      collectionUrl,
      tradebinderUrl,
    });
    return true;
  });
}

async function updateUserLinks(discordId, collectionUrl, tradebinderUrl) {
  const updates = {};

  if (collectionUrl) {
    updates.collectionUrl = collectionUrl;
  }

  if (tradebinderUrl) {
    updates.tradebinderUrl = tradebinderUrl;
  }

  if (Object.keys(updates).length === 0) return false;

  await db.collection('users').doc(discordId).update(updates);
  return true;
}

module.exports = {
  getDb,
  db,
  admin, // export admin so you can use FieldValue.serverTimestamp()
  getUser,
  createUser,
  updateUserLinks,
  setCards,
  addCards,
  removeCard,
};

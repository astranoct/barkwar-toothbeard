const admin = require("firebase-admin");
// const serviceAccount = require("../serviceAccountKey.json");
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY) : null;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Get a user by Discord ID
 */
async function getUser(discordId) {
  const userRef = db.collection("users").doc(discordId);
  const doc = await userRef.get();
  return doc.exists ? doc.data() : null;
}

/**
 * Create a new user profile
 */
async function createUser(discordId, collectionUrl = null, tradebinderUrl = null) {
  const userRef = db.collection("users").doc(discordId);
  const doc = await userRef.get();
  if (doc.exists) return false;

  await userRef.set({
    highPrio: [],
    lowPrio: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    collectionUrl,
    tradebinderUrl,
  });

  return true;
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
  getUser,
  createUser,
  updateUserLinks,
};


module.exports = {
  db,
  admin, // export admin so you can use FieldValue.serverTimestamp()
  getUser,
  createUser,
  updateUserLinks,
};
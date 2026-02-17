const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

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
async function createUser(discordId, moxfieldUrl = null, tradebinderUrl = null) {
  const userRef = db.collection("users").doc(discordId);
  const doc = await userRef.get();
  if (doc.exists) return false;

  await userRef.set({
    highPrio: [],
    lowPrio: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    moxfieldUrl,
    tradebinderUrl,
  });

  return true;
}

module.exports = {
  db,
  admin, // export admin so you can use FieldValue.serverTimestamp()
  getUser,
  createUser,
};
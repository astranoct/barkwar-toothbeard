import admin from "firebase-admin";
// const serviceAccount = require("../serviceAccountKey.json");
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY) : null;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

/**
 * Finds a user document by Discord ID.
 * @param {string} discordId
 * @returns {Promise<Object|null>} The user data or null if not found.
 */
export async function findUserByDiscordId(discordId) {
    const snapshot = await db
        .collection("users")
        .where("discordId", "==", discordId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    } else {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
}

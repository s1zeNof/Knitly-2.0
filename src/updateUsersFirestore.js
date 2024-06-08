const admin = require('firebase-admin');
const serviceAccount = require('./firebaseSDK/knitly-92828-firebase-adminsdk-7cl04-7558a8abf4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAllUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  const updates = snapshot.docs.map(async (docSnapshot) => {
    try {
      const userData = docSnapshot.data();
      // Припускаємо, що поля following та followers існують
      const followingCount = userData.following ? userData.following.length : 0;
      const followersCount = userData.followers ? userData.followers.length : 0;

      // Оновлюємо документ користувача з новими даними
      await docSnapshot.ref.update({ followingCount, followersCount });
      console.log(`Updated user ${docSnapshot.id} successfully.`);
    } catch (error) {
      console.error(`Error updating user ${docSnapshot.id}:`, error);
    }
  });

  try {
    await Promise.all(updates);
    console.log('All users updated successfully.');
  } catch (error) {
    console.error('Error updating users:', error);
  }
}

updateAllUsers();

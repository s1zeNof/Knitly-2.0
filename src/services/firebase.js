import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    limit,
    orderBy,
    runTransaction // <-- ДОДАНО
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Ваш конфігураційний об'єкт залишається без змін
const firebaseConfig = {
    apiKey: "AIzaSyDo4UIKRxXU2uhLr250iyXNuC8J5n_8hz0",
    authDomain: "knitly-92828.firebaseapp.com",
    projectId: "knitly-92828",
    storageBucket: "knitly-92828.appspot.com",
    messagingSenderId: "123193175483",
    appId: "1:123193175483:web:cf32366c64021ab994a89e",
    measurementId: "G-XJE6PQKYH6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Всі існуючі експорти залишаються
export { 
    auth, 
    db, 
    storage,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    doc,
    setDoc,
    getDoc,
    sendPasswordResetEmail
};

export const getFollowing = async (userId) => {
    const followingRef = collection(db, 'users', userId, 'following');
    const snapshot = await getDocs(followingRef);
    const followingList = [];
    for (const userDoc of snapshot.docs) {
        const userProfileRef = doc(db, 'users', userDoc.id);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
            followingList.push({ uid: userProfileSnap.id, ...userProfileSnap.data() });
        }
    }
    return followingList;
};

export const searchUsers = async (searchTerm) => {
    if (!searchTerm) return [];
    const lowercasedName = searchTerm.toLowerCase();
    const usersRef = collection(db, 'users');
    const q = query(
        usersRef,
        where('lowercaseNickname', '>=', lowercasedName),
        where('lowercaseNickname', '<=', lowercasedName + '\uf8ff'),
        limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
};

const getUserProfileData = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const data = userSnap.data();
        return {
            displayName: data.displayName,
            photoURL: data.photoURL,
            userNickname: data.userNickname,
        };
    }
    return null;
};

// -- ОСЬ ОНОВЛЕНА ФУНКЦІЯ --
export const sharePostToChat = async (sender, recipient, post) => {
    if (!sender || !recipient || !post) {
        throw new Error('Недостатньо даних для поширення');
    }

    const chatId = [sender.uid, recipient.uid].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);

    try {
        await runTransaction(db, async (transaction) => {
            const chatDoc = await transaction.get(chatRef);

            if (!chatDoc.exists()) {
                transaction.set(chatRef, {
                    participants: [sender.uid, recipient.uid],
                    participantDetails: {
                        [sender.uid]: {
                            displayName: sender.displayName,
                            photoURL: sender.photoURL,
                            userNickname: sender.nickname,
                        },
                        [recipient.uid]: {
                            displayName: recipient.displayName,
                            photoURL: recipient.photoURL,
                            userNickname: recipient.nickname,
                        }
                    },
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });
            }

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const newMessageRef = doc(messagesRef);

            transaction.set(newMessageRef, {
                senderId: sender.uid,
                text: '',
                type: 'shared_post',
                postId: post.id,
                createdAt: serverTimestamp(),
            });

            transaction.update(chatRef, {
                lastMessage: '📎 Поширено допис',
                updatedAt: serverTimestamp(),
            });
        });
    } catch (error) {
        console.error("Помилка під час поширення допису:", error);
        throw new Error("Не вдалося надіслати допис.");
    }
};
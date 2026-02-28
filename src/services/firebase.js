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
    serverTimestamp,
    limit,
    orderBy,
    runTransaction,
    documentId,
    writeBatch
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// --- ОСНОВНІ ЕКСПОРТИ ---
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

// --- ПОКРАЩЕНА І ЕФЕКТИВНА ФУНКЦІЯ ---
export const getFollowing = async (userId) => {
    if (!userId) return [];
    try {
        const followingRef = collection(db, 'users', userId, 'following');
        const followingSnapshot = await getDocs(followingRef);
        const followingIds = followingSnapshot.docs.map(doc => doc.id);

        if (followingIds.length === 0) {
            return [];
        }

        // Отримуємо всіх користувачів одним запитом
        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', followingIds));
        const usersSnapshot = await getDocs(usersQuery);
        return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    } catch (error) {
        console.error("Error fetching following list:", error);
        return [];
    }
};

// --- НАДІЙНА ФУНКЦІЯ ПОШУКУ ---
export const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return [];
    try {
        const lowercasedTerm = searchTerm.toLowerCase();
        const usersRef = collection(db, 'users');

        // Новий, потужний запит, що використовує індексацію масивів
        const q = query(
            usersRef,
            where('searchKeywords', 'array-contains', lowercasedTerm),
            limit(10)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    } catch (error) {
        console.error("Error searching users:", error);
        // УВАГА: Для цього запиту Firestore також попросить створити індекс.
        // Перевірте консоль браузера на наявність посилання для його створення.
        return [];
    }
};

// Ваша існуюча функція
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
                    participantDetails: { /* ... */ },
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });
            }
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const newMessageRef = doc(messagesRef);
            transaction.set(newMessageRef, {
                senderId: sender.uid,
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

// --- НОВІ ФУНКЦІЇ З МИНУЛОГО КРОКУ ---
export const getUsersFromRecentChats = async (userId) => {
    if (!userId) return [];
    try {
        const chatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId),
            orderBy('updatedAt', 'desc'),
            limit(20)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        if (chatsSnapshot.empty) return [];

        const userIds = new Set();
        chatsSnapshot.docs.forEach(d => {
            d.data().participants.forEach(pId => {
                if (pId !== userId) userIds.add(pId);
            });
        });

        if (userIds.size === 0) return [];

        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', Array.from(userIds)));
        const usersSnapshot = await getDocs(usersQuery);
        return usersSnapshot.docs.map(d => ({ uid: d.id, ...d.data() }));

    } catch (error) {
        console.error("Error fetching users from recent chats:", error);
        return [];
    }
};

export const sharePostToChats = async (senderId, recipientIds, post) => {
    if (!senderId || recipientIds.length === 0 || !post) return;

    const batch = writeBatch(db);
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    if (!senderDoc.exists()) return;
    const senderData = senderDoc.data();

    for (const recipientId of recipientIds) {
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        if (!recipientDoc.exists()) continue;
        const recipientData = recipientDoc.data();

        const participants = [senderId, recipientId].sort();
        const chatId = participants.join('_');
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);

        const messageContent = {
            type: 'forwarded_post',
            postId: post.id,
            postText: post.text ? post.text.substring(0, 100) : '',
            postAuthorNickname: post.authors?.[0]?.nickname || '',
            postImageUrl: post.attachments?.[0]?.url || null,
        };

        if (!chatSnap.exists()) {
            batch.set(chatRef, {
                participants,
                isGroup: false,
                lastMessage: '📎 Поширено допис',
                updatedAt: serverTimestamp(),
                participantDetails: {
                    [senderId]: { displayName: senderData.displayName, photoURL: senderData.photoURL, nickname: senderData.nickname },
                    [recipientId]: { displayName: recipientData.displayName, photoURL: recipientData.photoURL, nickname: recipientData.nickname },
                }
            });
        } else {
            batch.update(chatRef, {
                lastMessage: '📎 Поширено допис',
                updatedAt: serverTimestamp(),
            });
        }

        const messageRef = doc(collection(db, 'messages'));
        batch.set(messageRef, {
            chatId,
            senderId: senderId,
            isRead: false,
            createdAt: serverTimestamp(),
            content: messageContent,
            type: 'shared_content',
        });
    }

    await batch.commit();
};
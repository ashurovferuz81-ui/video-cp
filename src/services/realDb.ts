import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Contact, Message, UserProfile } from '../types';

/**
 * Saves or updates registered user's profile in Firestore
 */
export async function saveUserProfileToDb(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(
      doc(db, 'users', profile.uid),
      {
        uid: profile.uid,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
        city: profile.city || 'Toshkent',
        status: 'online',
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Searches real registered users in Firestore by @username or name
 */
export async function searchRegisteredUsers(
  searchTerm: string,
  currentUid: string
): Promise<Contact[]> {
  const clean = searchTerm.trim().toLowerCase();
  const searchUsername = clean.startsWith('@') ? clean : `@${clean}`;
  const path = 'users';

  try {
    const usersRef = collection(db, path);
    // Query users
    const q = query(usersRef);
    const snapshot = await getDocs(q);

    const results: Contact[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.uid === currentUid) return; // don't return self

      const matchesUsername = data.username?.toLowerCase().includes(clean) ||
                              data.username?.toLowerCase() === searchUsername.toLowerCase();
      const matchesName = data.name?.toLowerCase().includes(clean);
      const matchesCity = data.city?.toLowerCase().includes(clean);

      if (matchesUsername || matchesName || matchesCity) {
        results.push({
          id: data.uid,
          name: data.name,
          username: data.username || `@user_${data.uid.slice(0, 5)}`,
          avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          city: data.city || 'Rossiya',
          country: 'Rossiya',
          timezone: data.city?.toLowerCase().includes('novosibirsk') ? 'Asia/Novosibirsk' : 'Europe/Moscow',
          timezoneLabel: data.city?.toLowerCase().includes('novosibirsk') ? 'UTC+7 (Sibir)' : 'UTC+3 (Moskva)',
          role: 'Foydalanuvchi',
          phone: data.phone || '+7',
          status: data.status || 'online',
          lastSeen: data.lastSeen ? 'Yaqinda faol bo‘lgan' : 'Onlayn',
          unreadCount: 0,
        });
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * Fetches all registered users so they appear in contact directory
 */
export function subscribeToRegisteredUsers(
  currentUid: string,
  onUsersLoaded: (contacts: Contact[]) => void
) {
  const path = 'users';
  const usersRef = collection(db, path);

  return onSnapshot(
    usersRef,
    (snapshot) => {
      const contacts: Contact[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.uid === currentUid) return;

        contacts.push({
          id: data.uid,
          name: data.name,
          username: data.username || `@user_${data.uid.slice(0, 5)}`,
          avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          city: data.city || 'Moskva',
          country: 'Rossiya',
          timezone: data.city?.toLowerCase().includes('novosibirsk') ? 'Asia/Novosibirsk' : 'Europe/Moscow',
          timezoneLabel: data.city?.toLowerCase().includes('novosibirsk') ? 'UTC+7 (Toshkentdan +2)' : 'UTC+3 (Toshkentdan -2)',
          role: 'Foydalanuvchi',
          phone: data.phone || '+7',
          status: data.status || 'online',
          lastSeen: 'Onlayn',
          unreadCount: 0,
        });
      });
      onUsersLoaded(contacts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Returns a stable conversation ID for two users
 */
export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * Subscribes to real-time messages in a conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessages: (msgs: Message[]) => void
) {
  const path = `conversations/${conversationId}/messages`;
  const messagesRef = collection(db, path);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const date = data.createdAt ? new Date(data.createdAt) : new Date();
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(
          date.getMinutes()
        ).padStart(2, '0')}`;

        msgs.push({
          id: d.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: timeStr,
          status: 'read',
          imageUrl: data.imageUrl,
          isAudio: data.isAudio,
          audioDuration: data.audioDuration,
          audioUrl: data.audioUrl,
          isMeetInvite: data.isMeetInvite,
          meetUri: data.meetUri,
          meetCode: data.meetCode,
        });
      });
      onMessages(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Sends a real message to Firestore
 */
export async function sendRealMessageToDb(
  conversationId: string,
  sender: { uid: string; name: string; username: string },
  recipientId: string,
  text: string,
  options?: Partial<Message>
): Promise<void> {
  const convPath = `conversations/${conversationId}`;
  const msgPath = `${convPath}/messages`;

  const nowIso = new Date().toISOString();

  try {
    // Ensure conversation document exists
    await setDoc(
      doc(db, 'conversations', conversationId),
      {
        participants: [sender.uid, recipientId],
        participantUsernames: [sender.username],
        lastMessageText: text,
        lastMessageSenderId: sender.uid,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // Add message
    await addDoc(collection(db, msgPath), {
      senderId: sender.uid,
      senderName: sender.name,
      senderUsername: sender.username,
      text,
      createdAt: nowIso,
      imageUrl: options?.imageUrl || null,
      isAudio: options?.isAudio || false,
      audioDuration: options?.audioDuration || null,
      audioUrl: options?.audioUrl || null,
      isMeetInvite: options?.isMeetInvite || false,
      meetUri: options?.meetUri || null,
      meetCode: options?.meetCode || null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, msgPath);
  }
}

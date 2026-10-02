/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { initAuth } from './services/firebase';
import { Contact, Message, UserProfile } from './types';
import { Header } from './components/Header';
import { TimeZoneBar } from './components/TimeZoneBar';
import { ContactList } from './components/ContactList';
import { ChatWindow } from './components/ChatWindow';
import { GoogleMeetModal } from './components/GoogleMeetModal';
import { CurrencyAndServicesModal } from './components/CurrencyAndServicesModal';
import { AddContactModal } from './components/AddContactModal';
import { UserProfileModal } from './components/UserProfileModal';
import { InAppCallModal } from './components/InAppCallModal';
import { FloatingCallWidget } from './components/FloatingCallWidget';
import { SetUsernameModal } from './components/SetUsernameModal';
import { IncomingCallBanner } from './components/IncomingCallBanner';
import {
  saveUserProfileToDb,
  subscribeToRegisteredUsers,
  getConversationId,
  subscribeToConversationMessages,
  sendRealMessageToDb,
} from './services/realDb';
import {
  listenForIncomingCalls,
  RealCallSession,
} from './services/webrtcCall';
import { Users, LogIn, Sparkles, UserPlus } from 'lucide-react';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [user, setUser] = useState<User | null>(null);

  // User's personal @username and city (persisted in localStorage and Firestore)
  const [myUsername, setMyUsername] = useState<string>(() => {
    return localStorage.getItem('aloqa_username') || '';
  });
  const [myCity, setMyCity] = useState<string>(() => {
    return localStorage.getItem('aloqa_user_city') || 'Toshkent';
  });

  // Active in-app call state
  const [activeCall, setActiveCall] = useState<{
    contact: Contact;
    type: 'video' | 'audio';
    isIncoming?: boolean;
    incomingCallData?: RealCallSession;
    isMinimized: boolean;
  } | null>(null);

  // Incoming call notification
  const [incomingCall, setIncomingCall] = useState<RealCallSession | null>(null);

  // Modals & Panels
  const [showTimeBar, setShowTimeBar] = useState<boolean>(true);
  const [isMeetModalOpen, setIsMeetModalOpen] = useState<boolean>(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState<boolean>(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSetUsernameModalOpen, setIsSetUsernameModalOpen] = useState<boolean>(false);
  const [initialAddUsername, setInitialAddUsername] = useState<string>('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState<boolean>(false);

  const unsubMessagesRef = useRef<(() => void) | null>(null);

  // Current user profile object
  const currentUserProfile: UserProfile | null = user
    ? {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Foydalanuvchi',
        email: user.email || '',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        username: myUsername || `@user_${user.uid.slice(0, 5)}`,
        city: myCity,
      }
    : null;

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (currentUser) => {
        setUser(currentUser);

        // Retrieve or generate username
        let savedUsername = localStorage.getItem('aloqa_username');
        if (!savedUsername) {
          savedUsername = currentUser.email
            ? `@${currentUser.email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 15)}`
            : `@user_${currentUser.uid.slice(0, 5)}`;
          setMyUsername(savedUsername);
          localStorage.setItem('aloqa_username', savedUsername);
          setIsSetUsernameModalOpen(true);
        } else {
          setMyUsername(savedUsername);
        }

        const savedCity = localStorage.getItem('aloqa_user_city') || 'Toshkent';

        // Save real user profile to Firestore
        await saveUserProfileToDb({
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Foydalanuvchi',
          email: currentUser.email || '',
          avatar: currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          username: savedUsername,
          city: savedCity,
        });
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to real registered users from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToRegisteredUsers(user.uid, (dbUsers) => {
      setContacts((prev) => {
        // Merge without duplicates
        const map = new Map<string, Contact>();
        prev.forEach((c) => map.set(c.id, c));
        dbUsers.forEach((u) => map.set(u.id, u));
        const merged = Array.from(map.values());
        if (!selectedContactId && merged.length > 0) {
          setSelectedContactId(merged[0].id);
        }
        return merged;
      });
    });

    return () => {
      unsub();
    };
  }, [user]);

  // Listen for real incoming WebRTC calls
  useEffect(() => {
    if (!user) return;
    const unsub = listenForIncomingCalls(user.uid, (call) => {
      // Don't alert if we're already on that call
      if (activeCall?.incomingCallData?.callId === call.callId) return;
      setIncomingCall(call);
    });

    return () => {
      unsub();
    };
  }, [user, activeCall]);

  const activeContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const activeMessages = selectedContactId ? (messages[selectedContactId] || []) : [];

  // Subscribe to real-time conversation messages when active contact changes
  useEffect(() => {
    if (!user || !activeContact) return;

    if (unsubMessagesRef.current) {
      unsubMessagesRef.current();
      unsubMessagesRef.current = null;
    }

    const convId = getConversationId(user.uid, activeContact.id);
    unsubMessagesRef.current = subscribeToConversationMessages(convId, (msgs) => {
      setMessages((prev) => ({
        ...prev,
        [activeContact.id]: msgs,
      }));
    });

    return () => {
      if (unsubMessagesRef.current) {
        unsubMessagesRef.current();
        unsubMessagesRef.current = null;
      }
    };
  }, [user, activeContact?.id]);

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsMobileChatOpen(true);

    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = async (text: string, options?: Partial<Message>) => {
    if (!user || !activeContact) {
      setIsAuthModalOpen(true);
      return;
    }

    const convId = getConversationId(user.uid, activeContact.id);

    // Send real message to Firestore
    await sendRealMessageToDb(
      convId,
      {
        uid: user.uid,
        name: user.displayName || 'Men',
        username: myUsername || '@men',
      },
      activeContact.id,
      text,
      options
    );
  };

  const handleSendMeetLink = (meetUri: string, code: string) => {
    handleSendMessage('📹 Google Meet orqali video muloqot havolasi:', {
      isMeetInvite: true,
      meetUri,
      meetCode: code,
    });
  };

  const handleAddContact = (newContact: Contact) => {
    setContacts((prev) => {
      const exists = prev.some((c) => c.id === newContact.id || c.username === newContact.username);
      return exists ? prev : [newContact, ...prev];
    });
    setSelectedContactId(newContact.id);
    setIsMobileChatOpen(true);
  };

  const handleSaveUsername = async (username: string, city: string) => {
    setMyUsername(username);
    setMyCity(city);
    localStorage.setItem('aloqa_username', username);
    localStorage.setItem('aloqa_user_city', city);

    if (user) {
      await saveUserProfileToDb({
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Foydalanuvchi',
        email: user.email || '',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        username,
        city,
      });
    }
  };

  const handleQuickAddFromSearch = (usernameQuery: string) => {
    const clean = usernameQuery.trim().toLowerCase();
    const finalUsername = clean.startsWith('@') ? clean : `@${clean}`;

    const existing = contacts.find(
      (c) => c.username.toLowerCase() === finalUsername.toLowerCase()
    );

    if (existing) {
      setSelectedContactId(existing.id);
      setIsMobileChatOpen(true);
      return;
    }

    let defaultCity = 'Moskva';
    if (finalUsername.includes('spb') || finalUsername.includes('piter')) defaultCity = 'Sankt-Peterburg';
    if (finalUsername.includes('qozon') || finalUsername.includes('kazan')) defaultCity = 'Qozon';
    if (finalUsername.includes('novosib') || finalUsername.includes('sibir')) defaultCity = 'Novosibirsk';
    if (finalUsername.includes('ural') || finalUsername.includes('yekat')) defaultCity = 'Yekaterinburg';

    const rawName = finalUsername.replace('@', '');
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const newContact: Contact = {
      id: `user_${Date.now()}`,
      name: `${displayName} (${defaultCity})`,
      username: finalUsername,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      city: defaultCity,
      country: 'Rossiya',
      timezone: defaultCity === 'Novosibirsk' ? 'Asia/Novosibirsk' : 'Europe/Moscow',
      timezoneLabel: defaultCity === 'Novosibirsk' ? 'UTC+7 (Toshkentdan +2)' : 'UTC+3 (Toshkentdan -2)',
      role: 'Foydalanuvchi',
      phone: '+7',
      status: 'online',
      lastSeen: 'Onlayn',
      unreadCount: 0,
      notes: `${finalUsername} qidiruv orqali topildi.`,
    };

    handleAddContact(newContact);
  };

  // Start real outgoing in-app WebRTC call
  const handleStartInAppCall = (type: 'video' | 'audio') => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!activeContact) return;

    setActiveCall({
      contact: activeContact,
      type,
      isMinimized: false,
    });
  };

  // Accept incoming call
  const handleAcceptIncomingCall = (call: RealCallSession) => {
    setIncomingCall(null);
    const callerContact: Contact = {
      id: call.callerId,
      name: call.callerName,
      username: call.callerUsername,
      avatar: call.callerAvatar,
      city: 'Rossiya',
      country: 'Rossiya',
      timezone: 'Europe/Moscow',
      timezoneLabel: 'UTC+3 (Moskva)',
      role: 'Foydalanuvchi',
      phone: '+7',
      status: 'online',
      lastSeen: 'Onlayn',
      unreadCount: 0,
    };

    setActiveCall({
      contact: callerContact,
      type: call.type,
      isIncoming: true,
      incomingCallData: call,
      isMinimized: false,
    });
  };

  // Reject incoming call
  const handleRejectIncomingCall = (call: RealCallSession) => {
    setIncomingCall(null);
  };

  const handleEndInAppCall = () => {
    setActiveCall(null);
  };

  const handleMinimizeCall = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isMinimized: true });
    }
  };

  const handleRestoreCall = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isMinimized: false });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Application Header */}
      <Header
        user={user}
        currentUsername={myUsername}
        onOpenMeetModal={() => setIsMeetModalOpen(true)}
        onOpenServicesModal={() => setIsServicesModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleTimeBar={() => setShowTimeBar(!showTimeBar)}
        showTimeBar={showTimeBar}
      />

      {/* Cross-border Time Difference Bar */}
      {showTimeBar && <TimeZoneBar />}

      {/* Incoming Call Notification Bar */}
      {incomingCall && (
        <IncomingCallBanner
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}

      {/* Main Responsive Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Contacts list */}
        <div
          className={`w-full sm:w-80 md:w-96 shrink-0 h-full ${
            isMobileChatOpen ? 'hidden sm:block' : 'block'
          }`}
        >
          <ContactList
            contacts={contacts}
            selectedContactId={selectedContactId}
            currentUid={user ? user.uid : ''}
            onSelectContact={handleSelectContact}
            onOpenAddModal={(initialUser) => {
              setInitialAddUsername(initialUser || '');
              setIsAddContactModalOpen(true);
            }}
            onAddContactDirect={(newC) => handleAddContact(newC)}
            messages={messages}
          />
        </div>

        {/* Right Area: Chat Window */}
        <div
          className={`flex-1 h-full ${
            !isMobileChatOpen ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeContact ? (
            <ChatWindow
              contact={activeContact}
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              onOpenMeetModal={() => setIsMeetModalOpen(true)}
              onStartInAppCall={handleStartInAppCall}
              onBackMobile={() => setIsMobileChatOpen(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Rossiyadagi tanishlar bilan jonli aloqa
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Barcha xabarlar va video qo‘ng‘iroqlar haqiqiy foydalanuvchilar o‘rtasida to‘g‘ridan-to‘g‘ri amalga oshiriladi.
                </p>
              </div>

              {!user ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Google orqali tizimga kirish</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>@username orqali yangi a’zo qo‘shish</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Direct In-App Calling Screen (Real WebRTC) */}
      {activeCall && !activeCall.isMinimized && (
        <InAppCallModal
          contact={activeCall.contact}
          callType={activeCall.type}
          isIncoming={activeCall.isIncoming}
          incomingCallData={activeCall.incomingCallData}
          currentUser={currentUserProfile}
          onEndCall={handleEndInAppCall}
          onMinimize={handleMinimizeCall}
        />
      )}

      {/* Floating Picture-in-Picture Call Widget when Minimized */}
      {activeCall && activeCall.isMinimized && (
        <FloatingCallWidget
          contact={activeCall.contact}
          callType={activeCall.type}
          onRestore={handleRestoreCall}
          onEndCall={handleEndInAppCall}
        />
      )}

      {/* Modals */}
      <GoogleMeetModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        user={user}
        onSendMeetLinkToChat={handleSendMeetLink}
        onStartInAppCall={handleStartInAppCall}
        activeContactName={activeContact ? activeContact.name : 'Tanish'}
      />

      <CurrencyAndServicesModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
      />

      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onAddContact={handleAddContact}
        currentUid={user ? user.uid : ''}
        initialUsername={initialAddUsername}
      />

      <UserProfileModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        currentUsername={myUsername}
        userCity={myCity}
        onOpenSetUsername={() => setIsSetUsernameModalOpen(true)}
        onAuthChanged={(newUser) => setUser(newUser)}
      />

      {/* Modal to choose personal @username after Google Sign In */}
      {user && (
        <SetUsernameModal
          isOpen={isSetUsernameModalOpen}
          onClose={() => setIsSetUsernameModalOpen(false)}
          user={user}
          currentUsername={myUsername}
          onSaveUsername={handleSaveUsername}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Contact, Message } from '../types';
import { searchRegisteredUsers } from '../services/realDb';
import { Search, UserPlus, MapPin, Pin, Sparkles, Loader2, MessageSquare } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string;
  currentUid: string;
  onSelectContact: (contactId: string) => void;
  onOpenAddModal: (initialUser?: string) => void;
  onAddContactDirect: (contact: Contact) => void;
  messages: Record<string, Message[]>;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedContactId,
  currentUid,
  onSelectContact,
  onOpenAddModal,
  onAddContactDirect,
  messages,
}) => {
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState<'all' | 'moskva' | 'piter' | 'boshqa'>('all');
  const [dbSearchResults, setDbSearchResults] = useState<Contact[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  const cleanSearch = search.trim().toLowerCase();

  // Local filter
  const filteredContacts = contacts.filter((c) => {
    if (!cleanSearch) return true;
    const matchesSearch =
      c.name.toLowerCase().includes(cleanSearch) ||
      c.username.toLowerCase().includes(cleanSearch) ||
      c.city.toLowerCase().includes(cleanSearch);

    if (!matchesSearch) return false;

    if (filterCity === 'moskva') return c.city.toLowerCase().includes('moskva');
    if (filterCity === 'piter') return c.city.toLowerCase().includes('peterburg');
    if (filterCity === 'boshqa')
      return !c.city.toLowerCase().includes('moskva') && !c.city.toLowerCase().includes('peterburg');

    return true;
  });

  // Real search in Firestore database when search term is entered
  useEffect(() => {
    if (!cleanSearch || cleanSearch.length < 2) {
      setDbSearchResults([]);
      setIsSearchingDb(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      try {
        const results = await searchRegisteredUsers(cleanSearch, currentUid);
        // Exclude users already present in contacts
        const existingIds = new Set(contacts.map((c) => c.id));
        const newResults = results.filter((r) => !existingIds.has(r.id));
        setDbSearchResults(newResults);
      } catch (err) {
        console.warn('Error searching users in Firestore:', err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [cleanSearch, currentUid, contacts]);

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-r border-slate-800">
      {/* Header & Search */}
      <div className="p-3 sm:p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Suhbatlar</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {contacts.length}
            </span>
          </div>

          <button
            onClick={() => onOpenAddModal()}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1 text-xs font-semibold px-2.5 transition-all"
            title="A’zo qo‘shish"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>A’zo qo‘shish</span>
          </button>
        </div>

        {/* Real Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki @username bo‘yicha qidirish..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
          />
          {isSearchingDb ? (
            <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
          ) : search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded"
            >
              ×
            </button>
          ) : null}
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
          <button
            onClick={() => setFilterCity('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterCity === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setFilterCity('moskva')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterCity === 'moskva'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Moskva
          </button>
          <button
            onClick={() => setFilterCity('piter')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterCity === 'piter'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Sankt-Peterburg
          </button>
          <button
            onClick={() => setFilterCity('boshqa')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterCity === 'boshqa'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Boshqa shaharlar
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar">
        {/* Real search results from Firestore database */}
        {dbSearchResults.length > 0 && (
          <div className="p-3 bg-slate-950/60 border-b border-blue-500/20 space-y-2">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bazada topilgan foydalanuvchilar:</span>
            </span>
            <div className="space-y-1.5">
              {dbSearchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="font-mono text-[10px] text-blue-400">{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onAddContactDirect(user);
                      setSearch('');
                      setDbSearchResults([]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Suhbat</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local contacts list */}
        {sortedContacts.length === 0 && dbSearchResults.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2.5">
            {cleanSearch ? (
              <div>
                <p className="text-xs text-slate-300 font-semibold">
                  "{search}" bo‘yicha hech kim topilmadi
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bazada bunday @username yoki ism mavjud emas. Tanishlaringiz avval ilovaga kirib @username yaratishlari kerak.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-300">Suhbatlar mavjud emas</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Yuqoridagi "A’zo qo‘shish" tugmasi orqali tanishingizning @username nomini kiritib suhbat boshlang.
                </p>
              </div>
            )}
          </div>
        ) : (
          sortedContacts.map((contact) => {
            const isSelected = contact.id === selectedContactId;
            const chatMessages = messages[contact.id] || [];
            const lastMsg = chatMessages[chatMessages.length - 1];

            return (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={`w-full text-left p-3 sm:p-3.5 flex items-start gap-3 transition-colors relative ${
                  isSelected
                    ? 'bg-blue-600/10 border-l-4 border-l-blue-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700/60 shadow-sm"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs sm:text-sm font-semibold text-white truncate">
                        {contact.name}
                      </span>
                      {contact.isPinned && (
                        <Pin className="w-3 h-3 text-blue-400 shrink-0 fill-blue-400/30" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {lastMsg ? lastMsg.timestamp : ''}
                    </span>
                  </div>

                  {/* Username & City */}
                  <div className="flex items-center gap-1.5 text-[11px] mb-1">
                    <span className="font-mono text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 text-[10px]">
                      {contact.username}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-medium text-slate-300 truncate">{contact.city}</span>
                  </div>

                  {/* Last message preview */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 truncate">
                      {lastMsg ? (
                        lastMsg.isAudio ? (
                          '🎤 Ovozli xabar'
                        ) : lastMsg.isMeetInvite ? (
                          '📹 Video taklif'
                        ) : lastMsg.imageUrl ? (
                          '📷 Rasm'
                        ) : (
                          lastMsg.text
                        )
                      ) : (
                        'Yangi suhbat'
                      )}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

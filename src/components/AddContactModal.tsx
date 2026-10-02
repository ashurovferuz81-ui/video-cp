import React, { useState } from 'react';
import { Contact } from '../types';
import { searchRegisteredUsers } from '../services/realDb';
import { UserPlus, AtSign, Search, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Contact) => void;
  currentUid?: string;
  initialUsername?: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
  currentUid = '',
  initialUsername = '',
}) => {
  const [tab, setTab] = useState<'username' | 'custom'>('username');
  const [searchUsername, setSearchUsername] = useState(initialUsername.replace(/^@*/, ''));
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [foundUser, setFoundUser] = useState<Contact | null>(null);

  // Custom contact state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('Moskva');
  const [phone, setPhone] = useState('+7 ');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSearchDb = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = searchUsername.replace(/^@*/, '').trim().toLowerCase();
    if (!cleanUser) return;

    setSearching(true);
    setSearched(true);
    setFoundUser(null);

    try {
      const results = await searchRegisteredUsers(cleanUser, currentUid);
      const match = results.find(
        (r) =>
          r.username.toLowerCase() === `@${cleanUser}` ||
          r.username.toLowerCase().includes(cleanUser)
      );

      if (match) {
        setFoundUser(match);
      } else {
        setFoundUser(null);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFoundUser = () => {
    if (!foundUser) return;
    onAddContact(foundUser);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let timezone = 'Europe/Moscow';
    let timezoneLabel = 'UTC+3 (Toshkentdan -2 soat)';

    if (city.toLowerCase().includes('novosibirsk')) {
      timezone = 'Asia/Novosibirsk';
      timezoneLabel = 'UTC+7 (Toshkentdan +2 soat)';
    } else if (city.toLowerCase().includes('yekaterinburg')) {
      timezone = 'Asia/Yekaterinburg';
      timezoneLabel = 'UTC+5 (Toshkent bilan bir xil)';
    }

    const cleanUsername = username
      ? `@${username.replace(/^@*/, '').toLowerCase()}`
      : `@${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const newContact: Contact = {
      id: `manual_${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      city: city.trim(),
      country: 'Rossiya',
      timezone,
      timezoneLabel,
      role: role.trim() || 'Tanish',
      phone: phone.trim(),
      status: 'online',
      lastSeen: 'Onlayn',
      unreadCount: 0,
      notes: notes.trim(),
    };

    onAddContact(newContact);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">A’zo / Tanish qo‘shish</h3>
              <p className="text-xs text-slate-400">Haqiqiy bazadan @username orqali qidirish</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setTab('username')}
            className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'username'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AtSign className="w-3.5 h-3.5" />
            <span>@username bo‘yicha qidirish</span>
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'custom'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Qo‘lda kiritish</span>
          </button>
        </div>

        {tab === 'username' ? (
          <div className="p-5 space-y-4 text-xs">
            <form onSubmit={handleSearchDb} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Foydalanuvchining aniq @username nomini kiriting:
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-blue-400 font-bold text-sm select-none">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={searchUsername}
                    onChange={(e) => {
                      setSearchUsername(e.target.value);
                      setSearched(false);
                      setFoundUser(null);
                    }}
                    placeholder="masalan: sardor_moskva"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching || !searchUsername.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Bazada qidirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Haqiqiy bazadan qidirish</span>
                  </>
                )}
              </button>
            </form>

            {/* Results display */}
            {searched && !searching && (
              <div className="pt-2">
                {foundUser ? (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Foydalanuvchi topildi!</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={foundUser.avatar}
                        alt={foundUser.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{foundUser.name}</h4>
                        <p className="font-mono text-blue-400 text-xs">{foundUser.username}</p>
                        <p className="text-[11px] text-slate-400">{foundUser.city}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleAddFoundUser}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kontaktga qo‘shish va suhbatlashish</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-slate-300 space-y-1.5 text-[11px] animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Bunday foydalanuvchi topilmadi</span>
                    </div>
                    <p className="text-slate-400">
                      Bazada <strong>@{searchUsername}</strong> nomli ro‘yxatdan o‘tgan foydalanuvchi mavjud emas. Tanishlaringiz avval Google orqali ilovaga kirib @username yaratishlari kerak.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Ism va familiya:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Sardorbek"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">@username:</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-blue-400 font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sardor_moskva"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-2 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Shahar:</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Moskva">Moskva</option>
                  <option value="Sankt-Peterburg">Sankt-Peterburg</option>
                  <option value="Qozon">Qozon</option>
                  <option value="Yekaterinburg">Yekaterinburg</option>
                  <option value="Novosibirsk">Novosibirsk</option>
                  <option value="Toshkent">Toshkent</option>
                  <option value="Boshqa shahar">Boshqa shahar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Telefon raqam:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Eslatma:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Manzil yoki qaydlar..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md shadow-blue-500/20"
              >
                Kontaktni saqlash
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AtSign, Check, Sparkles, UserCheck, X } from 'lucide-react';

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentUsername: string;
  onSaveUsername: (username: string, city: string) => void;
}

export const SetUsernameModal: React.FC<SetUsernameModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUsername,
  onSaveUsername,
}) => {
  // Clean initial username without duplicate @
  const initial = currentUsername
    ? currentUsername.replace(/^@+/, '')
    : user.displayName
    ? user.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15)
    : user.email
    ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15)
    : 'foydalanuvchi';

  const [usernameInput, setUsernameInput] = useState(initial);
  const [city, setCity] = useState('Toshkent');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (val: string) => {
    // Only allow lowercase letters, numbers, and underscores
    const cleaned = val.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsernameInput(cleaned);
    if (cleaned.length < 3) {
      setError('Username kamida 3 ta belgidan iborat bo‘lishi kerak');
    } else {
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = `@${usernameInput.trim()}`;
    if (usernameInput.trim().length < 3) {
      setError('Username kamida 3 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    onSaveUsername(finalUsername, city);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <AtSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Shaxsiy @username tanlang</h3>
              <p className="text-xs text-slate-400">Qidiruvda sizni topishlari uchun noyob nom</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* User Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profil'}
                className="w-11 h-11 rounded-xl object-cover border border-blue-500/40"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                {user.displayName || 'Google foydalanuvchisi'}
              </h4>
              <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Sizning @username nomingiz:
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-blue-400 font-bold text-sm select-none">
                @
              </span>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="masalan: sardor_moskva"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-white font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {error ? (
              <p className="text-red-400 text-[11px] mt-1">{error}</p>
            ) : usernameInput.length >= 3 ? (
              <p className="text-emerald-400 text-[11px] mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>@{usernameInput} nomi qidiruv uchun qulay va mos!</span>
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Hozirgi joylashuvingiz (shahar):
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="Moskva">Moskva (Rossiya)</option>
              <option value="Sankt-Peterburg">Sankt-Peterburg (Rossiya)</option>
              <option value="Qozon">Qozon (Rossiya)</option>
              <option value="Yekaterinburg">Yekaterinburg (Rossiya)</option>
              <option value="Novosibirsk">Novosibirsk (Rossiya)</option>
              <option value="Toshkent">Toshkent (O‘zbekiston)</option>
              <option value="Samarqand">Samarqand (O‘zbekiston)</option>
              <option value="Boshqa shahar">Boshqa shahar</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-2 text-slate-300 text-[11px]">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Do‘stlaringiz qidiruv satriga <strong className="text-white">@{usernameInput || 'nom'}</strong> deb yozganda, sizning profilingiz chiqadi va ular siz bilan darhol suhbat boshlashi mumkin.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Keyinroq
            </button>
            <button
              type="submit"
              disabled={usernameInput.trim().length < 3}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              Saqlash va tasdiqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

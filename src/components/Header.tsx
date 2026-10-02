import React from 'react';
import { User } from 'firebase/auth';
import { Video, DollarSign, Clock, UserCheck, LogIn, Sparkles, PhoneCall } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  currentUsername: string;
  onOpenMeetModal: () => void;
  onOpenServicesModal: () => void;
  onOpenAuthModal: () => void;
  onToggleTimeBar: () => void;
  showTimeBar: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentUsername,
  onOpenMeetModal,
  onOpenServicesModal,
  onOpenAuthModal,
  onToggleTimeBar,
  showTimeBar,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                A
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Aloqa
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Rossiya ⇄ UZB
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Rossiyadagi tanishlar bilan tezkor muloqot va Google Meet aloqasi
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Time Zones Toggle */}
          <button
            onClick={onToggleTimeBar}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showTimeBar
                ? 'bg-slate-800 text-blue-400 border-blue-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Moskva va Toshkent vaqt zonalari"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Vaqt zonalari</span>
          </button>

          {/* Currency & Services */}
          <button
            onClick={onOpenServicesModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 flex items-center gap-1.5 transition-colors"
            title="Valyuta kursi (Rubl/So'm) va Elchixona raqamlari"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Valyuta & Qo‘llanma</span>
          </button>

          {/* Quick Google Meet Launcher */}
          <button
            onClick={onOpenMeetModal}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
            title="Google Meet uchrashuv yaratish"
          >
            <div className="relative">
              <Video className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            </div>
            <span>Google Meet</span>
          </button>

          {/* User Profile / Sign in */}
          {user ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 p-1 pl-2 sm:pl-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-colors"
            >
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="font-semibold text-slate-200 truncate max-w-[100px] leading-tight">
                  {user.displayName?.split(' ')[0] || 'Foydalanuvchi'}
                </span>
                <span className="font-mono text-[10px] text-blue-400 font-bold leading-none">
                  {currentUsername || '@username'}
                </span>
              </div>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profil'}
                  className="w-7 h-7 rounded-md object-cover border border-blue-500/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Google orqali kirish</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

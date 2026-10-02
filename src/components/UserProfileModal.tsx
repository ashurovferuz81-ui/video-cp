import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../services/firebase';
import { ShieldCheck, LogOut, X, Video, CheckCircle2, AlertCircle, Loader2, AtSign, Edit3 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentUsername: string;
  userCity: string;
  onOpenSetUsername: () => void;
  onAuthChanged: (user: User | null) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUsername,
  userCity,
  onOpenSetUsername,
  onAuthChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthChanged(res.user);
        onClose();
        // Prompt for username if not yet set
        if (!currentUsername) {
          onOpenSetUsername();
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Google orqali kirishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logout();
      onAuthChanged(null);
      onClose();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Foydalanuvchi hisobi</span>
            {user && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                Faol
              </span>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profil'}
                    className="w-12 h-12 rounded-xl object-cover border border-blue-500/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">
                    {user.displayName || 'Foydalanuvchi'}
                  </h4>
                  <p className="text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Username Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-blue-400" />
                    <span>Sizning @username:</span>
                  </span>
                  <p className="font-mono text-base font-bold text-blue-400">
                    {currentUsername || '@foydalanuvchi'}
                  </p>
                  <p className="text-[11px] text-slate-400">Joylashuv: {userCity || 'Toshkent'}</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSetUsername();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-semibold text-xs flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>O‘zgartirish</span>
                </button>
              </div>

              {/* Workspace Meet Scope Badge */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Google Meet integratsiyasi faol</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Google Workspace orqali to‘g‘ridan-to‘g‘ri video qo‘ng‘iroqlar xonalari yaratishingiz va Rossiyadagi tanishlaringizga yuborishingiz mumkin.
                </p>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-300 border border-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Google hisobi bilan tizimga kirish
                </h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Google orqali kirganingizda o‘zingizga shaxsiy <strong className="text-white">@username</strong> tanlaysiz va tanishlaringiz sizni qidiruvda darhol topishadi.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-left flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Official Google Sign In Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 bg-white text-slate-800 font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:bg-slate-100 transition-all border border-slate-200 active:scale-98 w-full cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  )}
                  <span className="text-xs sm:text-sm font-bold">Google orqali tizimga kirish</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

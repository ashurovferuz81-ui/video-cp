import React, { useEffect } from 'react';
import { RealCallSession } from '../services/webrtcCall';
import { callSounds } from '../utils/audioTones';
import { Phone, PhoneOff, Video, Volume2 } from 'lucide-react';

interface IncomingCallBannerProps {
  call: RealCallSession;
  onAccept: (call: RealCallSession) => void;
  onReject: (call: RealCallSession) => void;
}

export const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  call,
  onAccept,
  onReject,
}) => {
  useEffect(() => {
    callSounds.startOutgoingRing();
    return () => {
      callSounds.stopRing();
    };
  }, []);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-6">
      <div className="bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={call.callerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={call.callerName}
              className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{call.callerName}</span>
              <span className="font-mono text-emerald-400 text-[10px] font-semibold">
                {call.callerUsername}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              {call.type === 'video' ? (
                <>
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kiruvchi video qo‘ng‘iroq...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kiruvchi ovozli qo‘ng‘iroq...</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              callSounds.stopRing();
              onReject(call);
            }}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md active:scale-95 transition-all"
            title="Rad etish"
          >
            <PhoneOff className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              callSounds.stopRing();
              onAccept(call);
            }}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse active:scale-95 transition-all"
            title="Qabul qilish"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

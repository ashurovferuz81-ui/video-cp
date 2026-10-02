import React from 'react';
import { Contact } from '../types';
import { Maximize2, PhoneOff, Video, Mic, MicOff } from 'lucide-react';

interface FloatingCallWidgetProps {
  contact: Contact;
  callType: 'video' | 'audio';
  onRestore: () => void;
  onEndCall: () => void;
}

export const FloatingCallWidget: React.FC<FloatingCallWidgetProps> = ({
  contact,
  callType,
  onRestore,
  onEndCall,
}) => {
  return (
    <div className="fixed bottom-20 right-4 z-40 bg-slate-900/95 border-2 border-blue-500/50 rounded-2xl shadow-2xl p-2.5 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5">
      <div className="relative cursor-pointer" onClick={onRestore}>
        <img
          src={contact.avatar}
          alt={contact.name}
          className="w-11 h-11 rounded-xl object-cover border border-slate-700"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900 animate-ping"></span>
      </div>

      <div className="cursor-pointer" onClick={onRestore}>
        <h5 className="text-xs font-bold text-white truncate max-w-[120px]">{contact.name}</h5>
        <p className="text-[10px] text-emerald-400 font-mono">Qo‘ng‘iroq davom etmoqda...</p>
      </div>

      <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
        <button
          onClick={onRestore}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          title="Kattalashtirish"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onEndCall}
          className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white"
          title="Tugatish"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

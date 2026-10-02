import React, { useState, useEffect } from 'react';
import { CITY_CLOCKS } from '../data/mockData';
import { Sun, Moon, Cloud, CloudRain, Clock, Info } from 'lucide-react';

export const TimeZoneBar: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCityTime = (timeZone: string) => {
    try {
      const formatter = new Intl.DateTimeFormat('uz-UZ', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      return formatter.format(now);
    } catch {
      return '--:--:--';
    }
  };

  const getHour = (timeZone: string) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hour12: false,
      });
      return parseInt(formatter.format(now), 10);
    } catch {
      return 12;
    }
  };

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-medium shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Vaqt farqlari:</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {CITY_CLOCKS.map((city) => {
            const timeStr = formatCityTime(city.timezone);
            const hour = getHour(city.timezone);
            const isNight = hour >= 23 || hour < 7;
            const isWorkHour = hour >= 9 && hour < 19;

            return (
              <div
                key={city.name}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${
                  isNight
                    ? 'bg-slate-950/60 border-indigo-950/60 text-indigo-300'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isNight ? (
                    <Moon className="w-3 h-3 text-indigo-400" />
                  ) : (
                    <Sun className="w-3 h-3 text-amber-400" />
                  )}
                  <span className="font-semibold text-white">{city.name}</span>
                </div>

                <span className="font-mono font-bold text-blue-400 bg-slate-950/60 px-1.5 py-0.5 rounded text-[11px]">
                  {timeStr}
                </span>

                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                    isNight
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : isWorkHour
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                  title={
                    isNight
                      ? 'Tungi dam olish vaqti (qo‘ng‘iroq qilmang)'
                      : isWorkHour
                      ? 'Ish va muloqot uchun qulay vaqt'
                      : 'Kechki vaqt'
                  }
                >
                  {isNight ? 'Tun' : isWorkHour ? 'Ish vaqti' : 'Kechki'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
          <Info className="w-3 h-3 text-blue-400" />
          <span>Moskva Toshkentdan 2 soat orqada</span>
        </div>
      </div>
    </div>
  );
};

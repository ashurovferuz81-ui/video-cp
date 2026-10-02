import React, { useState } from 'react';
import { EMERGENCY_CONTACTS } from '../data/mockData';
import {
  DollarSign,
  ArrowRightLeft,
  Building2,
  Phone,
  ShieldAlert,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';

interface CurrencyAndServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyAndServicesModal: React.FC<CurrencyAndServicesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'currency' | 'contacts' | 'guide'>('currency');

  // Currency Converter State
  const [rate, setRate] = useState<number>(138.5); // 1 RUB = ~138.5 UZS
  const [rubAmount, setRubAmount] = useState<string>('10000');
  const [uzsAmount, setUzsAmount] = useState<string>('1385000');
  const [commission, setCommission] = useState<number>(1); // 1% transfer commission

  if (!isOpen) return null;

  const handleRubChange = (val: string) => {
    setRubAmount(val);
    const num = parseFloat(val) || 0;
    const uzs = Math.round(num * rate);
    setUzsAmount(uzs ? uzs.toString() : '');
  };

  const handleUzsChange = (val: string) => {
    setUzsAmount(val);
    const num = parseFloat(val) || 0;
    const rub = rate > 0 ? (num / rate).toFixed(2) : '0';
    setRubAmount(rub !== '0' ? rub : '');
  };

  const rubNum = parseFloat(rubAmount) || 0;
  const uzsTotal = Math.round(rubNum * rate);
  const commissionAmount = Math.round((rubNum * (commission / 100)) * rate);
  const netUzs = uzsTotal - commissionAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Rossiya & UZB Amaliy Qo‘llanmasi</h3>
              <p className="text-xs text-slate-400">Valyuta kalkulyatori va rasmiy elchixona ma’lumotlari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('currency')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'currency'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Rubl ⇄ So‘m Kursi</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'contacts'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Elchixona & Aloqa</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Patent va Eslatmalar</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Joriy hisob kursi:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">1 RUB =</span>
                    <input
                      type="number"
                      step="0.1"
                      value={rate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setRate(val);
                        if (rubAmount) {
                          setUzsAmount(Math.round((parseFloat(rubAmount) || 0) * val).toString());
                        }
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 font-bold text-emerald-400 text-right"
                    />
                    <span className="text-slate-400">UZS</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">
                      Rossiya Rubli (RUB ₽)
                    </label>
                    <input
                      type="number"
                      value={rubAmount}
                      onChange={(e) => handleRubChange(e.target.value)}
                      placeholder="Masalan: 15000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold text-white mt-1.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">
                      O‘zbekiston So‘mi (UZS so‘m)
                    </label>
                    <input
                      type="number"
                      value={uzsAmount}
                      onChange={(e) => handleUzsChange(e.target.value)}
                      placeholder="Masalan: 2000000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold text-emerald-400 mt-1.5 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Transfer Calculation Breakdown */}
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>O‘tkazma summasi:</span>
                    <span className="font-semibold text-white">
                      {rubNum.toLocaleString()} RUB ≈ {uzsTotal.toLocaleString()} UZS
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>O‘rtacha komissiya (1%):</span>
                    <span>~ {commissionAmount.toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-emerald-500/20 text-xs">
                    <span>Kartaga yetib borishi:</span>
                    <span>~ {netUzs.toLocaleString()} UZS</span>
                  </div>
                </div>
              </div>

              {/* Quick transfer buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                {['5000', '10000', '20000', '35000', '50000'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleRubChange(amt)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {parseInt(amt).toLocaleString()} ₽
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {EMERGENCY_CONTACTS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {item.type}
                    </span>
                    <h4 className="font-bold text-white text-xs sm:text-sm mt-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.address}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <a
                      href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-mono font-bold flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{item.phone}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Rossiyaga kelganda muhim qadamlar:</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px] pl-1 leading-relaxed">
                  <li>
                    <strong className="text-white">Migratsiya kartasi:</strong> Chegarada "Ishlash" (Работа) maqsadi ko‘rsatilgan bo‘lishi shart.
                  </li>
                  <li>
                    <strong className="text-white">Ro‘yxatdan o‘tish (Registratsiya):</strong> Kelgandan so‘ng 15 ish kuni ichida vaqtincha turar joy bo‘yicha ro‘yxatdan o‘ting.
                  </li>
                  <li>
                    <strong className="text-white">Patent rasmiylashtirish:</strong> 30 kun ichida patent uchun hujjat topshirish talab etiladi (tibbiy ko‘rik, barmoq izi, rus tili testi).
                  </li>
                  <li>
                    <strong className="text-white">Oylik to‘lov:</strong> Har oy belgilangan muddatdan kechikmasdan patent kvitansiyasini to‘lab boring.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Pasport va asosiy hujjatlaringizning sifatli fotosuratlarini telefoningizda yoki Telegram / bulutli xotirada saqlab qo‘ying.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

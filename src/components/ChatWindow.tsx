import React, { useState, useRef, useEffect } from 'react';
import { Contact, Message, PhraseTemplate } from '../types';
import { QUICK_PHRASES } from '../data/mockData';
import {
  Video,
  Phone,
  Send,
  Languages,
  Mic,
  Image as ImageIcon,
  Paperclip,
  Check,
  CheckCheck,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Info,
  Sparkles,
  ChevronDown,
  X,
  Volume2,
} from 'lucide-react';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string, options?: Partial<Message>) => void;
  onOpenMeetModal: () => void;
  onStartInAppCall: (type: 'video' | 'audio') => void;
  onBackMobile?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  messages,
  onSendMessage,
  onOpenMeetModal,
  onStartInAppCall,
  onBackMobile,
}) => {
  const [inputText, setInputText] = useState('');
  const [showPhrases, setShowPhrases] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [translatedMap, setTranslatedMap] = useState<Record<string, { text: string; lang: string }>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real Audio recording & playback refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectPhrase = (phrase: PhraseTemplate, lang: 'uz' | 'ru') => {
    const text = lang === 'uz' ? phrase.uz : phrase.ru;
    onSendMessage(text);
    setShowPhrases(false);
  };

  // Real Audio playback
  const handleToggleAudio = (msg: Message) => {
    if (playingAudioId === msg.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (msg.audioUrl) {
      const audio = new Audio(msg.audioUrl);
      currentAudioRef.current = audio;
      setPlayingAudioId(msg.id);

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          const pct = (audio.currentTime / audio.duration) * 100;
          setAudioProgress((prev) => ({ ...prev, [msg.id]: pct }));
        }
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress((prev) => ({ ...prev, [msg.id]: 0 }));
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingAudioId(null);
        currentAudioRef.current = null;
      };

      audio.play().catch((err) => {
        console.warn('Audio play:', err);
        setPlayingAudioId(null);
      });
    } else {
      // Fallback pulse for text-only audio tag
      setPlayingAudioId(msg.id);
      setTimeout(() => {
        setPlayingAudioId(null);
      }, (msg.audioDuration || 4) * 1000);
    }
  };

  // Start real microphone recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      recordStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordDuration(0);
    } catch (err) {
      console.warn('Microphone error:', err);
      alert('Mikrofon ruxsati berilmadi. Iltimos, brauzer sozlamalarida mikrofondan foydalanishga ruxsat bering.');
    }
  };

  // Cancel recording
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordStreamRef.current) {
      recordStreamRef.current.getTracks().forEach((track) => track.stop());
      recordStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordDuration(0);
  };

  // Stop recording and send real recorded audio
  const handleSendVoiceNote = () => {
    if (!mediaRecorderRef.current) {
      setIsRecording(false);
      return;
    }

    const duration = recordDuration;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        onSendMessage('🎤 Ovozli xabar', {
          isAudio: true,
          audioDuration: duration || 1,
          audioUrl: base64Audio,
        });
      };

      if (recordStreamRef.current) {
        recordStreamRef.current.getTracks().forEach((track) => track.stop());
        recordStreamRef.current = null;
      }
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
    setRecordDuration(0);
  };

  const handleCopyMeet = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Instant smart translation dictionary & fallback generator
  const handleTranslateMessage = (msgId: string, currentText: string) => {
    if (translatedMap[msgId]) {
      // Toggle off
      const next = { ...translatedMap };
      delete next[msgId];
      setTranslatedMap(next);
      return;
    }

    // Smart heuristic translation for common cross-border Uzbek/Russian communication
    let translated = '';
    let targetLang = 'uz';

    const lower = currentText.toLowerCase();

    // Check if primarily Russian
    if (/[а-яё]/i.test(currentText)) {
      targetLang = 'uz';
      if (lower.includes('здравствуйте') || lower.includes('добрый день')) {
        translated = 'Assalomu alaykum! Xayrli kun.';
      } else if (lower.includes('как дела')) {
        translated = 'Ishlar qanday?';
      } else if (lower.includes('патент') || lower.includes('квитанци')) {
        translated = 'Patent va kvitansiya to‘lovi haqida so‘ralmoqda.';
      } else if (lower.includes('договор') || lower.includes('график')) {
        translated = 'Mehnat shartnomasi va ish jadvali bo‘yicha ma’lumot.';
      } else if (lower.includes('перевод паспорта') || lower.includes('регистраци')) {
        translated = 'Iltimos, pasport tarjimasi va registratsiya hujjatlarini tayyorlang.';
      } else if (lower.includes('деньги') || lower.includes('карту') || lower.includes('баланс')) {
        translated = 'Pul o‘tkazmasi va karta balansi haqida ma’lumot.';
      } else if (lower.includes('созвониться') || lower.includes('meet')) {
        translated = 'Hozir Google Meet orqali bog‘lanish taklif qilindi.';
      } else {
        translated = `[O‘zbekcha tarjima]: ${currentText.replace(/Здравствуйте/g, 'Salom').replace(/договор/g, 'shartnoma').replace(/патент/g, 'patent')}`;
      }
    } else {
      // Uzbek to Russian
      targetLang = 'ru';
      if (lower.includes('assalomu alaykum')) {
        translated = 'Здравствуйте! Как ваши дела?';
      } else if (lower.includes('rahmat') || lower.includes('yaxshi')) {
        translated = 'Спасибо, всё хорошо!';
      } else if (lower.includes('patent')) {
        translated = 'По поводу оплаты патента и квитанций.';
      } else if (lower.includes('kartaga pul')) {
        translated = 'Я перевел деньги на банковскую карту, проверьте пожалуйста.';
      } else if (lower.includes('google meet') || lower.includes('video')) {
        translated = 'Давайте созвонимся по видеосвязи через Google Meet.';
      } else {
        translated = `[Перевод на русский]: ${currentText}`;
      }
    }

    setTranslatedMap((prev) => ({
      ...prev,
      [msgId]: { text: translated, lang: targetLang },
    }));
  };

  // Sample photo attachment trigger
  const handleAttachSamplePhoto = (type: 'patent' | 'moscow' | 'ticket') => {
    const photos = {
      patent: {
        url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        caption: 'Hujjat va patent to‘lovi cheki',
      },
      moscow: {
        url: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=600&auto=format&fit=crop&q=80',
        caption: 'Moskva shahridan rasm',
      },
      ticket: {
        url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
        caption: 'Toshkent - Moskva samolyot reysi',
      },
    };
    const item = photos[type];
    onSendMessage(item.caption, { imageUrl: item.url });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Chat Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white"
            >
              ←
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700/80"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                contact.status === 'online'
                  ? 'bg-emerald-500'
                  : contact.status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate">{contact.name}</h3>
              <span className="font-mono text-blue-400 font-semibold text-[11px] bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                {contact.username}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium hidden sm:inline">
                {contact.city}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">
                {contact.status === 'online' ? 'Onlayn' : contact.lastSeen}
              </span>
              <span>•</span>
              <span className="text-slate-400 text-[11px] truncate">{contact.timezoneLabel}</span>
            </div>
          </div>
        </div>

        {/* Action buttons on header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Direct In-App Video Call */}
          <button
            onClick={() => onStartInAppCall('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            title="Ilovaning o‘zida to‘g‘ridan-to‘g‘ri video qo‘ng‘iroq"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Video qo‘ng‘iroq</span>
          </button>

          {/* Direct In-App Voice Call */}
          <button
            onClick={() => onStartInAppCall('audio')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-colors"
            title="Ilovaning o‘zida to‘g‘ridan-to‘g‘ri ovozli qo‘ng‘iroq"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          {/* Google Meet Link modal trigger */}
          <button
            onClick={onOpenMeetModal}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors hidden md:flex items-center gap-1 text-xs"
            title="Google Meet havolasini yaratish"
          >
            <span>Meet link</span>
          </button>

          {/* Contact Details Toggle */}
          <button
            onClick={() => setShowContactInfo(!showContactInfo)}
            className={`p-2 rounded-lg border transition-colors ${
              showContactInfo
                ? 'bg-slate-800 border-blue-500 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Tanish haqida ma’lumot"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chat Body & Optional Info Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 flex flex-col overflow-y-auto px-3 sm:px-6 py-4 space-y-3.5 custom-scrollbar">
          {/* Welcome Encrypted banner */}
          <div className="flex justify-center my-1">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-full px-3.5 py-1 text-[11px] text-slate-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{contact.name} bilan to‘g‘ridan-to‘g‘ri shaxsiy muloqot</span>
            </div>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === 'me';
            const translation = translatedMap[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md relative transition-all ${
                    isMe
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Photo if present */}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden cursor-pointer group/img relative">
                      <img
                        src={msg.imageUrl}
                        alt="Yuborilgan rasm"
                        onClick={() => setActivePhotoModal(msg.imageUrl || null)}
                        className="w-full max-h-60 object-cover rounded-xl transition-transform group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        Kattalashtirish
                      </div>
                    </div>
                  )}

                  {/* Audio voice note if present */}
                  {msg.isAudio ? (
                    <div className="flex items-center gap-3 py-1 min-w-[210px]">
                      <button
                        onClick={() => handleToggleAudio(msg)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isMe
                            ? 'bg-white text-blue-600'
                            : 'bg-blue-600 text-white shadow-sm'
                        }`}
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full transition-all duration-200 ${
                              isMe ? 'bg-white' : 'bg-blue-500'
                            }`}
                            style={{ width: `${audioProgress[msg.id] || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 text-slate-300">
                          <span>0:{msg.audioDuration ? String(msg.audioDuration).padStart(2, '0') : '14'}</span>
                          <span>Ovozli xabar</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Google Meet Card if present */}
                  {msg.isMeetInvite ? (
                    <div className="my-1 p-3 rounded-xl bg-slate-950/70 border border-blue-500/30 text-white space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-400">Video Qo‘ng‘iroq</p>
                          <p className="text-[11px] text-slate-300">To‘g‘ridan-to‘g‘ri ilova ichida yoki Meet orqali</p>
                        </div>
                      </div>

                      {/* Primary Direct In-App Call Button */}
                      <button
                        onClick={() => onStartInAppCall('video')}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-98 transition-all"
                      >
                        <Video className="w-4 h-4" />
                        <span>Ilovaning o‘zida to‘g‘ridan-to‘g‘ri bog‘lanish</span>
                      </button>

                      <div className="text-[11px] font-mono bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 flex items-center justify-between gap-2">
                        <span className="truncate">{msg.meetUri || 'https://meet.google.com/new'}</span>
                        <button
                          onClick={() => handleCopyMeet(msg.meetUri || 'https://meet.google.com/new')}
                          className="text-blue-400 hover:text-blue-300 shrink-0 p-1"
                          title="Havoladan nusxa olish"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {copiedLink === (msg.meetUri || 'https://meet.google.com/new') && (
                        <p className="text-[10px] text-emerald-400 font-medium">✓ Nusxa olindi!</p>
                      )}

                      <a
                        href={msg.meetUri || 'https://meet.google.com/new'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                      >
                        <span>Tashqi Google Meet havolasi</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : null}

                  {/* Regular Text */}
                  {!msg.isAudio && !msg.isMeetInvite && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  )}

                  {/* Translated Box if active */}
                  {translation && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-xs bg-black/20 p-2 rounded-lg">
                      <div className="flex items-center gap-1 text-[10px] text-blue-300 font-semibold mb-0.5">
                        <Languages className="w-3 h-3" />
                        <span>{translation.lang === 'uz' ? 'O‘zbekcha tarjima' : 'Перевод на русский'}:</span>
                      </div>
                      <p className="italic text-slate-100">{translation.text}</p>
                    </div>
                  )}

                  {/* Meta Bar: Timestamp, ticks, translate button */}
                  <div
                    className={`flex items-center justify-between gap-3 text-[10px] mt-1.5 pt-0.5 ${
                      isMe ? 'text-blue-100/80' : 'text-slate-400'
                    }`}
                  >
                    {/* Translate Button */}
                    {!msg.isAudio && !msg.isMeetInvite && (
                      <button
                        onClick={() => handleTranslateMessage(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:underline font-medium text-[10px] text-blue-300 hover:text-white"
                        title="O‘zbekcha <-> Ruscha tarjima"
                      >
                        <Languages className="w-3 h-3" />
                        <span>{translation ? 'Aslini ko‘rish' : 'Tarjima qilish'}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <span>{msg.timestamp}</span>
                      {isMe && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-300/70" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-blue-300/60" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Optional Right Drawer: Contact Profile & Notes */}
        {showContactInfo && (
          <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tanish ma’lumotlari
              </h4>
              <button
                onClick={() => setShowContactInfo(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-blue-500/40 shadow-lg mb-2"
              />
              <h3 className="font-bold text-white text-sm">{contact.name}</h3>
              <p className="text-xs text-blue-400">{contact.role}</p>
              <p className="text-xs text-slate-400">{contact.city}, Rossiya</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Shaxsiy @username:</span>
                <p className="font-mono text-blue-400 font-bold mt-0.5">{contact.username}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Telefon raqam:</span>
                <p className="font-mono text-slate-200 mt-0.5">{contact.phone}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Vaqt mintaqasi:</span>
                <p className="text-slate-200 mt-0.5">{contact.timezoneLabel}</p>
              </div>

              {contact.notes && (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Qaydlar / Eslatmalar:</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">{contact.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={() => onStartInAppCall('video')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-98"
              >
                <Video className="w-4 h-4" />
                <span>Ilova ichida video qo‘ng‘iroq</span>
              </button>
              <button
                onClick={() => onStartInAppCall('audio')}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Ovozli qo‘ng‘iroq</span>
              </button>
              <button
                onClick={onOpenMeetModal}
                className="w-full py-1.5 px-3 rounded-lg text-slate-400 hover:text-slate-200 text-[11px] flex items-center justify-center gap-1"
              >
                <span>Google Meet linkini yaratish</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Express Phrases Drawer */}
      {showPhrases && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tezkor iboralar & Tarjima shablonlari (Rossiya ⇄ UZB)</span>
            </div>
            <button
              onClick={() => setShowPhrases(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {QUICK_PHRASES.map((phrase) => (
              <div
                key={phrase.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors flex flex-col justify-between gap-1.5"
              >
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 px-1 py-0.2 rounded bg-blue-500/10">
                    {phrase.categoryLabel}
                  </span>
                  <p className="text-slate-200 mt-1 font-medium">{phrase.uz}</p>
                  <p className="text-slate-400 text-[11px] italic mt-0.5">{phrase.ru}</p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSelectPhrase(phrase, 'uz')}
                    className="flex-1 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium"
                  >
                    O‘zbekcha yuborish
                  </button>
                  <button
                    onClick={() => handleSelectPhrase(phrase, 'ru')}
                    className="flex-1 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium"
                  >
                    Ruscha yuborish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording && (
        <div className="bg-red-950/70 border-t border-red-500/40 px-4 py-3 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-200">
                Ovoz yozilmoqda: 0:{String(recordDuration).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-red-300 hidden sm:inline">(Mikrofon faol)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelRecording}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSendVoiceNote}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Yuborish</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {/* Quick Phrases Button */}
          <button
            onClick={() => setShowPhrases(!showPhrases)}
            className={`p-2 rounded-xl border transition-colors ${
              showPhrases
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-800'
            }`}
            title="Tezkor iboralar va tarjimalar"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Attachments dropdown / quick buttons */}
          <div className="relative group">
            <button
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Fayl yoki rasm ilova qilish"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-xl hidden group-hover:block z-20 text-xs space-y-1">
              <button
                onClick={() => handleAttachSamplePhoto('patent')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>📄</span>
                <span>Patent kvitansiyasi</span>
              </button>
              <button
                onClick={() => handleAttachSamplePhoto('moscow')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>🏙️</span>
                <span>Shahar manzarasi</span>
              </button>
              <button
                onClick={() => handleAttachSamplePhoto('ticket')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span>✈️</span>
                <span>Aviachipta reysi</span>
              </button>
            </div>
          </div>

          {/* Direct Google Meet Link Injector */}
          <button
            onClick={onOpenMeetModal}
            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Google Meet taklif havolasini yuborish"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing (o‘zbekcha yoki ruscha)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Voice record toggle */}
          <button
            onClick={isRecording ? handleSendVoiceNote : handleStartRecording}
            className={`p-2.5 rounded-xl border transition-colors ${
              isRecording
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isRecording ? 'Ovozni yuborish' : 'Ovozli xabar yozish'}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-xl font-semibold transition-all ${
              inputText.trim()
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img
              src={activePhotoModal}
              alt="Kattalashtirilgan rasm"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

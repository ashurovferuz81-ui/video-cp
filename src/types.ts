export type OnlineStatus = 'online' | 'away' | 'offline';

export interface Contact {
  id: string;
  name: string;
  username: string; // e.g. "@jasur_moskva", "@rustam_spb"
  avatar: string;
  city: string; // e.g. "Moskva", "Sankt-Peterburg", "Novosibirsk"
  country: string;
  timezone: string; // e.g. "Europe/Moscow" (UTC+3), "Asia/Novosibirsk" (UTC+7)
  timezoneLabel: string; // "UTC+3 (Moskva)"
  role: string; // e.g. "Qurilish brigadiri", "IT dasturchi", "Talaba"
  phone: string;
  status: OnlineStatus;
  lastSeen: string;
  unreadCount: number;
  isPinned?: boolean;
  notes?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  username: string; // e.g. "@hayotov", "@sardorbek"
  city?: string;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or contact.id
  senderName: string;
  text: string;
  timestamp: string; // HH:MM or date string
  status: 'sent' | 'delivered' | 'read';
  imageUrl?: string;
  audioDuration?: number; // seconds
  audioUrl?: string; // base64 or blob URL of recorded voice
  isAudio?: boolean;
  isMeetInvite?: boolean;
  meetUri?: string;
  meetCode?: string;
  translatedText?: string;
  targetLang?: 'uz' | 'ru';
  isStarred?: boolean;
}

export interface PhraseTemplate {
  id: string;
  category: 'salom' | 'ish' | 'hujjat' | 'pul' | 'muloqot' | 'shoshilinch';
  categoryLabel: string;
  uz: string;
  ru: string;
}

export interface CityClock {
  name: string;
  country: string;
  timezone: string;
  utcOffset: number; // e.g. +3, +5, +7
  temp: number;
  condition: string;
  icon: 'sun' | 'moon' | 'cloud' | 'snow' | 'rain';
}

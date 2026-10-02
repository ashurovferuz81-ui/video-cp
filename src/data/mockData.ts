import { Contact, Message, PhraseTemplate, CityClock } from '../types';

// Empty by default - only real registered users from Firestore and real contacts added by user
export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const QUICK_PHRASES: PhraseTemplate[] = [
  {
    id: 'p1',
    category: 'salom',
    categoryLabel: 'Salomlashish',
    uz: 'Assalomu alaykum! Ishlaringiz, sog‘liklaringiz yaxshimi?',
    ru: 'Здравствуйте! Как ваши дела и здоровье?',
  },
  {
    id: 'p2',
    category: 'salom',
    categoryLabel: 'Salomlashish',
    uz: 'Xayrli kun! Qachon qo‘ng‘iroq qilsam bo‘ladi?',
    ru: 'Добрый день! В какое время удобно созвониться?',
  },
  {
    id: 'p3',
    category: 'muloqot',
    categoryLabel: 'Video & Qo‘ng‘iroq',
    uz: 'Ilova orqali video aloqada gaplashsak bo‘ladimi?',
    ru: 'Можем созвониться по видеосвязи через приложение?',
  },
  {
    id: 'p4',
    category: 'muloqot',
    categoryLabel: 'Video & Qo‘ng‘iroq',
    uz: 'Hozir bandmisiz yoki gaplashishga vaqtingiz bormi?',
    ru: 'Вы сейчас заняты или есть время поговорить?',
  },
  {
    id: 'p5',
    category: 'hujjat',
    categoryLabel: 'Patent & Hujjatlar',
    uz: 'Patent to‘lovi kvitansiyasini qayerdan yuklab olsam bo‘ladi?',
    ru: 'Где можно скачать квитанцию об оплате патента?',
  },
  {
    id: 'p6',
    category: 'hujjat',
    categoryLabel: 'Patent & Hujjatlar',
    uz: 'Pasport tarjimasi va ro‘yxatdan o‘tish (registratsiya) hujjatlarim tayyor.',
    ru: 'Перевод паспорта и регистрация готовы.',
  },
  {
    id: 'p7',
    category: 'pul',
    categoryLabel: 'Pul o‘tkazmalari',
    uz: 'Kartaga pul o‘tkazdim, iltimos hisobingizni tekshirib ko‘ring.',
    ru: 'Я перевел деньги на карту, пожалуйста, проверьте баланс.',
  },
  {
    id: 'p8',
    category: 'pul',
    categoryLabel: 'Pul o‘tkazmalari',
    uz: 'Bugungi rubl va so‘m kursi qanday bo‘lyapti?',
    ru: 'Какой сегодня курс рубля к узбекскому суму?',
  },
  {
    id: 'p9',
    category: 'ish',
    categoryLabel: 'Ish va Transport',
    uz: 'Aeroport / Vokzalda kutib ola olasizmi yoki taksida boraymi?',
    ru: 'Сможете встретить в аэропорту / на вокзале или доехать на такси?',
  },
  {
    id: 'p10',
    category: 'ish',
    categoryLabel: 'Ish va Transport',
    uz: 'Ish joyining aniq manzilini va metro bekatini yuborib yuboring.',
    ru: 'Отправьте, пожалуйста, точный адрес работы и ближайшую станцию метро.',
  },
  {
    id: 'p11',
    category: 'shoshilinch',
    categoryLabel: 'Zarur yordam',
    uz: 'Menga zudlik bilan maslahat va yordamingiz kerak, iltimos javob bering.',
    ru: 'Мне срочно нужна ваша консультация и помощь, пожалуйста, ответьте.',
  },
];

export const CITY_CLOCKS: CityClock[] = [
  {
    name: 'Toshkent',
    country: 'O‘zbekiston',
    timezone: 'Asia/Tashkent',
    utcOffset: 5,
    temp: 22,
    condition: 'Quyoshli, ochiq havo',
    icon: 'sun',
  },
  {
    name: 'Moskva',
    country: 'Rossiya',
    timezone: 'Europe/Moscow',
    utcOffset: 3,
    temp: 11,
    condition: 'Bulutli, salqin',
    icon: 'cloud',
  },
  {
    name: 'Sankt-Peterburg',
    country: 'Rossiya',
    timezone: 'Europe/Moscow',
    utcOffset: 3,
    temp: 9,
    condition: 'Yengil yomg‘ir',
    icon: 'rain',
  },
  {
    name: 'Novosibirsk',
    country: 'Rossiya (Sibir)',
    timezone: 'Asia/Novosibirsk',
    utcOffset: 7,
    temp: 5,
    condition: 'Salqin, ochiq',
    icon: 'cloud',
  },
  {
    name: 'Yekaterinburg',
    country: 'Rossiya (Ural)',
    timezone: 'Asia/Yekaterinburg',
    utcOffset: 5,
    temp: 8,
    condition: 'O‘zgaruvchan',
    icon: 'sun',
  },
];

export const EMERGENCY_CONTACTS = [
  {
    title: 'O‘zbekiston Respublikasining Moskvadagi Elchixonasi',
    address: 'Moskva sh., Pogorelskiy ko‘chasi, 12',
    phone: '+7 (499) 230-00-76',
    hotline: '+7 (499) 230-00-78',
    type: 'Elchixona',
  },
  {
    title: 'Bosh Konsullik (Sankt-Peterburg)',
    address: 'Sankt-Peterburg sh., 4-Krasnoarmeyskaya ko‘chasi, 4A',
    phone: '+7 (812) 601-06-28',
    hotline: '+7 (961) 805-40-77',
    type: 'Konsullik',
  },
  {
    title: 'Tashqi mehnat migratsiyasi agentligi Rossiya vakolatxonasi',
    address: 'Moskva sh., 1-Kazachiy ko‘chasi, 11/2',
    phone: '+7 (903) 169-71-97',
    hotline: '+7 (926) 978-58-65',
    type: 'Migratsiya yordami',
  },
  {
    title: 'Yagona favqulodda qutqaruv xizmati (Rossiya bo‘ylab)',
    address: 'Barcha mobil operatorlardan bepul',
    phone: '112',
    hotline: '112',
    type: 'Favqulodda tez yordam',
  },
];

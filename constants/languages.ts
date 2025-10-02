

export interface Language {
  code: string;
  name: string;
  flag: string;
  countryCode: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', countryCode: 'gb' },
  { code: 'es', name: 'Español', flag: '🇪🇸', countryCode: 'es' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', countryCode: 'cn' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', countryCode: 'in' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', countryCode: 'sa' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', countryCode: 'bd' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', countryCode: 'br' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', countryCode: 'ru' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', countryCode: 'jp' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', countryCode: 'de' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', countryCode: 'fr' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', countryCode: 'pk' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', countryCode: 'id' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', countryCode: 'tr' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', countryCode: 'vn' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', countryCode: 'kr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', countryCode: 'it' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', countryCode: 'ir' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', countryCode: 'pl' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', countryCode: 'nl' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', countryCode: 'th' },
];
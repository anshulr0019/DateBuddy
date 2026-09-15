export const MAX_VOICE_SECONDS = 120;
// Below Vercel's request limit, including multipart overhead.
export const MAX_VOICE_BYTES = 3 * 1024 * 1024;
export const MIN_VOICE_SECONDS = 0.6;
export const VOICE_MIME_TYPES = ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/mpeg'];

export function voiceMimeType(type: string): string {
  return type.split(';')[0].trim().toLowerCase();
}

export function voiceExtension(type: string): string {
  return ({ 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3' })[voiceMimeType(type)] || 'webm';
}

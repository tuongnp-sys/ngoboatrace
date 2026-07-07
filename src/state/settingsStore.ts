import { drumAudio } from '@/services/audio/DrumAudioService';

const SOUND_KEY = 'ngoboatrace_sound';

export function loadSoundPreference(): boolean {
  const enabled = readSoundEnabled();
  drumAudio.setEnabled(enabled);
  return enabled;
}

export function isSoundEnabled(): boolean {
  return readSoundEnabled();
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
  drumAudio.setEnabled(enabled);
}

function readSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

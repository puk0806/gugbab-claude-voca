/**
 * Web Speech API React 훅.
 *
 * - voice 비동기 로딩(voiceschanged 이벤트) 대응
 * - 새 utterance 전 cancel() 강제 — iOS Safari 백그라운드 대응
 * - speaking 상태 관리
 *
 * 아키텍처 §6 기반.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSpeechSynthesisSupported } from './support';
import { listVoices, pickEnglishVoice } from './voices';

export interface UseSpeakOptions {
  readonly lang?: string;
  readonly rate?: number;
  readonly voiceURI?: string | null;
}

export interface UseSpeakReturn {
  readonly speak: (text: string) => void;
  readonly stop: () => void;
  readonly speaking: boolean;
  readonly voices: readonly SpeechSynthesisVoice[];
  readonly supported: boolean;
  readonly ready: boolean;
}

const DEFAULT_LANG = 'en-US';

export function useSpeak(opts: UseSpeakOptions = {}): UseSpeakReturn {
  const supported = isSpeechSynthesisSupported();
  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>(() => listVoices());
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    if (!supported) return;

    function handle(): void {
      setVoices(listVoices());
    }

    handle();
    window.speechSynthesis.addEventListener('voiceschanged', handle);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handle);
    };
  }, [supported]);

  const voice = useMemo(
    () => pickEnglishVoice(voices, opts.voiceURI ?? null),
    [voices, opts.voiceURI],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = opts.lang ?? DEFAULT_LANG;
      utterance.rate = opts.rate ?? 1.0;
      if (voice) utterance.voice = voice;

      utterance.addEventListener('end', () => {
        speakingRef.current = false;
        setSpeaking(false);
      });
      utterance.addEventListener('error', () => {
        speakingRef.current = false;
        setSpeaking(false);
      });

      speakingRef.current = true;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported, voice, opts.lang, opts.rate],
  );

  useEffect(() => {
    return () => {
      if (supported && speakingRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return {
    speak,
    stop,
    speaking,
    voices,
    supported,
    ready: voices.length > 0,
  };
}

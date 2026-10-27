import { useCallback, useMemo, useRef } from "react";
import { AUDIO_ASSETS } from "@/config/birthday";
const AUDIO_URLS = {
    bgMusic: "https://www.orangefreesounds.com/wp-content/uploads/2016/08/Happy-birthday-instrumental.mp3",
    typeClick: "https://www.soundjay.com/communication/sounds/typing-on-computer-keyboard-01.mp3",
    whoosh: "https://cdn.pixabay.com/audio/2022/03/24/audio_1c5e3e06.mp3",
    reveal: "https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3",
    pop: "https://cdn.pixabay.com/audio/2022/03/15/audio_c8c836a148.mp3",
    boom: "https://cdn.pixabay.com/audio/2022/03/10/audio_783d4a0231.mp3",
};
type SoundEffectType = "typeClick" | "whoosh" | "reveal" | "pop" | "boom";

const MAX_POOL_SIZE = 3;
const TYPE_CLICK_MIN_INTERVAL_MS = 45;

class AudioManager {
    private bgMusic: HTMLAudioElement | null = null;
    private started = false;
    private muted = false;
    private fadeInterval: ReturnType<typeof setInterval> | null = null;
    private effectPools: Partial<Record<SoundEffectType, HTMLAudioElement[]>> = {};
    private poolCursors: Partial<Record<SoundEffectType, number>> = {};
    private lastTypeClickTime = 0;
    private fallbackContext: AudioContext | null = null;
    private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    private fallbackPlaying = false;

    pauseMusic() {
        this.started = false;
        this.bgMusic?.pause();
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
        this.fallbackPlaying = false;
        if (this.fallbackContext?.state === "running") void this.fallbackContext.suspend();
    }

    start() {
        if (this.started) {
            if (this.bgMusic?.paused) {
                this.bgMusic.play().catch(() => {
                    console.debug("Birthday music is waiting for a user interaction.");
                });
            }
            return;
        }
        this.started = true;
        this.playBgMusic();
    }
    private playBgMusic() {
        try {
            this.bgMusic = new Audio(AUDIO_URLS.bgMusic);
            this.bgMusic.loop = true;
            this.bgMusic.preload = "auto";
            this.bgMusic.volume = this.muted ? 0 : 1.0;
            this.bgMusic.onerror = () => this.startFallbackBirthdayTune();
            this.bgMusic.play().catch(() => {
                // The audio file may be blocked or unavailable. Use a built-in tune
                // so the birthday page still has music without relying on another host.
                this.startFallbackBirthdayTune();
            });
        }
        catch (e) {
            console.debug("Birthday music failed; starting built-in tune:", e);
            this.startFallbackBirthdayTune();
        }
    }

    private startFallbackBirthdayTune() {
        if (this.muted || this.fallbackPlaying) return;
        try {
            const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;
            if (!this.fallbackContext) this.fallbackContext = new AudioContextClass();
            const ctx = this.fallbackContext;
            if (ctx.state === "suspended") void ctx.resume();

            this.fallbackPlaying = true;
            // Traditional "Happy Birthday" melody, synthesized locally as a fallback.
            const notes: Array<[number, number]> = [
                [392, .28], [392, .16], [440, .44], [392, .44], [523.25, .44], [493.88, .8],
                [392, .28], [392, .16], [440, .44], [392, .44], [587.33, .44], [523.25, .8],
                [392, .28], [392, .16], [783.99, .44], [659.25, .44], [523.25, .44], [493.88, .44], [440, .8],
                [698.46, .28], [698.46, .16], [659.25, .44], [523.25, .44], [587.33, .44], [523.25, .9],
            ];
            let at = ctx.currentTime + .05;
            for (const [frequency, duration] of notes) {
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();
                oscillator.type = "triangle";
                oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(0.0001, at);
                gain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.85, at + .025);
                gain.gain.setValueAtTime(this.muted ? 0 : 0.85, at + Math.max(.03, duration - .04));
                gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
                oscillator.connect(gain);
                gain.connect(ctx.destination);
                oscillator.start(at);
                oscillator.stop(at + duration);
                at += duration + .035;
            }
            this.fallbackTimer = setTimeout(() => {
                this.fallbackPlaying = false;
                if (this.started && !this.muted) this.startFallbackBirthdayTune();
            }, Math.max(100, (at - ctx.currentTime) * 1000));
        } catch (e) {
            this.fallbackPlaying = false;
            console.debug("Built-in birthday tune could not start:", e);
        }
    }
    fadeOutBgMusic(duration = 2000) {
        if (!this.bgMusic)
            return;
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = this.bgMusic.volume / steps;
        let step = 0;
        this.fadeInterval = setInterval(() => {
            if (this.bgMusic && step < steps) {
                this.bgMusic.volume = Math.max(0, this.bgMusic.volume - volumeStep);
                step++;
            }
            else {
                if (this.fadeInterval) {
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                }
                this.bgMusic?.pause();
            }
        }, stepTime);
    }
    setBgVolume(vol: number) {
        const clamped = Math.max(0, Math.min(1, vol));
        if (clamped === 0) this.muted = true;
        if (this.bgMusic && !this.muted)
            this.bgMusic.volume = clamped;
    }
    setMuted(muted: boolean) {
        this.muted = muted;
        if (this.bgMusic) {
            this.bgMusic.volume = muted ? 0 : 1.0;
        }
    }
    playEffect(type: SoundEffectType, volume = 0.4) {
        if (this.muted || AUDIO_ASSETS.soundEffectsEnabled === false)
            return;
        if (type === "typeClick") {
            const now = typeof performance !== "undefined" ? performance.now() : Date.now();
            if (now - this.lastTypeClickTime < TYPE_CLICK_MIN_INTERVAL_MS) {
                return;
            }
            this.lastTypeClickTime = now;
        }
        try {
            let pool = this.effectPools[type];
            if (!pool) {
                pool = [];
                this.effectPools[type] = pool;
            }
            let audio: HTMLAudioElement;
            if (pool.length < MAX_POOL_SIZE) {
                audio = new Audio(AUDIO_URLS[type]);
                audio.preload = "auto";
                pool.push(audio);
            } else {
                const cursor = (this.poolCursors[type] ?? 0) % MAX_POOL_SIZE;
                this.poolCursors[type] = cursor + 1;
                audio = pool[cursor];
                try {
                    audio.currentTime = 0;
                } catch {
                    // Ignore currentTime reset errors if audio metadata is not yet loaded
                }
            }
            audio.volume = volume;
            audio.play().catch(() => { });
        }
        catch (e) {
            console.debug("Audio effect playback failed:", e);
        }
    }
    stop() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        this.bgMusic?.pause();
        this.bgMusic = null;
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
        this.fallbackPlaying = false;
        this.started = false;
    }
}
const globalAudioManager = new AudioManager();
export const useSoundManager = () => {
    const managerRef = useRef(globalAudioManager);
    const startMusic = useCallback(() => {
        managerRef.current.start();
    }, []);
    const playType = useCallback(() => {
        managerRef.current.playEffect("typeClick", 0.15);
    }, []);
    const playWhoosh = useCallback(() => {
        managerRef.current.playEffect("whoosh", 0.3);
    }, []);
    const playReveal = useCallback(() => {
        managerRef.current.playEffect("reveal", 0.5);
    }, []);
    const playPop = useCallback(() => {
        managerRef.current.playEffect("pop", 0.4);
    }, []);
    const playBoom = useCallback(() => {
        managerRef.current.playEffect("boom", 0.6);
    }, []);
    const fadeOut = useCallback((duration?: number) => {
        managerRef.current.fadeOutBgMusic(duration);
    }, []);
    const setBgVolume = useCallback((vol: number) => {
        managerRef.current.setBgVolume(vol);
    }, []);
    const setMuted = useCallback((muted: boolean) => {
        managerRef.current.setMuted(muted);
    }, []);
    const pauseMusic = useCallback(() => {
        managerRef.current.pauseMusic();
    }, []);
    return useMemo(() => ({
        startMusic,
        playType,
        playWhoosh,
        playReveal,
        playPop,
        playBoom,
        fadeOut,
        setBgVolume,
        setMuted,
        pauseMusic,
    }), [startMusic, playType, playWhoosh, playReveal, playPop, playBoom, fadeOut, setBgVolume, setMuted, pauseMusic]);
};

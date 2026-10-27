import { useState, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { useSoundManager } from "./SoundManager";
import { useTranslation } from "@/i18n";

export const SoundToggle = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const { startMusic, pauseMusic, setMuted } = useSoundManager();
    const { isFrench, isBengali, isHindi } = useTranslation();

    const handlePlaybackToggle = useCallback(() => {
        if (isPlaying) {
            pauseMusic();
            setIsPlaying(false);
        } else {
            startMusic();
            setIsPlaying(true);
        }
    }, [isPlaying, pauseMusic, startMusic]);

    const handleMuteToggle = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            setMuted(next);
            return next;
        });
    }, [setMuted]);

    const playbackLabel = isPlaying
        ? isFrench ? "Mettre la musique en pause" : isBengali ? "গান থামান" : isHindi ? "संगीत रोकें" : "Pause music"
        : isFrench ? "Reprendre la musique" : isBengali ? "গান চালু করুন" : isHindi ? "संगीत चलाएँ" : "Play music";

    const muteLabel = isMuted
        ? isFrench ? "Activer le son" : isBengali ? "শব্দ চালু করুন" : isHindi ? "आवाज़ चालू करें" : "Unmute audio"
        : isFrench ? "Couper le son" : isBengali ? "শব্দ বন্ধ করুন" : isHindi ? "आवाज़ बंद करें" : "Mute audio";

    const buttonClass = "flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-xl backdrop-blur-xl transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <div className="fixed bottom-6 left-6 z-[90] flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1.5 shadow-2xl backdrop-blur-xl">
            <motion.button
                type="button"
                aria-label={playbackLabel}
                aria-pressed={isPlaying}
                title={playbackLabel}
                onClick={handlePlaybackToggle}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={buttonClass}
            >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </motion.button>
            <motion.button
                type="button"
                aria-label={muteLabel}
                aria-pressed={isMuted}
                title={muteLabel}
                onClick={handleMuteToggle}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={buttonClass}
            >
                {isMuted ? <VolumeX size={18} className="text-white/60" /> : <Volume2 size={18} className="text-primary" />}
            </motion.button>
        </div>
    );
};

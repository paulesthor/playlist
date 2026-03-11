import { motion } from 'framer-motion';
import { loginWithSpotify } from '../lib/auth';

export default function LoginScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-spotify-black px-6">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-spotify-green/8 via-transparent to-transparent pointer-events-none" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center relative z-10"
            >
                {/* Logo */}
                <motion.div
                    className="mb-8"
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                >
                    <div className="w-24 h-24 bg-spotify-green rounded-full flex items-center justify-center shadow-lg shadow-spotify-green/25">
                        <svg viewBox="0 0 24 24" className="w-12 h-12 text-black" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    className="text-4xl font-extrabold text-white mb-2 tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Spotiflow
                </motion.h1>

                <motion.p
                    className="text-spotify-grey text-base mb-10 text-center max-w-xs leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Swipe through your liked songs and sort them into playlists — effortlessly.
                </motion.p>

                {/* Login button */}
                <motion.button
                    onClick={loginWithSpotify}
                    className="flex items-center gap-3 px-8 py-4 bg-spotify-green hover:bg-spotify-green-dark text-black font-bold text-lg rounded-full transition-colors active:scale-95 shadow-lg shadow-spotify-green/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Log in with Spotify
                </motion.button>
            </motion.div>

            {/* Footer */}
            <motion.p
                className="absolute bottom-8 text-spotify-dim text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.8 }}
            >
                Your data stays on your device
            </motion.p>
        </div>
    );
}

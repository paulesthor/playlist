import { motion } from 'framer-motion';

export default function LoadingScreen({ progress }) {
    const percentage = progress.total > 0
        ? Math.round((progress.loaded / progress.total) * 100)
        : 0;

    return (
        <div className="flex flex-col items-center justify-center h-full bg-spotify-black">
            {/* Animated logo */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="w-16 h-16 relative">
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-spotify-green/20"
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-spotify-green"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white text-xl font-bold mb-2"
            >
                Loading your library
            </motion.h2>

            {progress.total > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 mt-4 w-64"
                >
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-spotify-card rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-spotify-green rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <p className="text-spotify-grey text-sm">
                        {progress.loaded} / {progress.total} songs
                    </p>
                </motion.div>
            )}
        </div>
    );
}

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const SWIPE_THRESHOLD = 120;
const ROTATION_FACTOR = 15;

export default function SwipeCard({ song, onSwipeRight, onSwipeLeft, isTop, style }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-ROTATION_FACTOR, 0, ROTATION_FACTOR]);
    const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

    // Overlay indicators
    const likeOpacity = useTransform(x, [0, 80, 150], [0, 0.6, 1]);
    const nopeOpacity = useTransform(x, [-150, -80, 0], [1, 0.6, 0]);

    const handleDragEnd = (_, info) => {
        const swipeX = info.offset.x;
        const velocity = info.velocity.x;

        if (swipeX > SWIPE_THRESHOLD || velocity > 500) {
            animate(x, 500, { duration: 0.3 });
            setTimeout(() => onSwipeRight(), 200);
        } else if (swipeX < -SWIPE_THRESHOLD || velocity < -500) {
            animate(x, -500, { duration: 0.3 });
            setTimeout(() => onSwipeLeft(), 200);
        } else {
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        }
    };

    // Programmatic swipe (from buttons)
    const triggerSwipe = (direction) => {
        const target = direction === 'right' ? 500 : -500;
        animate(x, target, { duration: 0.35, ease: 'easeIn' });
        setTimeout(() => {
            direction === 'right' ? onSwipeRight() : onSwipeLeft();
        }, 250);
    };

    // Expose to parent
    if (isTop) {
        SwipeCard._triggerSwipe = triggerSwipe;
    }

    return (
        <motion.div
            className="card-stack-item flex items-center justify-center"
            style={{ x, rotate, opacity, ...style, zIndex: isTop ? 10 : 1, touchAction: 'none' }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={isTop ? handleDragEnd : undefined}
        >
            <div className="relative w-[min(85vw,360px)] aspect-[3/4.2] rounded-3xl overflow-hidden shadow-2xl bg-spotify-card select-none">
                {/* Album art */}
                <img
                    src={song.image || song.imageMed}
                    alt={song.album}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* LIKE stamp */}
                <motion.div
                    className="absolute top-8 left-6 border-4 border-spotify-green px-4 py-1 rounded-lg rotate-[-15deg]"
                    style={{ opacity: likeOpacity }}
                >
                    <span className="text-spotify-green text-3xl font-extrabold tracking-wider">LIKE</span>
                </motion.div>

                {/* NOPE stamp */}
                <motion.div
                    className="absolute top-8 right-6 border-4 border-red-500 px-4 py-1 rounded-lg rotate-[15deg]"
                    style={{ opacity: nopeOpacity }}
                >
                    <span className="text-red-500 text-3xl font-extrabold tracking-wider">NOPE</span>
                </motion.div>

                {/* Song info */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-white text-2xl font-extrabold leading-tight mb-1 text-shadow-md line-clamp-2">
                        {song.name}
                    </h2>
                    <p className="text-spotify-grey text-base font-medium text-shadow-sm line-clamp-1">
                        {song.artist}
                    </p>
                    <p className="text-spotify-dim text-sm mt-1 text-shadow-sm line-clamp-1">
                        {song.album}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

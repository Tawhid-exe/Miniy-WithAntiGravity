import { motion } from 'framer-motion';

function BackgroundBlobs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 50, 0],
                    y: [0, 30, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                    x: [0, -30, 0],
                    y: [0, 50, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 60, 0],
                    y: [0, -40, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/20 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70"
            />
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    rotate: [0, 180, 0]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-1/4 right-10 w-72 h-72 bg-indigo-500/20 dark:bg-cyan-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60"
            />
        </div>
    );
}

export default BackgroundBlobs;

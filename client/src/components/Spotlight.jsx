import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionTemplate } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function Spotlight() {
    const { isDarkMode } = useTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Use spring physics for smooth following like Windows 11
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const mouseX = useSpring(0, springConfig);
    const mouseY = useSpring(0, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Update spring values directly
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    // Dynamic background gradient based on theme
    // Dark mode: White/Blue-ish cool glow
    // Light mode: Purple/Primary warm glow
    const gradient = useMotionTemplate`radial-gradient(
        200px circle at ${mouseX}px ${mouseY}px,
        ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 58, 237, 0.15)'},
        transparent 80%
    )`;

    return (
        <motion.div
            className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
            style={{ background: gradient }}
        />
    );
}

import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionTemplate } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function Spotlight() {
    const { isDarkMode } = useTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Use spring physics for smooth following like Windows 11
    // Updated: Much tighter/faster response based on feedback
    const springConfig = { damping: 28, stiffness: 300, mass: 0.2 };
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
    // Dark mode: White/Blue-ish cool glow - High opacity + Overlay blend to "reveal" elements
    // Light mode: Purple/Primary warm glow
    const gradient = useMotionTemplate`radial-gradient(
        120px circle at ${mouseX}px ${mouseY}px,
        ${isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(124, 58, 237, 0.3)'},
        transparent 80%
    )`;

    return (
        <motion.div
            className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
            style={{
                background: gradient,
                mixBlendMode: isDarkMode ? 'overlay' : 'normal'
            }}
        />
    );
}

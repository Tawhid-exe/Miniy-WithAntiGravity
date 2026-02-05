import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Spotlight() {
    const spotlightRef = useRef(null);

    useEffect(() => {
        const updateSpotlight = (e) => {
            if (spotlightRef.current) {
                // Directly update the DOM for zero latency (bypassing React state)
                spotlightRef.current.style.opacity = '1';
                spotlightRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
        };

        const hideSpotlight = () => {
            if (spotlightRef.current) {
                spotlightRef.current.style.opacity = '0';
            }
        };

        window.addEventListener('mousemove', updateSpotlight);
        window.addEventListener('mouseout', hideSpotlight);
        // Also handle scrolling to keep it relative if needed, but for fixed position it's fine.

        return () => {
            window.removeEventListener('mousemove', updateSpotlight);
            window.removeEventListener('mouseout', hideSpotlight);
        };
    }, []);

    const { theme } = useTheme();

    // Visual Spotlight Element
    return (
        <div
            ref={spotlightRef}
            className="fixed top-0 left-0 w-[200px] h-[200px] pointer-events-none z-[9999] transition-opacity duration-300"
            style={{
                background: theme === 'dark'
                    ? `radial-gradient(circle at center, rgba(124, 58, 237, 0.35), rgba(124, 58, 237, 0.15) 50%, transparent 70%)`
                    : `radial-gradient(circle at center, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.05) 50%, transparent 70%)`, // Much softer for light mode (~30%)
                marginLeft: '-100px', // Center the generic spotlight div
                marginTop: '-100px',
                opacity: 0, // Hidden until moved
                mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' // Screen for dark, Multiply/Darken for light to show up
            }}
        />
    );
}

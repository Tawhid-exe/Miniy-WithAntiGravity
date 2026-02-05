import { useEffect, useRef } from 'react';

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

    // Visual Spotlight Element
    return (
        <div
            ref={spotlightRef}
            className="fixed top-0 left-0 w-[200px] h-[200px] pointer-events-none z-[9999] transition-opacity duration-300"
            style={{
                background: `radial-gradient(circle at center, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.05) 50%, transparent 70%)`,
                marginLeft: '-100px', // Center the generic spotlight div
                marginTop: '-100px',
                opacity: 0, // Hidden until moved
                mixBlendMode: 'screen' // Ensures it looks glowy on dark/light
            }}
        />
    );
}

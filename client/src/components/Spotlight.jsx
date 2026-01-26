import { useEffect } from 'react';
import { useSpring } from 'framer-motion';

export default function Spotlight() {
    // Use spring physics for smooth following like Windows 11
    const springConfig = { damping: 28, stiffness: 300, mass: 0.2 };
    const mouseX = useSpring(0, springConfig);
    const mouseY = useSpring(0, springConfig);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    useEffect(() => {
        // Sync spring values to CSS variables for strict element-bound masking
        const unsubscribeX = mouseX.on("change", (x) => {
            document.documentElement.style.setProperty("--mouse-x", `${x}px`);
        });
        const unsubscribeY = mouseY.on("change", (y) => {
            document.documentElement.style.setProperty("--mouse-y", `${y}px`);
        });

        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [mouseX, mouseY]);

    // No visual render - this component just drives the physics engine
    return null;
}

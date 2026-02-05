import { motion } from 'framer-motion';

const Loader = ({ size = 40, className = "" }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <motion.div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    border: '3px solid rgba(147, 51, 234, 0.1)', // purple-600 with low opacity
                    borderTopColor: '#9333ea', // purple-600
                }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    ease: "linear",
                    repeat: Infinity
                }}
            />
        </div>
    );
};

export default Loader;

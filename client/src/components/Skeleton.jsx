import { motion } from 'framer-motion';

const Skeleton = ({ className, height, width, variant = "rect" }) => {
    const baseClasses = "bg-gray-200 dark:bg-gray-700 overflow-hidden relative";
    const rounded = variant === "circle" ? "rounded-full" : "rounded-md";

    return (
        <div
            className={`${baseClasses} ${rounded} ${className}`}
            style={{ height, width }}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-600/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear"
                }}
            />
        </div>
    );
};

export const ProductSkeleton = () => {
    return (
        <div className="glass-card rounded-2xl overflow-hidden h-full">
            {/* Image Placeholder */}
            <Skeleton height="256px" className="w-full" />

            <div className="p-6 space-y-4">
                {/* Category */}
                <Skeleton height="16px" width="40%" />

                {/* Title */}
                <Skeleton height="24px" width="80%" />

                {/* Description */}
                <div className="space-y-2">
                    <Skeleton height="14px" width="100%" />
                    <Skeleton height="14px" width="90%" />
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between pt-2">
                    <Skeleton height="32px" width="30%" />
                    <Skeleton height="48px" width="48px" variant="circle" />
                </div>
            </div>
        </div>
    );
};

export default Skeleton;

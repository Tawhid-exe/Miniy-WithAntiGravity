import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, Shield, Truck } from 'lucide-react';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark overflow-hidden transition-colors duration-300">
            <section className="relative flex items-center justify-center min-h-screen">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-light-primary/10 dark:bg-primary/20 rounded-full mix-blend-screen filter blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/3 right-1/4 w-96 h-96 bg-light-secondary/10 dark:bg-secondary/20 rounded-full mix-blend-screen filter blur-3xl"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], x: [0, 50, 0], y: [0, 30, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-light-accent/10 dark:bg-primary/15 rounded-full mix-blend-screen filter blur-3xl"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="glass p-12 rounded-3xl z-10 max-w-2xl w-full mx-4"
                >
                    <motion.div variants={container} initial="hidden" animate="show">
                        <motion.h1 variants={item} className="text-6xl font-bold mb-6 text-gradient">
                            Future E-Commerce
                        </motion.h1>
                        <motion.p variants={item} className="text-light-text-muted dark:text-slate-300 text-xl mb-8">
                            Experience the next generation of shopping with stunning animations and seamless interactions.
                        </motion.p>
                        <motion.button
                            variants={item}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/products')}
                            style={{ color: '#ffffff' }}
                            className="bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary px-10 py-5 rounded-full text-lg font-semibold shadow-lg flex items-center gap-3 mx-auto !text-white"
                        >
                            <ShoppingBag size={24} style={{ color: '#ffffff' }} />
                            <span style={{ color: '#ffffff' }}>Shop Now</span>
                        </motion.button>
                    </motion.div>
                </motion.div>
            </section>

            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-bold text-center mb-16 text-gradient">Why Shop With Us</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Zap, title: "Lightning Fast", description: "Instant product loading and smooth transitions" },
                            { icon: Shield, title: "Secure Payments", description: "Your data is protected with enterprise-grade security" },
                            { icon: Truck, title: "Free Shipping", description: "Free delivery on orders over $50" }
                        ].map((feature) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -10 }}
                                className="glass-card p-8 rounded-2xl text-center group cursor-pointer"
                            >
                                <feature.icon className="mx-auto mb-4 text-light-primary dark:text-primary" size={56} />
                                <h3 className="text-2xl font-semibold mb-3 text-light-text dark:text-light">{feature.title}</h3>
                                <p className="text-light-text-muted dark:text-slate-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, Zap, Shield, Truck, Sparkles, ArrowRight } from 'lucide-react';


const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

import PageTransition from '../components/PageTransition';
import FeaturedProducts from '../components/FeaturedProducts';

function Home() {
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <PageTransition>
            <Helmet>
                <title>Minivy — Cute Aesthetic Bags & Accessories in Bangladesh</title>
                <meta name="description" content="Shop imported Korean aesthetic bags, accessories & lifestyle products in Bangladesh. Cash on delivery. Free shipping over ৳2,000." />
                <link rel="canonical" href="https://minivy.vercel.app/" />
            </Helmet>
            <div className="min-h-screen overflow-hidden transition-colors duration-300">
                <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
                    <div className="container mx-auto z-10 grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="text-center lg:text-left"
                        >
                            <motion.div variants={item} className="mb-6 inline-block">
                                <span className="glass px-4 py-2 rounded-full text-light-primary dark:text-primary font-semibold text-sm flex items-center gap-2">
                                    <Sparkles size={16} />
                                    New Collection 2024
                                </span>
                            </motion.div>
                            <motion.h1 variants={item} className="text-6xl md:text-8xl font-bold mb-6 text-gradient leading-tight tracking-tight">
                                Elegant Treasures <br /> & Gadgets
                            </motion.h1>
                            <motion.p variants={item} className="text-light-text-muted dark:text-slate-400 text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
                                Discover a curated collection of premium electronics, fashion, and lifestyle products designed to elevate your everyday life.
                            </motion.p>
                            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/products')}
                                    style={{ color: '#ffffff' }}
                                    className="bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary px-8 py-4 rounded-full text-lg font-semibold shadow-lg flex items-center justify-center gap-2 !text-white"
                                >
                                    <ShoppingBag size={20} style={{ color: '#ffffff' }} />
                                    Shop Now
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="glass px-8 py-4 rounded-full text-lg font-semibold text-light-text dark:text-light flex items-center justify-center gap-2"
                                >
                                    Learn More
                                </motion.button>
                            </motion.div>
                        </motion.div>

                        {/* Hero Cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative h-[500px] hidden lg:block"
                        >

                            {/* Decorative Elements around cards */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 right-10 w-24 h-24 border-2 border-dashed border-light-primary/30 dark:border-primary/30 rounded-full"
                            />
                        </motion.div>
                    </div>
                </section>

                <FeaturedProducts />

                <section className="py-20 px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold text-center mb-10 md:mb-16 text-gradient">Why Shop With Us</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: Zap, title: "Curated Collection", description: "Handpicked aesthetic products imported directly from Korea" },
                                { icon: Shield, title: "Cash on Delivery", description: "Pay when your order arrives — available across all of Bangladesh" },
                                { icon: Truck, title: "Free Shipping", description: "Free delivery on orders over ৳2,000 all across BD" }
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
        </PageTransition>
    );
}

export default Home;

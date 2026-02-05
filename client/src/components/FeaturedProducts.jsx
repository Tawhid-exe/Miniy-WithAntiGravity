import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import api from '../api/axios';

const FeaturedProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch random or top rated products. For now, just getting 5 random ones.
                const { data } = await api.get('/products?limit=5');
                // Since our API currently paginates to 8, we can just take the first 5 or randomize
                if (data.products) {
                    setProducts(data.products.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to load featured products");
            }
        };
        fetchFeatured();
    }, []);

    const nextSlide = () => {
        setActiveIndex((prev) => (prev + 1) % products.length);
    };

    const prevSlide = () => {
        setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
    };

    if (products.length === 0) return null;

    return (
        <section className="py-20 px-4 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Featured Collection</h2>
                    <p className="text-gray-500 dark:text-gray-400">Handpicked premium items just for you</p>
                </motion.div>

                <div className="relative h-[400px] md:h-[500px] flex items-center justify-centerperspective-1000">
                    <AnimatePresence mode="popLayout">
                        {products.map((product, index) => {
                            // Calculate position relative to active index
                            let offset = (index - activeIndex + products.length) % products.length;
                            if (offset > products.length / 2) offset -= products.length;

                            // Only show 3 items: center, left, right
                            if (Math.abs(offset) > 1) return null;

                            return (
                                <motion.div
                                    key={product._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, x: offset * 100 }}
                                    animate={{
                                        opacity: Math.abs(offset) === 0 ? 1 : 0.6,
                                        scale: Math.abs(offset) === 0 ? 1 : 0.85,
                                        x: offset * (window.innerWidth > 768 ? 350 : 280), // Distance between cards
                                        zIndex: Math.abs(offset) === 0 ? 10 : 5,
                                        rotateY: offset * -15 // 3D rotation effect
                                    }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    onClick={() => offset === 0 && navigate(`/product/${product._id}`)}
                                    className={`absolute w-72 md:w-96 rounded-3xl glass-card overflow-hidden cursor-pointer shadow-2xl ${offset === 0 ? 'border-2 border-purple-500/30' : ''}`}
                                >
                                    <div className="h-48 md:h-64 relative bg-gray-100 dark:bg-slate-800">
                                        <img
                                            src={product.images?.[0]?.url || "https://placeholder.com/img.jpg"}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                            {product.ratings || 4.5}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                                ${product.price}
                                            </span>
                                            <button className="px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Controls */}
                    <button onClick={prevSlide} className="absolute left-4 md:left-20 z-20 p-3 rounded-full glass hover:bg-white/10 transition-colors">
                        <ChevronLeft size={24} className="text-gray-800 dark:text-white" />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 md:right-20 z-20 p-3 rounded-full glass hover:bg-white/10 transition-colors">
                        <ChevronRight size={24} className="text-gray-800 dark:text-white" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;

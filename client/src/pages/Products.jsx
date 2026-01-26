import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Sparkles } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { ProductSkeleton } from '../components/Skeleton';

// Module-level variable to track if products have been loaded in this session
let hasVisited = false;

function Products() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [addedItems, setAddedItems] = useState(new Set());
    const [loading, setLoading] = useState(!hasVisited);

    useEffect(() => {
        if (loading) {
            // Simulate loading delay for skeleton demo
            const timer = setTimeout(() => {
                setLoading(false);
                hasVisited = true;
            }, 650);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    const categories = ['All', ...new Set(products.map(p => p.category))];
    const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        addToCart(product);
        setAddedItems(prev => new Set([...prev, product.id]));
        setTimeout(() => {
            setAddedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }, 1500);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-light-bg dark:bg-dark py-12 px-4 overflow-hidden transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
                        <h1 className="text-6xl font-bold mb-4 text-gradient">Our Products</h1>
                        <p className="text-light-text-muted dark:text-slate-400 text-lg flex items-center justify-center gap-2">
                            <Sparkles className="text-light-primary dark:text-primary" size={20} />
                            Discover amazing products with incredible prices
                        </p>
                    </motion.div>

                    <div className="flex flex-wrap gap-3 justify-center mb-12">
                        {categories.map((category) => (
                            <motion.button
                                key={category}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedCategory(category)}
                                style={selectedCategory === category ? { color: '#ffffff' } : {}}
                                className={`px-6 py-3 rounded-full transition-all font-semibold ${selectedCategory === category
                                    ? 'bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary shadow-lg !text-white'
                                    : 'glass text-light-text dark:text-slate-300 border-2 border-light-primary/50 dark:border-transparent'
                                    }`}
                            >
                                {category}
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${selectedCategory}-${loading ? 'loading' : 'loaded'}`}
                            layout
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {loading ? (
                                // Skeleton Loading State
                                [...Array(8)].map((_, index) => (
                                    <motion.div
                                        key={`skeleton-${index}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full"
                                    >
                                        <ProductSkeleton />
                                    </motion.div>
                                ))
                            ) : (
                                // Actual Products
                                filteredProducts.map((product, index) => {
                                    const isAdded = addedItems.has(product.id);
                                    return (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: 0,
                                                transition: {
                                                    duration: 0.15,
                                                    delay: index * 0.03,
                                                    ease: [0.25, 0.4, 0.25, 1]
                                                }
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.8,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileHover={{ y: -8 }}
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full"
                                        >
                                            <div className="relative h-48 md:h-64 overflow-hidden bg-gray-100 dark:bg-slate-800">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-light-text dark:text-white pointer-events-none">
                                                    {product.category}
                                                </div>
                                            </div>
                                            <div className="p-4 md:p-6 flex-1 flex flex-col">
                                                <h3 className="text-lg md:text-xl font-semibold text-light-text dark:text-light mb-1 md:mb-2 line-clamp-1">{product.name}</h3>
                                                <p className="text-light-text-muted dark:text-slate-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 flex-grow">{product.description}</p>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="text-xl md:text-2xl font-bold text-gradient">${product.price}</span>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                        style={{ color: '#ffffff' }}
                                                        className={`p-2 md:p-3 rounded-full transition-all ${isAdded ? 'bg-green-600 text-white' : 'bg-light-primary dark:bg-primary text-white hover:shadow-lg'
                                                            }`}
                                                    >
                                                        <ShoppingCart size={18} className="md:w-5 md:h-5" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </PageTransition>
    );
}

export default Products;

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchProductsWithStock } from '../services/sheets';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Star, Tag } from 'lucide-react';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    }),
    hover: { y: -10, transition: { duration: 0.3 } }
};

function FeaturedProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [addedItems, setAddedItems] = useState(new Set());

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch all and pick top 4 interesting ones
                const all = await fetchProductsWithStock();
                const active = all.filter(p => p.active);
                // Prefer items on sale, then items in stock
                const sorted = active.sort((a, b) => {
                    if (a.isOnSale && !b.isOnSale) return -1;
                    if (!a.isOnSale && b.isOnSale) return 1;
                    if (a.inStock && !b.inStock) return -1;
                    if (!a.inStock && b.inStock) return 1;
                    return 0; // Just keep order
                });
                setProducts(sorted.slice(0, 4));
            } catch (error) {
                console.error("Failed to load featured products:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        if(!product.inStock) return;
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

    if (loading) {
        return (
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="h-10 w-64 bg-gray-200 dark:bg-slate-800 rounded mx-auto mb-4 animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200 dark:bg-slate-800 rounded mx-auto animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-96 rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16 relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-light-primary/10 dark:bg-primary/20 text-light-primary dark:text-primary mb-4"
                    >
                        <Star size={16} className="fill-current" />
                        <span className="font-bold text-sm tracking-widest uppercase">Featured List</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-light-text dark:text-light mb-4 text-gradient">
                        Trending Now
                    </h2>
                    <p className="text-light-text-muted dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        Discover our most popular products handpicked just for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product, i) => {
                        const isAdded = addedItems.has(product.id);
                        return (
                            <motion.div
                                key={product.id}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                whileHover="hover"
                                variants={cardVariants}
                                viewport={{ once: true, margin: "-50px" }}
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full border border-gray-100 dark:border-white/10 hover:border-light-primary dark:hover:border-primary/50 transition-colors"
                            >
                                <div className="relative h-64 overflow-hidden bg-gray-50 dark:bg-slate-800">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <motion.img
                                        src={product.images?.[0] || 'https://placehold.co/400x300/1a1a2e/c9a853?text=Miniy'}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    
                                     {!product.inStock && (
                                        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg text-sm tracking-wider">OUT OF STOCK</span>
                                        </div>
                                    )}

                                    {product.isOnSale && (
                                        <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                            <Tag size={10} /> SALE
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-light-text dark:text-light shadow-lg">
                                        {product.category}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col relative z-20 bg-white/50 dark:bg-black/20">
                                    <h3 className="text-xl font-bold text-light-text dark:text-light mb-2 line-clamp-1 group-hover:text-light-primary dark:group-hover:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-light-text-muted dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div>
                                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary">
                                                {fmt(product.effectivePrice)}
                                            </span>
                                            {product.isOnSale && (
                                                <span className="ml-2 text-sm text-gray-400 line-through">{fmt(product.price)}</span>
                                            )}
                                        </div>
                                        <motion.button
                                            disabled={!product.inStock}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => handleAddToCart(e, product)}
                                            className={`p-3 rounded-full transition-all shadow-lg ${
                                                !product.inStock ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                                                : isAdded ? 'bg-green-500 text-white shadow-green-500/30'
                                                : 'bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary text-white hover:shadow-primary/50'
                                            }`}
                                        >
                                            <ShoppingCart size={18} />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-center mt-16"
                >
                    <button
                        onClick={() => navigate('/products')}
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary border border-transparent rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        View All Products
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

export default FeaturedProducts;

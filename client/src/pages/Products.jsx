import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import { fetchProductsWithStock, fetchWishlist, addToWishlist, removeFromWishlist } from '../services/supabase-api';
import { ShoppingCart, Sparkles, Search, Filter, X, Tag, Heart } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { ProductSkeleton } from '../components/Skeleton';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

function Products() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();
    const { customer } = useCustomer();

    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addedItems, setAddedItems] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [priceMax, setPriceMax] = useState('');
    const [showInStock, setShowInStock] = useState(false);
    const [wishlist, setWishlist] = useState(new Set());

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await fetchProductsWithStock();
                setAllProducts(data);
            } catch (e) {
                setError('Could not load products: ' + e.message);
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (customer?.id) {
            fetchWishlist(customer.id).then(items => setWishlist(new Set(items))).catch(console.error);
        } else {
            setWishlist(new Set());
        }
    }, [customer?.id]);

    // Dynamic categories from actual product data
    const categories = useMemo(() =>
        [...new Set(allProducts.map(p => p.category).filter(Boolean))],
        [allProducts]
    );

    // Client-side filtering
    const filtered = useMemo(() => {
        const q = keyword.toLowerCase();
        return allProducts.filter(p => {
            if (q && !`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q)) return false;
            if (category && p.category !== category) return false;
            if (priceMax && p.effectivePrice > parseFloat(priceMax)) return false;
            if (showInStock && !p.inStock) return false;
            return true;
        });
    }, [allProducts, keyword, category, priceMax, showInStock]);

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        if (!product.inStock) return;
        addToCart(product);
        setAddedItems(prev => new Set([...prev, product.id]));
        setTimeout(() => {
            setAddedItems(prev => { const s = new Set(prev); s.delete(product.id); return s; });
        }, 1500);
    };

    const toggleWishlist = async (e, productId) => {
        e.stopPropagation();
        if (!customer?.id) {
            navigate('/auth');
            return;
        }
        
        const isWished = wishlist.has(productId);
        // Optimistic UI update
        setWishlist(prev => {
            const next = new Set(prev);
            isWished ? next.delete(productId) : next.add(productId);
            return next;
        });

        try {
            if (isWished) {
                await removeFromWishlist(customer.id, productId);
            } else {
                await addToWishlist(customer.id, productId);
            }
        } catch (err) {
            console.error('Wishlist error:', err);
            // Revert on error
            setWishlist(prev => {
                const next = new Set(prev);
                isWished ? next.add(productId) : next.delete(productId);
                return next;
            });
        }
    };

    const clearFilters = () => {
        setKeyword(''); setCategory(''); setPriceMax(''); setShowInStock(false);
    };
    const activeFilters = [keyword, category, priceMax, showInStock].filter(Boolean).length;

    return (
        <PageTransition>
            <Helmet>
                <title>Shop Aesthetic Bags & Accessories | Minivy Bangladesh</title>
                <meta name="description" content="Browse our full collection of imported Korean aesthetic bags, accessories & lifestyle products. Cash on delivery across Bangladesh. Free shipping over ৳2,000." />
                <link rel="canonical" href="https://minivy.vercel.app/products" />
            </Helmet>
            <div className="min-h-screen py-8 px-4 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    {/* Header & Search */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold text-gradient">Our Products</h1>
                            <p className="text-light-text-muted dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
                                <Sparkles className="text-light-primary dark:text-primary" size={16} />
                                {loading ? 'Loading...' : `${filtered.length} items`}
                            </p>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-full glass border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white text-sm"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`relative p-2.5 rounded-full glass border transition-all ${showFilters ? 'border-purple-500 text-purple-500' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-white'}`}
                            >
                                <Filter size={20} />
                                {activeFilters > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                                        {activeFilters}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mb-6"
                            >
                                <div className="glass-card p-5 rounded-2xl">
                                    <div className="flex flex-wrap gap-6 items-end">
                                        {/* Categories */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Category</p>
                                            <div className="flex flex-wrap gap-2">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setCategory(cat === category ? '' : cat)}
                                                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                            category === cat
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Max Price */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Max Price</p>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-gray-400 text-sm">৳</span>
                                                <input
                                                    type="number"
                                                    value={priceMax}
                                                    onChange={e => setPriceMax(e.target.value)}
                                                    placeholder="Any"
                                                    className="w-28 pl-7 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>

                                        {/* In stock toggle */}
                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <div
                                                    onClick={() => setShowInStock(!showInStock)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors ${showInStock ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showInStock ? 'translate-x-5' : ''}`} />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-slate-300">In stock only</span>
                                            </label>
                                        </div>

                                        {activeFilters > 0 && (
                                            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 ml-auto">
                                                <X size={14} /> Clear all
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error */}
                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-400">{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-2 text-purple-500 hover:underline text-sm">Retry</button>
                        </div>
                    )}

                    {/* Product Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => <div key={i} className="h-96"><ProductSkeleton /></div>)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-5xl mb-4">◇</div>
                            <h2 className="text-2xl font-bold text-gray-400 mb-2">No products found</h2>
                            <button onClick={clearFilters} className="text-purple-500 hover:underline text-sm">Clear filters</button>
                        </div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((product, i) => {
                                    const isAdded = addedItems.has(product.id);
                                    const isWished = wishlist.has(product.id);
                                    return (
                                        <motion.div
                                            key={product.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.04 } }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            whileHover={{ y: -5 }}
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col"
                                        >
                                            {/* Image */}
                                            <div className="relative h-60 overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0">
                                                <img
                                                    src={product.images?.[0] || 'https://placehold.co/400x300/1a1a2e/c9a853?text=Miniy'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                {/* Out of stock overlay */}
                                                {!product.inStock && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg text-sm tracking-wider">OUT OF STOCK</span>
                                                    </div>
                                                )}
                                                {/* Sale badge */}
                                                {product.isOnSale && (
                                                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Tag size={10} /> SALE
                                                    </div>
                                                )}
                                                {/* Category pill */}
                                                <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-800 dark:text-white">
                                                    {product.category}
                                                </div>
                                                
                                                {/* Wishlist Button */}
                                                <button 
                                                    onClick={(e) => toggleWishlist(e, product.id)}
                                                    className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <Heart size={18} className={isWished ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-200'} />
                                                </button>
                                            </div>

                                            {/* Info */}
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{product.name}</h3>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2 flex-grow">{product.description}</p>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <div>
                                                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                                            {fmt(product.effectivePrice)}
                                                        </span>
                                                        {product.isOnSale && (
                                                            <span className="ml-1.5 text-xs text-gray-400 line-through">{fmt(product.price)}</span>
                                                        )}
                                                    </div>
                                                    <motion.button
                                                        disabled={!product.inStock}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={e => handleAddToCart(e, product)}
                                                        className={`p-2.5 rounded-full transition-all shadow-lg ${
                                                            !product.inStock ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                                                            : isAdded ? 'bg-green-600 text-white shadow-green-500/30'
                                                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30'
                                                        }`}
                                                    >
                                                        <ShoppingCart size={16} />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}

export default Products;

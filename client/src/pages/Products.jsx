import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Sparkles, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { ProductSkeleton } from '../components/Skeleton';

function Products() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();

    // State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsCount, setProductsCount] = useState(0);
    const [resultPerPage, setResultPerPage] = useState(8);
    const [filteredProductsCount, setFilteredProductsCount] = useState(0);
    const [addedItems, setAddedItems] = useState(new Set());

    // Filters State
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [price, setPrice] = useState([0, 25000]);
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [showFilters, setShowFilters] = useState(false);

    // Categories (Dynamic or Static for now)
    const categories = [
        "Laptop",
        "Headphones",
        "Camera",
        "Smartphones",
        "Accessories",
        "Watch"
    ];

    useEffect(() => {
        fetchProducts();
    }, [keyword, currentPage, price, category]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let link = `/products?keyword=${keyword}&page=${currentPage}&price[gte]=${price[0]}&price[lte]=${price[1]}`;

            if (category) {
                link += `&category=${category}`;
            }

            const { data } = await api.get(link);

            setProducts(data.products);
            setProductsCount(data.productsCount);
            setResultPerPage(data.resultPerPage);
            setFilteredProductsCount(data.filteredProductsCount);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products", error);
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        // Clean URL params if needed, but fetch handles logic
    };

    const handleCategoryChange = (cat) => {
        setCategory(cat === category ? '' : cat);
        setCurrentPage(1);
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        addToCart(product);
        setAddedItems(prev => new Set([...prev, product._id]));
        setTimeout(() => {
            setAddedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(product._id);
                return newSet;
            });
        }, 1500);
    };

    return (
        <PageTransition>
            <div className="min-h-screen py-8 px-4 overflow-hidden transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    {/* Header & Search */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold text-gradient">Our Products</h1>
                            <p className="text-light-text-muted dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
                                <Sparkles className="text-light-primary dark:text-primary" size={16} />
                                Discover amazing tech
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full glass border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        </form>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden p-2 rounded-full glass border border-gray-200 dark:border-gray-700"
                        >
                            <Filter size={24} className="text-gray-700 dark:text-white" />
                        </button>
                    </div>

                    <div className="flex gap-8 items-start">
                        {/* Filters Sidebar (Desktop) */}
                        <aside className={`w-full md:w-64 glass-card p-6 rounded-xl space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Price Range</h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={price[0]}
                                        onChange={(e) => setPrice([Number(e.target.value), price[1]])}
                                        className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border text-sm dark:text-white"
                                        placeholder="Min"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        value={price[1]}
                                        onChange={(e) => setPrice([price[0], Number(e.target.value)])}
                                        className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border text-sm dark:text-white"
                                        placeholder="Max"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Categories</h3>
                                <div className="flex flex-col gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => handleCategoryChange(cat)}
                                            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === cat
                                                    ? 'bg-purple-600 text-white'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                    {category && (
                                        <button
                                            onClick={() => setCategory('')}
                                            className="text-xs text-red-500 hover:underline mt-2 text-left px-3"
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[...Array(6)].map((_, i) => <div key={i} className="h-96"><ProductSkeleton /></div>)}
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="text-center py-20">
                                        <h2 className="text-2xl font-bold text-gray-400">No products found</h2>
                                        <button onClick={() => { setKeyword(''); setCategory(''); setPrice([0, 25000]) }} className="mt-4 text-purple-500 hover:underline">Clear Filters</button>
                                    </div>
                                ) : (
                                    <motion.div
                                        layout
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        {products.map((product) => {
                                            const isAdded = addedItems.has(product._id);
                                            return (
                                                <motion.div
                                                    key={product._id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ y: -5 }}
                                                    onClick={() => navigate(`/product/${product._id}`)}
                                                    className="glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col h-full"
                                                >
                                                    <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-slate-800">
                                                        <img
                                                            src={product.images?.[0]?.url || "https://placeholder.com/img.jpg"}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                        {product.stock <= 0 && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <span className="text-white font-bold px-4 py-2 border-2 border-white rounded">OUT OF STOCK</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-800 dark:text-white">
                                                            {product.category}
                                                        </div>
                                                    </div>

                                                    <div className="p-5 flex-1 flex flex-col">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{product.name}</h3>
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>

                                                        <div className="flex items-center justify-between mt-auto">
                                                            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                                                ${product.price}
                                                            </span>
                                                            <motion.button
                                                                disabled={product.stock <= 0}
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={(e) => handleAddToCart(e, product)}
                                                                className={`p-3 rounded-full transition-all shadow-lg ${product.stock <= 0 ? 'bg-gray-400 cursor-not-allowed' :
                                                                        isAdded ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                                                                    }`}
                                                            >
                                                                <ShoppingCart size={18} />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Pagination */}
                            {resultPerPage < filteredProductsCount && (
                                <div className="flex justify-center mt-12 gap-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="p-2 rounded-full glass border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronLeft className="text-gray-600 dark:text-white" />
                                    </button>
                                    <div className="flex items-center px-4 font-bold text-gray-600 dark:text-white">
                                        Page {currentPage}
                                    </div>
                                    <button
                                        disabled={products.length < resultPerPage && filteredProductsCount <= currentPage * resultPerPage} // Rough check, api usually gives total pages
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="p-2 rounded-full glass border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronRight className="text-gray-600 dark:text-white" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default Products;

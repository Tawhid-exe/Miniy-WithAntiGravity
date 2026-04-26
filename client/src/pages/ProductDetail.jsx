import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchSingleProduct, fetchInventory } from '../services/sheets';
import { ShoppingCart, ChevronLeft, Tag, Package, ChevronRight, ChevronLeft as PrevImg, ZoomIn } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { ProductSkeleton } from '../components/Skeleton';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [added, setAdded] = useState(false);
    const [lightbox, setLightbox] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [prod, inventory] = await Promise.all([
                    fetchSingleProduct(id),
                    fetchInventory(),
                ]);
                if (!prod) { setError('Product not found'); return; }
                // Build case-insensitive inventory lookup map
                const invLower = {};
                Object.keys(inventory).forEach(k => {
                    invLower[k.toLowerCase().trim()] = inventory[k];
                });

                // Use bmsCategory first, fall back to category — both case-insensitive
                const lookupKey = (prod.bmsCategory || prod.category || '').toLowerCase().trim();
                const inv = invLower[lookupKey] || { totalRemaining: 0 };
                setProduct({ ...prod, stock: inv.totalRemaining, inStock: inv.totalRemaining > 0 });
            } catch (e) {
                setError('Could not load product.');
            } finally { setLoading(false); }
        };
        load();
    }, [id]);

    const handleAddToCart = () => {
        if (!product?.inStock) return;
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const images = product?.images?.length ? product.images : ['https://placehold.co/600x600/1a1a2e/c9a853?text=Miniy'];

    if (loading) return (
        <PageTransition>
            <div className="min-h-screen py-10 px-4 max-w-5xl mx-auto">
                <div className="h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded mb-6 animate-pulse" />
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="aspect-square rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse" />
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-5 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />)}
                    </div>
                </div>
            </div>
        </PageTransition>
    );

    if (error || !product) return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center text-center px-4">
                <div>
                    <p className="text-5xl mb-4">◇</p>
                    <h2 className="text-2xl font-bold text-gray-400 mb-4">{error || 'Product not found'}</h2>
                    <button onClick={() => navigate('/products')} className="text-purple-500 hover:underline">← Back to products</button>
                </div>
            </div>
        </PageTransition>
    );

    return (
        <PageTransition>
            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightbox(false)}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            src={images[activeImg]}
                            alt={product.name}
                            className="max-w-full max-h-full rounded-2xl object-contain"
                            onClick={e => e.stopPropagation()}
                        />
                        <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-h-screen py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Back */}
                    <button onClick={() => navigate('/products')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-purple-500 transition-colors mb-6">
                        <ChevronLeft size={16} /> Back to Products
                    </button>

                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Image Gallery */}
                        <div>
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 cursor-pointer group" onClick={() => setLightbox(true)}>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImg}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        src={images[activeImg]}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </AnimatePresence>
                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn size={16} className="text-white" />
                                </div>
                                {product.isOnSale && (
                                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Tag size={10} /> SALE
                                    </div>
                                )}
                                {!product.inStock && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg tracking-wider">OUT OF STOCK</span>
                                    </div>
                                )}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length); }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                                        ><PrevImg size={14} /></button>
                                        <button
                                            onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                                        ><ChevronRight size={14} /></button>
                                    </>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImg(i)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold">{product.category}</span>
                                {product.inStock ? (
                                    <span className="flex items-center gap-1 text-xs text-green-500 font-semibold"><Package size={12} /> In Stock ({product.stock} left)</span>
                                ) : (
                                    <span className="text-xs text-red-500 font-semibold">Out of Stock</span>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{product.name}</h1>

                            <div className="mb-5">
                                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                    {fmt(product.effectivePrice)}
                                </span>
                                {product.isOnSale && (
                                    <span className="ml-3 text-xl text-gray-400 line-through">{fmt(product.price)}</span>
                                )}
                                {product.isOnSale && product.saleEnds && (
                                    <p className="text-xs text-red-400 mt-1">
                                        Sale ends {new Date(product.saleEnds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </p>
                                )}
                            </div>

                            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-8 flex-grow">{product.description}</p>

                            <div className="flex gap-3">
                                <motion.button
                                    disabled={!product.inStock}
                                    whileHover={{ scale: product.inStock ? 1.02 : 1 }}
                                    whileTap={{ scale: product.inStock ? 0.98 : 1 }}
                                    onClick={handleAddToCart}
                                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        !product.inStock ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                                        : added ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                                    }`}
                                >
                                    <ShoppingCart size={18} />
                                    {!product.inStock ? 'Out of Stock' : added ? 'Added to Cart ✓' : 'Add to Cart'}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default ProductDetail;

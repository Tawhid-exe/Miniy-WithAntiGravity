import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { fetchSingleProduct, fetchInventory } from '../services/sheets';
import { ShoppingCart, ChevronLeft, Tag, Package, ChevronRight, ChevronLeft as PrevImg, ZoomIn, Truck, ShieldCheck, RotateCcw, ChevronDown, Zap } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { ProductSkeleton } from '../components/Skeleton';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

// Smart description renderer — parses structured text from Google Sheets into clean UI
function ProductDescription({ text }) {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const rendered = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // FAQ block — Q: ... A: ...
        if (line.startsWith('Q:') || line.startsWith('FAQ:')) {
            // Collect all FAQ lines
            const faqItems = [];
            // skip a bare 'FAQ:' header line
            if (line === 'FAQ:') { i++; continue; }
            const qa = line.replace(/^Q:/, '').split(' A: ');
            if (qa.length === 2) faqItems.push({ q: qa[0].trim(), a: qa[1].trim() });
            rendered.push(
                <div key={i} className="mt-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">FAQ</p>
                    <div className="space-y-1.5">
                        {faqItems.map((item, idx) => (
                            <div key={idx} className="text-xs">
                                <span className="font-semibold text-gray-700 dark:text-slate-200">Q: {item.q} </span>
                                <span className="text-gray-500 dark:text-slate-400">A: {item.a}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
            i++;
            continue;
        }
        // Bullet point
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            const bullets = [];
            while (i < lines.length && (lines[i].startsWith('•') || lines[i].startsWith('-') || lines[i].startsWith('*'))) {
                bullets.push(lines[i].replace(/^[•\-\*]\s*/, ''));
                i++;
            }
            rendered.push(
                <ul key={i} className="space-y-1 my-2">
                    {bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                            {b}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }
        // Spec line: Color: ... | Size: ... | Material: ...
        if (line.includes('Color:') || line.includes('Size:') || line.includes('Material:')) {
            const specs = line.split('|').map(s => s.trim()).filter(Boolean);
            rendered.push(
                <div key={i} className="flex flex-wrap gap-2 my-2">
                    {specs.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-xs text-gray-600 dark:text-slate-300 font-medium">{s}</span>
                    ))}
                </div>
            );
            i++;
            continue;
        }
        // "What makes it special:" section header
        if (line.toLowerCase().startsWith('what makes')) {
            rendered.push(
                <p key={i} className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-3 mb-1">{line.replace(':', '')}</p>
            );
            i++;
            continue;
        }
        // Hook / first line — render slightly larger
        if (i === 0) {
            rendered.push(
                <p key={i} className="text-sm font-medium text-gray-700 dark:text-slate-200 leading-relaxed mb-2">{line}</p>
            );
            i++;
            continue;
        }
        // Everything else — normal paragraph
        rendered.push(
            <p key={i} className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{line}</p>
        );
        i++;
    }
    return <div className="space-y-1">{rendered}</div>;
}

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
                // We no longer override stock with BMS inventory. 
                // prod.stock already contains the storefront allocated quantity from sheets.js
                setProduct(prod);
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

    const handleBuyNow = () => {
        if (!product?.inStock) return;
        addToCart(product);
        navigate('/checkout');
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
            {/* Dynamic SEO Meta Tags */}
            <Helmet>
                <title>{product.name} | Minivy Bangladesh</title>
                <meta name="description" content={`${product.name} — ${product.description ? product.description.slice(0, 150) : 'Imported Korean aesthetic product available in Bangladesh. Cash on delivery.'}`} />
                <link rel="canonical" href={`https://minivy.vercel.app/product/${id}`} />
                <meta property="og:title" content={`${product.name} | Minivy`} />
                <meta property="og:description" content={product.description || 'Shop this product on Minivy — imported aesthetic products delivered across Bangladesh.'} />
                <meta property="og:image" content={images[0]} />
                <meta property="og:url" content={`https://minivy.vercel.app/product/${id}`} />
                <meta property="og:type" content="product" />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": product.name,
                    "description": product.description || '',
                    "image": images[0],
                    "offers": {
                        "@type": "Offer",
                        "price": product.effectivePrice,
                        "priceCurrency": "BDT",
                        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                    }
                })}</script>
            </Helmet>
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
                <div className="max-w-6xl mx-auto">
                    {/* Back */}
                    <button onClick={() => navigate('/products')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-purple-500 transition-colors mb-6">
                        <ChevronLeft size={16} /> Back to Products
                    </button>

                    <div className="flex flex-col md:flex-row justify-center gap-16 lg:gap-24">
                        {/* Image Gallery */}
                        <div className="w-full md:w-[480px] shrink-0">
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

                        {/* Info — Clean purchase-focused column */}
                        <div className="w-full md:w-[480px] shrink-0 flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold">{product.category}</span>
                                {product.inStock ? (
                                    <span className="flex items-center gap-1 text-xs text-green-500 font-semibold"><Package size={12} /> In Stock ({product.stock} left)</span>
                                ) : (
                                    <span className="text-xs text-red-500 font-semibold">Out of Stock</span>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{product.name}</h1>

                            <div className="mb-6">
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

                            <div className="space-y-3 mb-8">
                                {/* Buy Now — above Add to Cart */}
                                <motion.button
                                    disabled={!product.inStock}
                                    whileHover={{ scale: product.inStock ? 1.02 : 1 }}
                                    whileTap={{ scale: product.inStock ? 0.98 : 1 }}
                                    onClick={handleBuyNow}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        !product.inStock ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg hover:shadow-xl'
                                    }`}
                                >
                                    <Zap size={18} />
                                    {!product.inStock ? 'Out of Stock' : 'Buy Now'}
                                </motion.button>

                                {/* Add to Cart */}
                                <motion.button
                                    disabled={!product.inStock}
                                    whileHover={{ scale: product.inStock ? 1.02 : 1 }}
                                    whileTap={{ scale: product.inStock ? 0.98 : 1 }}
                                    onClick={handleAddToCart}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        !product.inStock ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                                        : added ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                                    }`}
                                >
                                    <ShoppingCart size={18} />
                                    {!product.inStock ? 'Out of Stock' : added ? 'Added to Cart ✓' : 'Add to Cart'}
                                </motion.button>
                            </div>

                            {/* Shipping & Details Badges */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
                                    <Truck size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">Free Delivery over ৳2,000</p>
                                        <p className="text-xs text-green-600/70 dark:text-green-400/60">Cash on delivery available across all of Bangladesh</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                                    <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Quality Guaranteed</p>
                                        <p className="text-xs text-blue-600/70 dark:text-blue-400/60">Imported directly — what you see is what you get</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30">
                                    <RotateCcw size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Easy Returns</p>
                                        <p className="text-xs text-purple-600/70 dark:text-purple-400/60">Contact us within 3 days if you're not satisfied</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section — Below image, full width */}
                    {product.description && (
                        <div className="mt-12 max-w-2xl">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Package size={18} className="text-purple-500" />
                                Product Details
                            </h2>
                            <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50">
                                <ProductDescription text={product.description} />
                            </div>
                        </div>
                    )}

                    {/* FAQ Section — Below description */}
                    <div className="mt-8 max-w-2xl">
                        <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300">
                                Frequently Asked Questions
                                <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="mt-2 space-y-3 text-sm text-gray-600 dark:text-slate-400 p-3">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-slate-200">Is this good for daily use in Bangladesh?</p>
                                    <p>Yes — all our products are selected for everyday durability and comfort.</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-slate-200">How long does delivery take?</p>
                                    <p>We deliver across Bangladesh within 3–5 working days. Cash on delivery available.</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-slate-200">Is this the same quality as the photos?</p>
                                    <p>Always. Our products are imported directly — no local replicas.</p>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default ProductDetail;

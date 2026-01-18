import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

import PageTransition from '../components/PageTransition';
import { ProductSkeleton } from '../components/Skeleton';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const product = products.find(p => p.id === parseInt(id));

    if (!product) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-light-bg dark:bg-dark flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-light-text dark:text-light mb-4">Product Not Found</h1>
                        <button
                            onClick={() => navigate('/products')}
                            className="text-light-primary dark:text-primary hover:text-secondary"
                        >
                            Back to Products
                        </button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    const handleAddToCart = () => {
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-light-bg dark:bg-dark py-12 px-4 transition-colors duration-300">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/products')}
                        className="flex items-center gap-2 text-light-text-muted dark:text-slate-400 hover:text-light-primary dark:hover:text-primary mb-8 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Products
                    </motion.button>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Product Image */}
                        <motion.div
                            layoutId={`product-${product.id}`}
                            className="glass-card rounded-3xl overflow-hidden h-[500px]"
                        >
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>

                        {/* Product Details */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col justify-center"
                        >
                            <div className="text-light-primary dark:text-primary text-sm font-semibold mb-2">
                                {product.category}
                            </div>
                            <h1 className="text-5xl font-bold text-light-text dark:text-light mb-6">
                                {product.name}
                            </h1>
                            <p className="text-light-text-muted dark:text-slate-300 text-lg mb-8 leading-relaxed">
                                {product.description}
                            </p>

                            <div className="flex items-baseline gap-3 mb-8">
                                <span className="text-5xl font-bold text-gradient">
                                    ${product.price}
                                </span>
                                <span className="text-light-text-muted dark:text-slate-400">
                                    {product.stock} in stock
                                </span>
                            </div>

                            {/* Features List */}
                            <div className="mb-8 space-y-3">
                                {[
                                    'Premium quality materials',
                                    'Fast & free shipping',
                                    '30-day money-back guarantee',
                                    '24/7 customer support'
                                ].map((feature, index) => (
                                    <motion.div
                                        key={feature}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + index * 0.05 }}
                                        className="flex items-center gap-3 text-light-text dark:text-slate-300"
                                    >
                                        <div className="bg-light-primary/20 dark:bg-primary/20 p-1 rounded-full">
                                            <Check size={16} className="text-light-primary dark:text-primary" />
                                        </div>
                                        {feature}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Add to Cart Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddToCart}
                                className={`w-full py-4 rounded-full text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${added
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary !text-white hover:shadow-lg'
                                    }`}
                            >
                                {added ? (
                                    <>
                                        <Check size={24} />
                                        Added to Cart!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={24} />
                                        Add to Cart
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default ProductDetail;

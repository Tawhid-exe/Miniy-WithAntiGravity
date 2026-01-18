import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, isAuthenticated, error, clearErrors } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const { name, email, password } = formData;

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
        if (error) {
            setTimeout(() => clearErrors(), 3000);
        }
    }, [isAuthenticated, error, navigate, clearErrors]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(formData);
            }
        } catch (err) {
            // Error handled by context
        }
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-800 dark:text-white backdrop-blur-sm";

    return (
        <PageTransition>
            <div className="flex justify-center items-center min-h-[calc(100vh-80px)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-black">

                {/* Decorative Elements */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                <div className="relative w-full max-w-md mx-4">
                    <motion.div
                        layout
                        transition={{ layout: { duration: 0.3, type: "spring", stiffness: 100, damping: 20 } }}
                        className="relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8 overflow-hidden"
                    >
                        <motion.div
                            layout="position"
                            className="text-center mb-8"
                        >
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                                {isLogin ? 'Welcome Back' : 'Join Us'}
                            </h2>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {isLogin ? 'Sign in to confirm your order' : 'Start your journey with us today'}
                            </p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.form
                                key={isLogin ? "login" : "register"}
                                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                                onSubmit={onSubmit}
                            >
                                {!isLogin && (
                                    <div>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            </span>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                className={inputClasses}
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={onChange}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        </span>
                                        <input
                                            id="email-address"
                                            name="email"
                                            type="email"
                                            required
                                            className={inputClasses}
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={onChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                        </span>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className={inputClasses}
                                            placeholder="Password"
                                            value={password}
                                            onChange={onChange}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-red-50 text-red-500 text-sm text-center border border-red-100"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
                                >
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                </motion.button>
                            </motion.form>
                        </AnimatePresence>

                        <div className="mt-8 text-center">
                            <button
                                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? (
                                    <span>New here? <span className="text-purple-600 dark:text-purple-400 font-bold">Create an account</span></span>
                                ) : (
                                    <span>Already have an account? <span className="text-purple-600 dark:text-purple-400 font-bold">Sign in</span></span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
};

export default AuthPage;

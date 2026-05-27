import { useState, useEffect } from 'react';
import { useCustomer } from '../context/CustomerContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import OtpModal from '../components/OtpModal';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, sendOtpCode, verifyOtpCode, sendPasswordResetEmail } from '../services/supabase-api';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, isLoggedIn, error, clearError, loading } = useCustomer();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const redirect = searchParams.get('redirect') || '';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: ''
    });

    const { name, email, password, confirmPassword, phone, address } = formData;
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isLoggedIn) {
            navigate(redirect ? `/${redirect}` : '/');
        }
        if (error) {
            setLocalError(error);
            setTimeout(() => {
                clearError();
                setLocalError('');
            }, 3000);
        }
    }, [isLoggedIn, error, navigate, clearError, redirect]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!isLogin && password !== confirmPassword) {
            setLocalError("Passwords do not match");
            setTimeout(() => setLocalError(''), 3000);
            return;
        }

        try {
            if (isLogin) {
                await login({ email, password });
            } else {
                if (!name || !email || !password || !phone) {
                    setLocalError("Please fill required fields (Name, Email, Password, Phone)");
                    return;
                }
                await register({ name, email, password, phone, address });
            }
        } catch (err) {
            setLocalError(err.message || "Failed to authenticate");
        }
    };

    // Google OAuth handler
    const handleGoogleSignIn = async () => {
        try {
            setLocalError('');
            await signInWithGoogle();
        } catch (err) {
            setLocalError(err.message || 'Google sign-in failed');
        }
    };

    // OTP handler — send code
    const handleSendOtp = async () => {
        const targetEmail = email.trim();
        if (!targetEmail) {
            setLocalError('Please enter your email first');
            return;
        }
        setLocalError('');
        setOtpLoading(true);
        try {
            await sendOtpCode(targetEmail);
            setOtpEmail(targetEmail);
            setOtpModalOpen(true);
        } catch (err) {
            setLocalError(err.message || 'Failed to send verification code');
        } finally {
            setOtpLoading(false);
        }
    };

    // OTP handler — verify code
    const handleVerifyOtp = async (code) => {
        setOtpLoading(true);
        try {
            const result = await verifyOtpCode(otpEmail, code);
            setOtpModalOpen(false);
            // On successful OTP verification, user is authenticated via Supabase Auth
            if (result.user) {
                // Navigate to profile or redirect target
                navigate(redirect ? `/${redirect}` : '/profile');
            }
        } catch (err) {
            throw err; // Re-throw so OtpModal shows the error
        } finally {
            setOtpLoading(false);
        }
    };

    // Forgot password handler
    const handleForgotPassword = async () => {
        const targetEmail = email.trim();
        if (!targetEmail) {
            setLocalError('Please enter your email first, then click "Forgot Password"');
            return;
        }
        setLocalError('');
        try {
            await sendPasswordResetEmail(targetEmail);
            setResetSent(true);
            setTimeout(() => setResetSent(false), 5000);
        } catch (err) {
            setLocalError(err.message || 'Failed to send reset email');
        }
    };

    const inputClasses = "w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-800 dark:text-white backdrop-blur-sm";

    return (
        <PageTransition>
            <div className="flex justify-center items-center min-h-[calc(100vh-80px)] py-12">

                <div className="relative w-full max-w-md mx-4">
                    <motion.div
                        layout
                        transition={{ layout: { duration: 0.3, type: "spring", stiffness: 100, damping: 20 } }}
                        className="relative glass-card p-8 overflow-hidden rounded-3xl"
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

                        {/* Google OAuth Button */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all hover:shadow-md cursor-pointer backdrop-blur-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">or</span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                        </div>

                        <form className="space-y-5" onSubmit={onSubmit}>
                            <AnimatePresence initial={false}>
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden space-y-5"
                                    >
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            </span>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required={!isLogin}
                                                className={inputClasses}
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={onChange}
                                            />
                                        </div>

                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                            </span>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="text"
                                                required={!isLogin}
                                                className={inputClasses}
                                                placeholder="Phone (WhatsApp)"
                                                value={phone}
                                                onChange={onChange}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

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
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className={inputClasses}
                                        placeholder="Password"
                                        value={password}
                                        onChange={onChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-purple-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden space-y-5"
                                    >
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                            </span>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                required={!isLogin}
                                                className={inputClasses}
                                                placeholder="Confirm Password"
                                                value={confirmPassword}
                                                onChange={onChange}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {localError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-red-50 text-red-500 text-sm text-center border border-red-100"
                                >
                                    {localError}
                                </motion.div>
                            )}

                            {resetSent && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center border border-green-100"
                                >
                                    ✓ Reset link sent! Check your email inbox.
                                </motion.div>
                            )}

                            <motion.button
                                layout
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white transition-all cursor-pointer ${
                                    loading 
                                        ? 'bg-purple-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Please wait...
                                    </>
                                ) : (
                                    isLogin ? 'Sign In' : 'Create Account'
                                )}
                            </motion.button>
                        </form>

                        {/* OTP Login Button */}
                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading}
                            className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-medium text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            {otpLoading ? 'Sending code...' : 'Sign in with Email Code'}
                        </button>

                        {/* Forgot Password (login mode only) */}
                        {isLogin && (
                            <div className="mt-3 text-center">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                                >
                                    Forgot your password?
                                </button>
                            </div>
                        )}

                        <div className="mt-6 text-center pt-2">
                            <button
                                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                                onClick={() => { setIsLogin(!isLogin); setLocalError(''); clearError(); setResetSent(false); }}
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

            {/* OTP Verification Modal */}
            <OtpModal
                isOpen={otpModalOpen}
                onClose={() => setOtpModalOpen(false)}
                onVerify={handleVerifyOtp}
                email={otpEmail}
                loading={otpLoading}
            />
        </PageTransition>
    );
};

export default AuthPage;

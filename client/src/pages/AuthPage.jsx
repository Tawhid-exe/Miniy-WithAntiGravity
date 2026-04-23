import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Sparkles } from 'lucide-react';
import PageTransition from '../components/PageTransition';

function InputField({ icon: Icon, label, type = 'text', value, onChange, placeholder, required, extra }) {
    const [showPw, setShowPw] = useState(false);
    const isPassword = type === 'password';
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type={isPassword ? (showPw ? 'text' : 'password') : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-slate-500"
                />
                {isPassword && (
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
        </div>
    );
}

function AuthPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, register, loading, error, clearError } = useCustomer();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');

    const redirect = searchParams.get('redirect') || '';
    const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setLocalError(''); clearError(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(''); setSuccess('');
        try {
            if (mode === 'login') {
                await login({ email: form.email, password: form.password });
                navigate(redirect ? `/${redirect}` : '/');
            } else {
                if (!form.name || !form.email || !form.password || !form.phone) {
                    setLocalError('Please fill in all required fields.'); return;
                }
                await register(form);
                setSuccess('Account created! Welcome to Miniy ✦');
                setTimeout(() => navigate(redirect ? `/${redirect}` : '/'), 1200);
            }
        } catch (err) {
            setLocalError(err.message || 'Something went wrong');
        }
    };

    const switchMode = () => {
        setMode(m => m === 'login' ? 'register' : 'login');
        setLocalError(''); setSuccess(''); clearError();
    };

    const displayError = localError || error;

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4 shadow-lg shadow-purple-500/30">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-gradient">
                            {mode === 'login' ? 'Welcome back' : 'Create account'}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                            {mode === 'login' ? 'Sign in to your Miniy account' : 'Start shopping with Miniy today'}
                        </p>
                    </div>

                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-3xl p-8"
                    >
                        {/* Tabs */}
                        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
                            {['login', 'register'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => { setMode(m); setLocalError(''); setSuccess(''); clearError(); }}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                                        mode === m
                                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'
                                    }`}
                                >
                                    {m === 'login' ? 'Sign In' : 'Register'}
                                </button>
                            ))}
                        </div>

                        {/* Error/Success */}
                        <AnimatePresence mode="wait">
                            {displayError && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                                    {displayError}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'register' && (
                                <InputField icon={User} label="Full Name *" value={form.name} onChange={set('name')} placeholder="Your name" required />
                            )}
                            <InputField icon={Mail} label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
                            <InputField icon={Lock} label="Password *" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
                            {mode === 'register' && (
                                <>
                                    <InputField icon={Phone} label="Phone / WhatsApp *" value={form.phone} onChange={set('phone')} placeholder="+880 1XXX-XXXXXX" required />
                                    <InputField icon={MapPin} label="Delivery Address" value={form.address} onChange={set('address')} placeholder="Your address (optional)" />
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="text-center mt-5 text-sm text-gray-500 dark:text-slate-400">
                            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button onClick={switchMode} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                                {mode === 'login' ? 'Register' : 'Sign In'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
}

export default AuthPage;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, ArrowRight } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

function AdminLogin() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in
    if (sessionStorage.getItem('miniy_admin') === 'true') {
        navigate('/admin/products', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Incorrect password');
            sessionStorage.setItem('miniy_admin', 'true');
            navigate('/admin/products');
        } catch (err) {
            setError(err.message || 'Incorrect password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-sm w-full"
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-black mb-4 shadow-lg border border-gray-700">
                            <Shield className="text-purple-400" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Access</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Authorized personnel only</p>
                    </div>

                    <div className="glass-card rounded-3xl p-8 border border-purple-500/20 shadow-xl shadow-purple-500/5">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Master Password</label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        placeholder="••••••••"
                                        autoFocus
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs mt-2 font-medium bg-red-500/10 p-2 rounded-lg">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? 'Verifying...' : 'Access Server'} <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}

export default AdminLogin;

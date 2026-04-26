import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAddProduct, adminUpdateProduct, adminDeleteProduct, adminFetchProducts, adminFetchBmsCategories, adminFetchBmsStock } from '../../services/appsScript';
import { uploadImage } from '../../services/cloudinary';
import { Plus, Edit2, Trash2, Search, X, Save, Image as ImageIcon, Tag, Eye, EyeOff, UploadCloud, Package } from 'lucide-react';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [displayCategories, setDisplayCategories] = useState([]);
    const [bmsCategories, setBmsCategories] = useState([]);
    const [bmsStock, setBmsStock] = useState({}); // raw BMS inventory per category
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        name: '', category: '', bmsCategory: '', description: '', price: '',
        salePrice: '', saleEnds: '', imageFile: null, imageUrl: '', active: true,
        quantity: 1,
    });

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [data, bmsCats, stock] = await Promise.all([
                adminFetchProducts(),
                adminFetchBmsCategories(),
                adminFetchBmsStock(),
            ]);
            setProducts(data);
            setDisplayCategories([...new Set(data.map(p => p.category).filter(Boolean))]);
            setBmsCategories(bmsCats);
            setBmsStock(stock);
        } catch (e) {
            alert('Error loading data: ' + e.message);
        } finally { setLoading(false); }
    };

    // How much BMS stock is available for a given bmsCategory
    // = BMS raw stock MINUS quantity already allocated across all store products of same bmsCategory
    // EXCEPT when editing — exclude the product being edited from the sum
    const getAvailableStock = (bmsCat, excludeProductId = null) => {
        if (!bmsCat) return 0;
        const key = bmsCat.toLowerCase().trim();
        const rawStock = Object.entries(bmsStock).find(([k]) => k.toLowerCase().trim() === key)?.[1] ?? 0;
        const allocated = products
            .filter(p => {
                if (excludeProductId && p.id === excludeProductId) return false;
                return (p.bmsCategory || '').toLowerCase().trim() === key;
            })
            .reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        return Math.max(0, rawStock - allocated);
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setIsCustomCategory(product.category && !displayCategories.includes(product.category));
            setForm({
                name: product.name,
                category: product.category,
                bmsCategory: product.bmsCategory || '',
                description: product.description,
                price: product.price,
                salePrice: product.salePrice || '',
                saleEnds: product.saleEnds ? new Date(product.saleEnds).toISOString().split('T')[0] : '',
                imageFile: null,
                imageUrl: product.images?.[0] || '',
                active: product.active !== false,
                quantity: parseInt(product.quantity) || 0,
            });
        } else {
            setEditingProduct(null);
            setIsCustomCategory(false);
            setForm({ name: '', category: '', bmsCategory: '', description: '', price: '', salePrice: '', saleEnds: '', imageFile: null, imageUrl: '', active: true, quantity: 1 });
        }
        setShowModal(true);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files?.[0]) setForm({ ...form, imageFile: e.dataTransfer.files[0] });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.bmsCategory) { alert('BMS / Inventory Category is required.'); return; }
        setIsSaving(true);
        try {
            let finalImageUrl = form.imageUrl;
            if (form.imageFile) {
                const res = await uploadImage(form.imageFile);
                finalImageUrl = res.url;
            }
            const payload = {
                name: form.name,
                category: form.category,
                bmsCategory: form.bmsCategory,
                description: form.description,
                price: parseFloat(form.price) || 0,
                salePrice: parseFloat(form.salePrice) || 0,
                saleEnds: form.saleEnds || '',
                images: finalImageUrl,
                active: form.active,
                quantity: parseInt(form.quantity) || 0,
            };
            if (editingProduct) {
                await adminUpdateProduct(editingProduct.id, payload);
            } else {
                await adminAddProduct({ id: 'prd-' + Date.now(), ...payload });
            }
            setShowModal(false);
            loadAll();
        } catch (e) {
            alert('Failed to save: ' + e.message);
        } finally { setIsSaving(false); }
    };

    const toggleActive = async (product) => {
        try {
            setProducts(products.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
            await adminUpdateProduct(product.id, { active: !product.active });
        } catch { loadAll(); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product permanently?')) return;
        try {
            setProducts(products.filter(p => p.id !== id));
            await adminDeleteProduct(id);
        } catch { loadAll(); }
    };

    const filtered = products.filter(p =>
        (p.name + p.category).toLowerCase().includes(search.toLowerCase())
    );

    // Available stock for the currently selected bmsCategory in the form
    const availableForForm = form.bmsCategory
        ? getAvailableStock(form.bmsCategory, editingProduct?.id)
        : 0;

    // Max quantity = available + what this product already holds (when editing)
    const maxQty = editingProduct
        ? availableForForm + (parseInt(editingProduct.quantity) || 0)
        : availableForForm;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Manage your product catalog</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white" />
                    </div>
                    <button onClick={() => openModal()}
                        className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-md shadow-purple-500/20">
                        <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Qty</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-6 text-center text-gray-500">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-500">No products found</td></tr>
                            ) : filtered.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                                <img src={product.images?.[0] || 'https://placehold.co/48?text=Img'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {product.name}
                                                    {product.isOnSale && <Tag size={12} className="text-red-500" />}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{product.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white">{fmt(product.effectivePrice)}</div>
                                        {product.isOnSale && <div className="text-xs text-red-400 line-through">{fmt(product.price)}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-bold ${(parseInt(product.quantity) || 0) > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                            {parseInt(product.quantity) || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleActive(product)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${product.active
                                                ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                                : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                            {product.active ? <Eye size={12} /> : <EyeOff size={12} />}
                                            {product.active ? 'Active' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSaving && setShowModal(false)} />

                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

                            <div className="p-6 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center bg-white/30 dark:bg-slate-800/30">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                                <button onClick={() => !isSaving && setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-600 dark:text-white transition-colors"><X size={18} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form id="prodForm" onSubmit={handleSave} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">

                                        {/* Name */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Display Name *</label>
                                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none" />
                                        </div>

                                        {/* Display Category */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Display Category *</label>
                                            <select
                                                value={isCustomCategory ? '_custom_' : form.category}
                                                onChange={e => {
                                                    if (e.target.value === '_custom_') { setIsCustomCategory(true); setForm({ ...form, category: '' }); }
                                                    else { setIsCustomCategory(false); setForm({ ...form, category: e.target.value }); }
                                                }}
                                                className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none">
                                                <option value="" disabled>Select Category</option>
                                                {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                <option value="_custom_">+ Add New Category...</option>
                                            </select>
                                            {isCustomCategory && (
                                                <input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                                    placeholder="Type new display category..."
                                                    className="mt-2 w-full p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 ring-1 ring-purple-300 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none" />
                                            )}
                                        </div>

                                        {/* BMS Category */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">BMS / Inventory Category *</label>
                                            <select
                                                required
                                                value={form.bmsCategory}
                                                onChange={e => setForm({ ...form, bmsCategory: e.target.value, quantity: 1 })}
                                                className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none">
                                                <option value="" disabled>Select BMS Category</option>
                                                {bmsCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        {/* Quantity — capped at available BMS stock */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                                Stock Quantity for this Listing
                                            </label>
                                            {form.bmsCategory ? (
                                                <>
                                                    {/* Available stock info */}
                                                    <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                                        <Package size={14} className="text-purple-500 flex-shrink-0" />
                                                        <span className="text-xs text-purple-700 dark:text-purple-300">
                                                            <strong>{maxQty}</strong> units available in BMS inventory for <strong>{form.bmsCategory}</strong>
                                                            {editingProduct && ` (includes ${parseInt(editingProduct.quantity) || 0} currently on this listing)`}
                                                        </span>
                                                    </div>
                                                    {/* Quantity controls */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                                            <button type="button"
                                                                onClick={() => setForm(f => ({ ...f, quantity: Math.max(0, (parseInt(f.quantity) || 0) - 1) }))}
                                                                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 text-lg font-bold transition-colors">
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={maxQty}
                                                                value={form.quantity}
                                                                onChange={e => {
                                                                    const v = Math.min(maxQty, Math.max(0, parseInt(e.target.value) || 0));
                                                                    setForm(f => ({ ...f, quantity: v }));
                                                                }}
                                                                className="w-16 h-11 text-center bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-bold border-x border-gray-200 dark:border-slate-700 outline-none"
                                                            />
                                                            <button type="button"
                                                                onClick={() => setForm(f => ({ ...f, quantity: Math.min(maxQty, (parseInt(f.quantity) || 0) + 1) }))}
                                                                disabled={form.quantity >= maxQty}
                                                                className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 text-lg font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-slate-400">
                                                            Max: {maxQty} · This listing will show {form.quantity} available to customers
                                                        </span>
                                                    </div>
                                                    {maxQty === 0 && (
                                                        <p className="mt-2 text-xs text-red-500 font-semibold">
                                                            No BMS inventory remaining for {form.bmsCategory}. All stock is already allocated to other listings.
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-xs text-gray-400 dark:text-slate-500 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                                    Select a BMS category above to set quantity.
                                                </p>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Price (৳) *</label>
                                            <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none" />
                                        </div>

                                        {/* Sale */}
                                        <div className="sm:col-span-2 p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-900/30">
                                            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-1.5"><Tag size={14} /> Discount / Sale</h3>
                                            <div className="grid sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1.5">Sale Price (৳)</label>
                                                    <input type="number" step="0.01" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} placeholder="Leave blank if no sale"
                                                        className="w-full p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 ring-1 ring-blue-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-sm dark:text-white outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1.5">Ends On (Expiry)</label>
                                                    <input type="date" value={form.saleEnds} onChange={e => setForm({ ...form, saleEnds: e.target.value })}
                                                        className="w-full p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 ring-1 ring-blue-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-sm dark:text-white outline-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Description</label>
                                            <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                                className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm resize-none dark:text-white outline-none" />
                                        </div>

                                        {/* Image */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Product Image</label>
                                            <div onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} onDrop={handleDrop}
                                                className="flex flex-col sm:flex-row items-center gap-4 border-2 border-dashed border-gray-300 dark:border-slate-600 p-5 rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors bg-white/30 dark:bg-slate-800/30">
                                                <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
                                                    {form.imageFile ? <img src={URL.createObjectURL(form.imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                                        : form.imageUrl ? <img src={form.imageUrl} alt="Current" className="w-full h-full object-cover" />
                                                            : <ImageIcon className="text-gray-400" size={32} />}
                                                </div>
                                                <div className="flex-1 text-center sm:text-left">
                                                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                                        <UploadCloud size={18} /> Choose File
                                                        <input type="file" accept="image/*" onChange={e => setForm({ ...form, imageFile: e.target.files[0] })} className="hidden" />
                                                    </label>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">Drag and drop or click to browse.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active toggle */}
                                        <div className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white">Product Visibility</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Hidden products won't appear in the store</p>
                                            </div>
                                            <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${form.active ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 flex justify-end gap-3 backdrop-blur-md">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" form="prodForm" disabled={isSaving}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50">
                                    {isSaving ? 'Saving...' : <><Save size={16} /> Save Product</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminProducts;
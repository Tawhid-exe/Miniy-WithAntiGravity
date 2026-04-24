import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProducts, fetchInventory } from '../../services/sheets';
import { adminAddProduct, adminUpdateProduct, adminDeleteProduct } from '../../services/appsScript';
import { uploadImage } from '../../services/cloudinary';
import { Plus, Edit2, Trash2, Search, X, Save, Image as ImageIcon, Tag, Eye, EyeOff, UploadCloud } from 'lucide-react';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Categories state
    const [displayCategories, setDisplayCategories] = useState([]);
    const [bmsCategories, setBmsCategories] = useState([]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [form, setForm] = useState({
        name: '', category: '', bmsCategory: '', description: '', price: '', 
        salePrice: '', saleEnds: '', imageFile: null, imageUrl: '', active: true
    });

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await fetchProducts();
            setProducts(data);
            
            const cats = [...new Set(data.map(p => p.category).filter(Boolean))];
            setDisplayCategories(cats);

            const inv = await fetchInventory();
            const bmsCats = Object.keys(inv);
            setBmsCategories(bmsCats);
            console.log("Loaded Categories:", { display: cats, bms: bmsCats });
        } catch (e) {
            console.error(e);
        } finally { setLoading(false); }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            const bmsCat = product.bmsCategory || product.category;
            setForm({
                name: product.name,
                category: product.category,
                bmsCategory: bmsCat,
                description: product.description,
                price: product.price,
                salePrice: product.salePrice || '',
                saleEnds: product.saleEnds ? new Date(product.saleEnds).toISOString().split('T')[0] : '',
                imageFile: null,
                imageUrl: product.images?.[0] || '',
                active: product.active !== false
            });
            setIsCustomCategory(product.category && !displayCategories.includes(product.category));
        } else {
            setEditingProduct(null);
            setForm({ name: '', category: '', bmsCategory: '', description: '', price: '', salePrice: '', saleEnds: '', imageFile: null, imageUrl: '', active: true });
            setIsCustomCategory(false);
        }
        setShowModal(true);
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setForm({...form, imageFile: e.dataTransfer.files[0]});
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
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
                bmsCategory: form.bmsCategory || form.category,
                description: form.description,
                price: parseFloat(form.price) || 0,
                salePrice: parseFloat(form.salePrice) || 0,
                saleEnds: form.saleEnds || '',
                images: finalImageUrl,
                active: form.active
            };

            if (editingProduct) {
                await adminUpdateProduct(editingProduct.id, payload);
            } else {
                await adminAddProduct({ id: 'prd-' + Date.now(), ...payload });
            }

            setShowModal(false);
            loadProducts();
        } catch (e) {
            console.error("Save error:", e);
            alert('Failed to save product: ' + e.message + '\nMake sure you have added the new bmsCategory column to your Google Sheets tab if using a custom BMS Category.');
        } finally { setIsSaving(false); }
    };

    const toggleActive = async (product) => {
        try {
            setProducts(products.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
            await adminUpdateProduct(product.id, { active: !product.active });
        } catch (e) {
            alert('Failed to update status');
            loadProducts();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product permanently?')) return;
        try {
            setProducts(products.filter(p => p.id !== id));
            await adminDeleteProduct(id);
        } catch (e) {
            alert('Delete failed');
            loadProducts();
        }
    };

    const filtered = products.filter(p => 
        (p.name + p.category).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Manage your product catalog</p>
                </div>
                
                <div className="flex w-full sm:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                        />
                    </div>
                    <button 
                        onClick={() => openModal()}
                        className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-md shadow-purple-500/20"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="4" className="p-6 text-center text-gray-500">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center text-gray-500">No products found</td></tr>
                            ) : (
                                filtered.map(product => (
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
                                            <button 
                                                onClick={() => toggleActive(product)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    product.active 
                                                        ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:border-slate-700'
                                                }`}
                                            >
                                                {product.active ? <Eye size={12} /> : <EyeOff size={12} />}
                                                {product.active ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSaving && setShowModal(false)} />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/20 dark:border-slate-700/50 flex justify-between items-center bg-white/30 dark:bg-slate-800/30">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingProduct ? 'Edit Product' : 'New Product'}
                                </h2>
                                <button onClick={() => !isSaving && setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-600 dark:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                <form id="prodForm" onSubmit={handleSave} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Display Name *</label>
                                            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-none ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white" />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Display Category *</label>
                                            <div className="flex flex-col gap-2">
                                                <select 
                                                    value={isCustomCategory ? '_custom_' : form.category} 
                                                    onChange={e => {
                                                        if (e.target.value === '_custom_') {
                                                            setIsCustomCategory(true);
                                                            setForm({...form, category: ''});
                                                        } else {
                                                            setIsCustomCategory(false);
                                                            setForm({...form, category: e.target.value});
                                                        }
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-none ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none"
                                                >
                                                    <option value="" disabled>Select Category</option>
                                                    {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    <option value="_custom_">+ Add New Category...</option>
                                                </select>
                                                {isCustomCategory && (
                                                    <input required value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Type new display category..." className="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-none ring-1 ring-purple-300 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none" />
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">BMS / Inventory Category</label>
                                            <div className="flex flex-col gap-2">
                                                <select 
                                                    value={form.bmsCategory} 
                                                    onChange={e => setForm({...form, bmsCategory: e.target.value})}
                                                    className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-none ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white outline-none"
                                                >
                                                    <option value="">Same as Display Category</option>
                                                    {bmsCategories.sort((a,b) => a.localeCompare(b)).map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Price (৳) *</label>
                                            <input required type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-none ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm dark:text-white" />
                                        </div>

                                        <div className="sm:col-span-2 p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-900/30 backdrop-blur-sm">
                                            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-1.5"><Tag size={14}/> Discount / Sale</h3>
                                            <div className="grid sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1.5">Sale Price (৳)</label>
                                                    <input type="number" step="0.01" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} placeholder="Leave blank if no sale" className="w-full p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-none ring-1 ring-blue-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-sm dark:text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1.5">Ends On (Expiry)</label>
                                                    <input type="date" value={form.saleEnds} onChange={e => setForm({...form, saleEnds: e.target.value})} className="w-full p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-none ring-1 ring-blue-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-sm dark:text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Description</label>
                                            <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-none ring-1 ring-gray-200 dark:ring-slate-700 focus:ring-2 focus:ring-purple-500 text-sm resize-none dark:text-white" />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Product Image</label>
                                            <div 
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                                className="flex flex-col sm:flex-row items-center gap-4 border-2 border-dashed border-gray-300 dark:border-slate-600 p-5 rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm cursor-pointer"
                                            >
                                                <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner relative group">
                                                    {form.imageFile ? (
                                                        <img src={URL.createObjectURL(form.imageFile)} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : form.imageUrl ? (
                                                        <img src={form.imageUrl} alt="Current" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="text-gray-400" size={32} />
                                                    )}
                                                    
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <UploadCloud className="text-white" size={24} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center sm:text-left">
                                                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors shadow-sm">
                                                        <UploadCloud size={18} />
                                                        Choose File
                                                        <input type="file" accept="image/*" onChange={e => setForm({...form, imageFile: e.target.files[0]})} className="hidden" />
                                                    </label>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
                                                        <span className="font-semibold text-gray-700 dark:text-slate-300">Drag and drop</span> an image here, or click to browse.
                                                        High-quality square image recommended.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/30 flex justify-end gap-3 z-10 backdrop-blur-md">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button type="submit" form="prodForm" disabled={isSaving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50">
                                    {isSaving ? 'Saving...' : <><Save size={16}/> Save Product</>}
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

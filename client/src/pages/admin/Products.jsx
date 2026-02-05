import { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageTransition from '../../components/PageTransition';
import { Plus, Trash2, Edit, X, Upload } from 'lucide-react';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        costPrice: '',
        stock: '',
        category: '',
        description: '',
        sku: '',
        images: [] // Will store base64 strings
    });
    const [imagePreview, setImagePreview] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products'); // Public endpoint works for list
            setProducts(data.products);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products", error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        setImagePreview([]);
        setFormData({ ...formData, images: [] });

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagePreview((old) => [...old, reader.result]);
                    setFormData((old) => ({ ...old, images: [...old.images, reader.result] }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send FormData as JSON (Controller expects images array of base64)
            await api.post('/admin/product/new', formData);
            setShowModal(false);
            fetchProducts();
            // Reset Form
            setFormData({
                name: '', price: '', costPrice: '', stock: '', category: '', description: '', sku: '', images: []
            });
            setImagePreview([]);
        } catch (error) {
            alert(error.response?.data?.message || "Error creating product");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await api.delete(`/admin/product/${id}`);
                fetchProducts();
            } catch (error) {
                alert("Error deleting product");
            }
        }
    };

    if (loading) return <div className="p-10">Loading Products...</div>;

    return (
        <PageTransition>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Inventory</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Product
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost / Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {products.map((product) => (
                                <tr key={product._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <img className="h-10 w-10 rounded-full object-cover" src={product.images[0]?.url} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                <div className="text-sm text-gray-500">{product.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock < product.lowStockThreshold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        ${product.costPrice} / ${product.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-900 ml-4"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Product</h2>
                                <button onClick={() => setShowModal(false)}><X size={24} className="text-gray-500" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="name" placeholder="Product Name" onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                                    <input type="text" name="sku" placeholder="SKU (Unique)" onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="price" placeholder="Sale Price" onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                                    <input type="number" name="costPrice" placeholder="Cost Price" onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="stock" placeholder="Stock Quantity" onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                                    <input type="text" name="category" placeholder="Category" onChange={handleInputChange} className="p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                                </div>
                                <textarea name="description" placeholder="Description" rows="3" onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required></textarea>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Images</label>
                                    <div className="flex items-center space-x-2">
                                        <label className="cursor-pointer bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-300">
                                            <Upload size={20} /> Upload Images
                                            <input type="file" name="images" accept="image/*" onChange={handleImageChange} multiple className="hidden" />
                                        </label>
                                    </div>
                                    <div className="flex gap-2 mt-2 overflow-x-auto">
                                        {imagePreview.map((img, i) => (
                                            <img key={i} src={img} alt="Preview" className="h-16 w-16 object-cover rounded" />
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                                    Create Product
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default AdminProducts;

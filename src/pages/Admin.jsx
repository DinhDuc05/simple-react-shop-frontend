import { useMemo, useState } from "react";
import {
  Archive,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../data/products";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const sections = [
  { id: "products", label: "Products", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "orders", label: "Orders", icon: ClipboardList },
];

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const inputClass = "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-100";

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function Admin() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [section, setSection] = useState("products");
  const [products, setProducts] = useState(() => getProducts());
  const [users, setUsers] = useState(() => readList("users"));
  const [orders, setOrders] = useState(() => readList("orders"));
  const [search, setSearch] = useState("");
  const [productDraft, setProductDraft] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [userDraft, setUserDraft] = useState(null);
  const [editingUserEmail, setEditingUserEmail] = useState(null);
  const [notice, setNotice] = useState("");

  const filteredProducts = useMemo(
    () => products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const filteredUsers = useMemo(
    () => users.filter((user) => `${user.name || ""} ${user.email || ""}`.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  );
  const filteredOrders = useMemo(
    () => orders.filter((order) => `${order.id} ${order.customer?.name || ""} ${order.customer?.email || ""}`.toLowerCase().includes(search.toLowerCase())),
    [orders, search],
  );

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function openNewProduct() {
    setProductDraft({ name: "", description: "", price: "", discount: "0", rate: "0", category: "", image: "" });
    setEditingProductId(null);
  }

  function openEditProduct(product) {
    setProductDraft({ ...product, category: product.category.join(", ") });
    setEditingProductId(product.id);
  }

  function saveProduct(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      name: String(form.get("name")).trim(),
      description: String(form.get("description")).trim(),
      price: Number(form.get("price")),
      discount: Number(form.get("discount")),
      rate: Number(form.get("rate")),
      category: String(form.get("category")).split(",").map((item) => item.trim()).filter(Boolean),
      image: String(form.get("image")).trim(),
    };
    const updated = editingProductId === null
      ? [...products, addProduct(product)]
      : updateProduct(editingProductId, product);
    setProducts(updated);
    setProductDraft(null);
    showNotice(editingProductId === null ? "Product added" : "Product updated");
  }

  function removeProduct(productId) {
    if (!window.confirm("Delete this product?")) return;
    setProducts(deleteProduct(productId));
    showNotice("Product deleted");
  }

  function openEditUser(user) {
    setUserDraft({ name: user.name || "", email: user.email || "" });
    setEditingUserEmail(user.email);
  }

  function saveUser(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim().toLowerCase();
    if (users.some((user) => user.email !== editingUserEmail && user.email?.toLowerCase() === email)) {
      showNotice("That email is already in use");
      return;
    }
    const updatedUsers = users.map((user) => user.email === editingUserEmail ? { ...user, name, email } : user);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setUserDraft(null);
    showNotice("User updated");
  }

  function removeUser(email) {
    if (!window.confirm("Remove this user?")) return;
    const updatedUsers = users.filter((user) => user.email !== email);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    showNotice("User removed");
  }

  function updateOrderStatus(orderId, status) {
    const updatedOrders = orders.map((order) => order.id === orderId ? { ...order, status } : order);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    showNotice("Order status updated");
  }

  const counts = [products.length, users.length, orders.length];
  const activeCount = orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 dark:bg-neutral-900 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">REBEX SHOP / OPERATIONS</p>
            <h1 className="text-3xl font-bold tracking-tight">Store management</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage catalog, customer accounts, and incoming orders.</p>
          </div>
          <div className="flex gap-5 text-sm">
            <div><span className="block text-2xl font-semibold">{counts[0]}</span><span className="text-gray-500">Products</span></div>
            <div><span className="block text-2xl font-semibold">{counts[1]}</span><span className="text-gray-500">Users</span></div>
            <div><span className="block text-2xl font-semibold">{activeCount}</span><span className="text-gray-500">Open orders</span></div>
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-5 overflow-x-auto" aria-label="Admin sections">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => { setSection(id); setSearch(""); }} className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${section === id ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"}`}>
                <Icon size={17} aria-hidden="true" />{label}<span className="text-xs text-gray-400">{id === "products" ? counts[0] : id === "users" ? counts[1] : counts[2]}</span>
              </button>
            ))}
          </nav>
          <label className="relative mb-3 block sm:mb-2 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${section}...`} aria-label={`Search ${section}`} />
          </label>
        </div>

        {notice && <p role="status" className="mb-4 border-l-4 border-green-600 bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">{notice}</p>}

        {section === "products" && (
          <section aria-label="Product management">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Product catalog</h2>
              <button type="button" onClick={openNewProduct} className="inline-flex items-center gap-2 rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"><Plus size={16} />Add product</button>
            </div>
            <div className="overflow-x-auto border-y border-gray-200 dark:border-gray-800">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-gray-500"><tr><th className="py-3 pr-4">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Discount</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="py-3 pr-4"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-11 w-14 rounded object-cover" /><div><p className="font-medium">{product.name}</p><p className="max-w-sm truncate text-xs text-gray-500">{product.description}</p></div></div></td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{product.category.join(", ")}</td>
                      <td className="px-3 py-3">{formatPrice(product.price)}</td>
                      <td className="px-3 py-3">{product.discount}%</td>
                      <td className="px-3 py-3">{product.rate}/5</td>
                      <td className="px-3 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEditProduct(product)} title="Edit product" aria-label={`Edit ${product.name}`} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-neutral-800"><Pencil size={16} /></button><button type="button" onClick={() => removeProduct(product.id)} title="Delete product" aria-label={`Delete ${product.name}`} className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No products found.</p>}
            </div>
          </section>
        )}

        {section === "users" && (
          <section aria-label="User management">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Customer accounts</h2><span className="text-sm text-gray-500">{filteredUsers.length} accounts</span></div>
            <div className="overflow-x-auto border-y border-gray-200 dark:border-gray-800">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs uppercase text-gray-500"><tr><th className="py-3 pr-4">Customer</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Session</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.email}>
                      <td className="py-4 pr-4 font-medium">{user.name || "Unnamed customer"}</td>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-3 py-4"><span className={`inline-flex items-center gap-2 ${user.isAuth ? "text-green-700 dark:text-green-400" : "text-gray-500"}`}><span className={`h-2 w-2 rounded-full ${user.isAuth ? "bg-green-500" : "bg-gray-400"}`} />{user.isAuth ? "Signed in" : "Signed out"}</span></td>
                      <td className="px-3 py-3"><div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEditUser(user)} disabled={user.isAuth} title={user.isAuth ? "Cannot edit the signed-in account" : "Edit user"} aria-label={`Edit ${user.email}`} className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-neutral-800"><Pencil size={16} /></button>
                        <button type="button" onClick={() => removeUser(user.email)} disabled={user.isAuth} title={user.isAuth ? "Cannot remove the signed-in account" : "Remove user"} aria-label={`Remove ${user.email}`} className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950"><Trash2 size={16} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No customer accounts found.</p>}
            </div>
          </section>
        )}

        {section === "orders" && (
          <section aria-label="Order management">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Orders</h2><span className="text-sm text-gray-500">{filteredOrders.length} orders</span></div>
            <div className="overflow-x-auto border-y border-gray-200 dark:border-gray-800">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="text-xs uppercase text-gray-500"><tr><th className="py-3 pr-4">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}><td className="py-4 pr-4 font-mono text-xs">{order.id}</td><td className="px-3 py-4"><p className="font-medium">{order.customer?.name || "Customer"}</p><p className="text-xs text-gray-500">{order.customer?.email || ""}</p></td><td className="px-3 py-4 text-gray-600 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td><td className="px-3 py-4">{order.totalItems || order.items?.reduce((total, item) => total + item.quantity, 0) || 0}</td><td className="px-3 py-4 font-medium">{formatPrice(order.totalPrice)}</td><td className="px-3 py-4"><select value={order.status || "Pending"} onChange={(event) => updateOrderStatus(order.id, event.target.value)} className={inputClass} aria-label={`Status for ${order.id}`}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && <div className="py-14 text-center"><Archive size={28} className="mx-auto mb-3 text-gray-400" /><p className="text-sm text-gray-500">No orders yet. Completed checkouts will appear here.</p></div>}
            </div>
          </section>
        )}
      </div>

      {productDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProductDraft(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded bg-white p-6 shadow-xl dark:bg-neutral-950">
            <div className="mb-5 flex items-center justify-between"><h2 id="product-dialog-title" className="text-xl font-semibold">{editingProductId === null ? "Add product" : "Edit product"}</h2><button type="button" onClick={() => setProductDraft(null)} aria-label="Close" className="rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"><X size={18} /></button></div>
            <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Name<input required name="name" defaultValue={productDraft.name} className={`${inputClass} mt-1`} /></label>
              <label className="text-sm sm:col-span-2">Description<textarea name="description" defaultValue={productDraft.description} rows="3" className={`${inputClass} mt-1`} /></label>
              <label className="text-sm">Price<input required name="price" type="number" min="0" step="0.01" defaultValue={productDraft.price} className={`${inputClass} mt-1`} /></label>
              <label className="text-sm">Discount (%)<input name="discount" type="number" min="0" max="100" defaultValue={productDraft.discount} className={`${inputClass} mt-1`} /></label>
              <label className="text-sm">Rating<input name="rate" type="number" min="0" max="5" step="0.1" defaultValue={productDraft.rate} className={`${inputClass} mt-1`} /></label>
              <label className="text-sm">Categories<input name="category" defaultValue={productDraft.category} placeholder="electronics, audio" className={`${inputClass} mt-1`} /></label>
              <label className="text-sm sm:col-span-2">Image URL<input name="image" type="url" defaultValue={productDraft.image} className={`${inputClass} mt-1`} /></label>
              <div className="flex justify-end gap-3 pt-2 sm:col-span-2"><button type="button" onClick={() => setProductDraft(null)} className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button type="submit" className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Save product</button></div>
            </form>
          </section>
        </div>
      )}

      {userDraft && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setUserDraft(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="w-full max-w-md rounded bg-white p-6 shadow-xl dark:bg-neutral-950">
            <div className="mb-5 flex items-center justify-between"><h2 id="user-dialog-title" className="text-xl font-semibold">Edit customer</h2><button type="button" onClick={() => setUserDraft(null)} aria-label="Close" className="rounded p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"><X size={18} /></button></div>
            <form onSubmit={saveUser} className="space-y-4">
              <label className="block text-sm">Name<input required name="name" defaultValue={userDraft.name} className={`${inputClass} mt-1`} /></label>
              <label className="block text-sm">Email<input required name="email" type="email" defaultValue={userDraft.email} className={`${inputClass} mt-1`} /></label>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setUserDraft(null)} className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button type="submit" className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Save user</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Admin;

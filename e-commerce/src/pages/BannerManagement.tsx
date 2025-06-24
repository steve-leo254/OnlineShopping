import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  X,
  Image as ImageIcon,
  Eye,
} from "lucide-react";

// Banner type
interface Banner {
  id: number;
  image_url: string;
  title?: string;
  subtitle?: string;
  type?: string;
  active: boolean;
  created_at: string;
  category_id?: number | null;
  button_text?: string;
}

interface BannerForm {
  image_url: string;
  title?: string;
  subtitle?: string;
  type?: string;
  active: boolean;
  category_id?: number | null;
  button_text?: string;
}

const BannerManagement: React.FC = () => {
  const { token, role } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>({
    image_url: "",
    title: "",
    subtitle: "",
    type: "category",
    active: true,
    category_id: null,
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );

  const isAdmin = role === "admin" || role === "SUPERADMIN";

  useEffect(() => {
    if (isAdmin && token) {
      fetchBanners();
    }
    // Fetch categories for dropdown
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/public/categories`)
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
    // eslint-disable-next-line
  }, [isAdmin, token]);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/banners`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBanners(res.data);
    } catch (err) {
      toast.error("Failed to load banners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setForm({
        image_url: banner.image_url,
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        type: banner.type || "category",
        active: banner.active,
        category_id: banner.category_id,
        button_text: banner.button_text || "",
      });
    } else {
      setEditingBanner(null);
      setForm({
        image_url: "",
        title: "",
        subtitle: "",
        type: "category",
        active: true,
        category_id: null,
      });
    }
    setImageFile(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setForm({
      image_url: "",
      title: "",
      subtitle: "",
      type: "category",
      active: true,
      category_id: null,
    });
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload-image`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setForm((prev) => ({ ...prev, image_url: res.data.img_url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;
    const fieldValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) {
      toast.error("Please upload an image");
      return;
    }
    try {
      if (editingBanner) {
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/banners/${editingBanner.id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Banner updated");
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/banners`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Banner created");
      }
      handleCloseForm();
      fetchBanners();
    } catch (err) {
      toast.error("Failed to save banner");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Banner deleted");
      fetchBanners();
    } catch (err) {
      toast.error("Failed to delete banner");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/banners/${banner.id}`,
        { ...banner, active: !banner.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBanners();
    } catch (err) {
      toast.error("Failed to update banner");
    }
  };

  const handleRemoveImage = async () => {
    if (!editingBanner) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/banners/${
          editingBanner.id
        }/remove-image`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setForm((prev) => ({ ...prev, image_url: "" }));
      toast.success("Banner image removed");
    } catch (err) {
      toast.error("Failed to remove image");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Banner Management
          </h1>
          <button
            onClick={() => handleOpenForm()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" /> Add Banner
          </button>
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">
            Loading banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No banners found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Subtitle</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Button Text</th>
                  <th className="p-3 text-center">Active</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} className="border-t">
                    <td className="p-3">
                      {banner.image_url ? (
                        <img
                          src={
                            banner.image_url.startsWith("http")
                              ? banner.image_url
                              : `${import.meta.env.VITE_API_BASE_URL}${
                                  banner.image_url
                                }`
                          }
                          alt={banner.title || "Banner"}
                          className="w-24 h-16 object-cover rounded shadow"
                        />
                      ) : (
                        <span className="text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </span>
                      )}
                    </td>
                    <td className="p-3">{banner.title}</td>
                    <td className="p-3">{banner.subtitle}</td>
                    <td className="p-3">{banner.type}</td>
                    <td className="p-3">
                      {banner.category_id
                        ? categories.find((c) => c.id === banner.category_id)
                            ?.name || banner.category_id
                        : "-"}
                    </td>
                    <td className="p-3">{banner.button_text || "-"}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`px-2 py-1 rounded ${
                          banner.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                        title={banner.active ? "Deactivate" : "Activate"}
                      >
                        {banner.active ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => handleOpenForm(banner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a
                        href={
                          banner.image_url.startsWith("http")
                            ? banner.image_url
                            : `${import.meta.env.VITE_API_BASE_URL}${
                                banner.image_url
                              }`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="View Image"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingBanner ? "Edit Banner" : "Add Banner"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={!imageFile || uploading}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {form.image_url && (
                  <div className="relative w-full">
                    <img
                      src={
                        form.image_url.startsWith("http")
                          ? form.image_url
                          : `${import.meta.env.VITE_API_BASE_URL}${
                              form.image_url
                            }`
                      }
                      alt="Banner Preview"
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                    {/* Remove Image Button */}
                    {editingBanner && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                        title="Remove Image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Banner title (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Banner subtitle (optional)"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.type || "category"}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="category">Category</option>
                  <option value="homepage">Homepage</option>
                </select>
              </div>
              {form.type === "homepage" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Button Text (optional)
                  </label>
                  <input
                    type="text"
                    value={form.button_text || ""}
                    onChange={(e) =>
                      setForm({ ...form, button_text: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g. Shop Now, Save Now"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Category (optional)
                </label>
                <select
                  value={form.category_id || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- No Category (Global) --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleFormChange}
                  id="active"
                />
                <label
                  htmlFor="active"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingBanner ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;

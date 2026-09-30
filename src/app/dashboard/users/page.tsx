"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Plus,
  User,
  Shield,
  Key,
  Mail,
  ShieldAlert,
  Trash2,
  ShieldCheck,
  Check,
  Edit2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type AppUser = {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  permissions: {
    canEdit: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canViewRevenue: boolean;
  };
  createdAt: string;
};

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    permissions: {
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canManageUsers: false,
      canViewRevenue: false,
    },
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: AppUser) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      permissions: user.permissions,
    });
    setEditingUserId(user._id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Require at least one permission
    const hasPermissions = Object.values(formData.permissions).some(Boolean);
    if (!hasPermissions) {
      setPermissionError(true);
      toast.error("Please select at least one granular permission.");
      return;
    }
    setPermissionError(false);

    const loadingToast = toast.loading(editingUserId ? "Updating user..." : "Creating user...");
    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : "/api/users";
      const method = editingUserId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`User ${editingUserId ? 'updated' : 'created'} successfully!`, { id: loadingToast });
        fetchUsers();
        setIsFormOpen(false);
        setEditingUserId(null);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "STAFF",
          permissions: {
            canEdit: false,
            canCreate: false,
            canDelete: false,
            canManageUsers: false,
            canViewRevenue: false,
          },
        });
      } else {
        const data = await res.json();
        toast.error(data.error || `Failed to ${editingUserId ? 'update' : 'create'} user`, {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error("Network error occurred", { id: loadingToast });
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <ShieldAlert size={64} className="text-rose-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 max-w-md mt-2">
          Only administrators can access the User & Roles management dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-primary" /> Users & Roles
          </h1>
          <p className="text-slate-500 mt-1">
            Manage system access, roles, and granular permissions.
          </p>
        </div>
        <button
          onClick={() => {
            if (isFormOpen) {
              setEditingUserId(null);
              setFormData({
                name: "", email: "", password: "", role: "STAFF",
                permissions: { canEdit: false, canCreate: false, canDelete: false, canManageUsers: false, canViewRevenue: false }
              });
            }
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-primary text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 font-semibold hover:bg-green-700 transition-all hover:scale-105 active:scale-95"
        >
          {isFormOpen ? <X size={20} /> : <Plus size={20} />}
          {isFormOpen ? "Cancel" : "Add New User"}
        </button>
      </div>

      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="text-primary" size={24} /> {editingUserId ? "Edit Account" : "Create Account"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="text"
                  required={!editingUserId}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder={editingUserId ? "Leave blank to keep current" : "SecurePass123"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                >
                  <option value="STAFF">Staff (Basic Access)</option>
                  <option value="MANAGER">Manager (Elevated Access)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <div className={`bg-slate-50 p-5 rounded-2xl border transition-colors ${permissionError ? 'border-rose-300 bg-rose-50/50' : 'border-slate-100'}`}>
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Shield size={18} className="text-blue-500" /> Granular
                  Permissions
                </h3>
                <p className={`text-xs mt-1 ${permissionError ? 'text-rose-500 font-semibold' : 'text-slate-500'}`}>
                  You must select at least one action this user is permitted to perform.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(formData.permissions).map((key) => {
                  const permKey = key as keyof typeof formData.permissions;
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-primary/50 transition-all group"
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.permissions[permKey] ? "bg-primary" : "bg-slate-200"}`}
                      >
                        {formData.permissions[permKey] && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.permissions[permKey]}
                        onChange={(e) => {
                          setPermissionError(false);
                          setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              [permKey]: e.target.checked,
                            },
                          });
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {editingUserId ? "Update Account" : "Create Account"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="p-4 font-semibold text-slate-600">User</th>
                <th className="p-4 font-semibold text-slate-600">Role</th>
                <th className="p-4 font-semibold text-slate-600">
                  Permissions
                </th>
                <th className="p-4 font-semibold text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500 animate-pulse"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center font-bold text-primary">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "MANAGER"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(user.permissions)
                          .filter(([_, val]) => val)
                          .map(([key]) => (
                            <span
                              key={key}
                              className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold uppercase"
                            >
                              {key.replace("can", "")}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

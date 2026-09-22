import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit, Trash2, Shield, X, Save, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeToRoles, createRole, updateRole, deleteRole } from "../firebase";
import { useToast } from "../context/ToastContext";

const MODULES = [
  { id: "Dashboard", name: "Dashboard / Analytics" },
  { id: "LiveActivity", name: "Admin Panel / Live Monitoring" },
  { id: "EmployeeManagement", name: "Staff Directory" },
  { id: "LeaveApprovals", name: "Leave Approvals" },
  { id: "Regularization", name: "Regularization Approvals" },
  { id: "AttendanceLogs", name: "Attendance Logs" },
  { id: "Payroll", name: "Payroll Processing" },
  { id: "NoticeBoard", name: "Notice Board & Rules" },
  { id: "Assets", name: "Asset Management" },
  { id: "ActivityHistory", name: "Activity Log / History" },
  { id: "ProjectManagement", name: "Project Management" },
  { id: "TaskManagement", name: "Task Management" },
  { id: "TeamHub", name: "Team Hub / Chat" },
  { id: "EnvironmentSetup", name: "Environment Setup" },
  { id: "RolesPermissions", name: "Roles & Permissions" }
];

export default function RolesTab() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (!currentUser?.companyId) return;
    const unsub = subscribeToRoles(currentUser.companyId, (data) => {
      setRoles(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name || "");
      setRoleDesc(role.description || "");
      setPermissions(role.permissions || {});
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleDesc("");
      const initialPerms = {};
      MODULES.forEach(m => {
        initialPerms[m.id] = { create: false, read: true, update: false, delete: false };
      });
      setPermissions(initialPerms);
    }
    setShowModal(true);
  };

  const handleTogglePermission = (moduleId, action) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId]?.[action]
      }
    }));
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      showToast("Role name is required", "warning");
      return;
    }
    
    try {
      const roleData = {
        name: roleName,
        description: roleDesc,
        permissions: permissions
      };
      
      if (editingRole) {
        await updateRole(currentUser.companyId, editingRole.id, roleData);
        showToast("Role updated successfully", "success");
      } else {
        await createRole(currentUser.companyId, roleData);
        showToast("Role created successfully", "success");
      }
      setShowModal(false);
    } catch (err) {
      showToast(err.message || "Failed to save role", "error");
    }
  };

  const handleDeleteRole = async (role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"? Users with this role may lose access.`)) {
      try {
        await deleteRole(currentUser.companyId, role.id);
        showToast("Role deleted", "success");
      } catch (err) {
        showToast(err.message || "Failed to delete role", "error");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-text-mut">Loading roles...</div>;

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight">Roles & Permissions</h2>
          <p className="text-sm font-semibold text-text-sec mt-1">Manage custom roles and access control</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/25"
        >
          <Plus size={16} />
          Create New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Default Admins Info */}
        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-primary mb-2">
              <Shield size={20} />
              <h3 className="font-extrabold text-lg">System Admins</h3>
            </div>
            <p className="text-xs font-semibold text-text-sec leading-relaxed">
              Super Admin and System Admin roles have full, unrestricted access to all modules. They bypass custom permissions.
            </p>
          </div>
        </div>

        {roles.map(role => (
          <div key={role.id} className="bg-bg-card border border-border-card rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-brand-primary/40 transition-colors">
            <div>
              <h3 className="font-extrabold text-text-main text-lg">{role.name}</h3>
              {role.description && <p className="text-xs font-medium text-text-sec mt-1 line-clamp-2">{role.description}</p>}
              
              <div className="mt-4 pt-4 border-t border-border-card text-xs">
                <span className="text-text-mut font-bold uppercase tracking-wider text-[10px]">Access Level</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(role.permissions || {}).filter(([_, perms]) => perms.read || perms.create || perms.update || perms.delete).slice(0, 3).map(([modId]) => {
                     const modName = MODULES.find(m => m.id === modId)?.name || modId;
                     return <span key={modId} className="px-2 py-0.5 bg-bg-base rounded-md text-text-main font-semibold text-[10px]">{modName}</span>;
                  })}
                  {Object.entries(role.permissions || {}).filter(([_, perms]) => perms.read || perms.create || perms.update || perms.delete).length > 3 && (
                    <span className="px-2 py-0.5 bg-bg-base rounded-md text-text-mut font-semibold text-[10px]">+{Object.entries(role.permissions || {}).filter(([_, perms]) => perms.read || perms.create || perms.update || perms.delete).length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6 pt-4 border-t border-border-card">
              <button 
                onClick={() => handleOpenModal(role)}
                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg text-xs font-bold transition-colors"
              >
                <Edit size={12} /> Edit
              </button>
              <button 
                onClick={() => handleDeleteRole(role)}
                className="py-1.5 px-3 flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-mut border-2 border-dashed border-border-card rounded-2xl flex flex-col items-center justify-center">
            <Shield className="mb-3 opacity-20" size={32} />
            <p className="font-semibold">No custom roles created yet.</p>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-card w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-border-card flex justify-between items-center bg-bg-base/30">
              <h3 className="font-extrabold text-lg text-text-main">{editingRole ? "Edit Role" : "Create New Role"}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-base text-text-sec transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-text-mut uppercase tracking-wider mb-1.5">Role Name *</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. HR Manager"
                    className="w-full px-4 py-2.5 border border-border-card rounded-xl bg-bg-base/50 text-sm font-semibold outline-none focus:border-brand-primary focus:bg-bg-card transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-mut uppercase tracking-wider mb-1.5">Description</label>
                  <input
                    type="text"
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="Brief description of this role"
                    className="w-full px-4 py-2.5 border border-border-card rounded-xl bg-bg-base/50 text-sm font-semibold outline-none focus:border-brand-primary focus:bg-bg-card transition-all"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-text-main mb-4 flex items-center gap-2">
                  <Shield size={14} className="text-brand-primary" />
                  Module Permissions
                </h4>
                
                <div className="border border-border-card rounded-xl overflow-hidden bg-bg-base/20">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-bg-base/50">
                      <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-4 text-center">Read</th>
                        <th className="py-3 px-4 text-center">Create</th>
                        <th className="py-3 px-4 text-center">Update</th>
                        <th className="py-3 px-4 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-card text-sm font-semibold text-text-main">
                      {MODULES.map(mod => {
                        const perms = permissions[mod.id] || {};
                        return (
                          <tr key={mod.id} className="hover:bg-bg-base/40 transition-colors">
                            <td className="py-3 px-4">{mod.name}</td>
                            {['read', 'create', 'update', 'delete'].map(action => (
                              <td key={action} className="py-3 px-4 text-center">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    className="hidden"
                                    checked={!!perms[action]}
                                    onChange={() => handleTogglePermission(mod.id, action)}
                                  />
                                  <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${perms[action] ? 'bg-brand-primary border-brand-primary text-white' : 'border-border-card bg-bg-card hover:border-brand-primary/50'}`}>
                                    {perms[action] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                  </div>
                                </label>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-border-card bg-bg-base/30 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-text-sec bg-bg-card border border-border-card hover:bg-bg-base transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRole}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-brand-primary hover:bg-brand-secondary transition-colors shadow-lg shadow-brand-primary/25"
              >
                <Save size={16} />
                Save Role
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToRoles } from '../firebase';

export function usePermissions() {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !currentUser.companyId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToRoles(currentUser.companyId, (fetchedRoles) => {
      setRoles(fetchedRoles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const can = (action, module) => {
    if (!currentUser) return false;
    
    // Super Admins and System Admins bypass all checks
    const roleLower = (currentUser.role || "").toLowerCase();
    if (["admin", "superadmin", "system admin", "systemadmin"].includes(roleLower)) {
      return true;
    }

    // Find custom role
    // We assume currentUser.role stores the name or ID of the custom role
    const activeRole = roles.find(r => r.id === currentUser.role || r.name === currentUser.role);
    if (!activeRole) return false;

    // Check permissions
    if (activeRole.permissions && activeRole.permissions[module]) {
      return !!activeRole.permissions[module][action];
    }

    return false;
  };
  const hasAnyAdminPermission = () => {
    if (!currentUser) return false;
    const roleLower = (currentUser.role || "").toLowerCase();
    if (["admin", "superadmin", "system admin", "systemadmin"].includes(roleLower)) {
      return true;
    }
    
    const activeRole = roles.find(r => r.id === currentUser.role || r.name === currentUser.role);
    if (!activeRole || !activeRole.permissions) return false;

    // List of modules that belong to the admin dashboard
    const adminModules = [
      "Dashboard", "LiveActivity", "EmployeeManagement", "LeaveApprovals", 
      "Regularization", "AttendanceLogs", "Payroll", "NoticeBoard", 
      "Assets", "ActivityHistory", "EnvironmentSetup", "RolesPermissions",
      "ExternalLinks", "CustomDomains"
    ];

    return adminModules.some(module => activeRole.permissions?.[module]?.read);
  };

  return { can, hasAnyAdminPermission, roles, loading };
}

import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
const zunaLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAT60lEQVR42u1aaZRU1bX+9jnn3ltTV1V302BUjKAo2kQwtIpDlBYjTyBRVMohauLLy+OZyRj1aaJ51a0+kxgTEuFpHLKMJsRY7QSiMqjdTCKxCTOKCg4MytTd1TXfe8/Z70d1YYsoCLjeemux16q1at2qe8/9zt5n729/5wAH7aAdtIN20A7aATNOskilWO76fW+N9nlgZmppgair2/0zRm4DYzUYTWAi4gMBNplk0dxMZm+vHxBLpVjy55xVTrFsbWWVTLL43BO7y1h/Tn5w8rRJ+SeemeQuf/YPpdlPT+q+oAL6gHqYmQkAEZVnclUrRwww2C3qAaTkIRo6QgRBhBJp7BCSN7HW75h3Vr3bMLHB6/UcgRYQJcgA4M/yZlOv6FiVYnvt29uHOuHYPMexAiUPsCxACKAz0/3txPWxR1MplokE6f0GzMxUGXj5S+6ZpOR3ITBKCHGYUgARwD2vTlR+qDFAyTU+wO+CqR2aZ5Zc9+WT/yW0obf3aDcv2Pv6mvneha4nrnXs4mUr55v7avtEvpnOmBIRLCZoxxGqVPA2pNObjv1O85GlMqBPX0K0l57Fu21wMjB/tIPi28oCMt2A6xkNQ1ISAQywAVgDmssfEMN2CJFI2RuFks4Kxhzf9R8edo4zAyAmIjz+uNnpGWYWRGTaZxYHO0Hrd1UxcV5Hl+n4cPm6Ad35Q1eEw+EjtAETQRiAGUzs+z67+WMv/ll8/Z7W894AFi0tLTSoz4XP1NbKcVt3GG186KAtbNZAJq/TMHgfGl3aQLOBozVixuAQJWSNrQCtAc8YtkNAn76ClAOUimaJLvmTTjjbmdozjmxpARIJ0u1z/MtDEXmfVIjmcvBAhmzzfv+Vi+qmVcfCw/Mlw0KSYmYjSbDrelmpckeOv666q3c07s7UZ4FtbWVFRP4/ZpSujMfluG2dxmUNFXKE7Xr6JePzFGHUolPPpy273jvnkXQtO2qQ71unaSNGaw9nMMvQprcB6Wivup8cHo7af129QF9TcvUtRDQXANpn+Tf2O0TetbXDaHjgSERYuQwWilCNB/LuCwTwcNET0L5hKYSoiQMbPnAfvvjG6q5UiiXRfqzhShJon6WnReNiXHfW+JGwsDMZ//cnfd267hNJBsCnlaE5UwsDLWFNYI1/lSyPKRQAK6zdQ4+SNggo5Mzkt9Zs//lRg+MDLUdNjUbFkO6M6dQe33Rio3oQYAKIU7/p/q9IKHgdsYp7WudKpcK9q/7z7puRbEJzM/iz1u8eAVfCY+lL+jU7IBpcF8xsOoS39ctDzz0kv2QJ1PDh8HcFmEyyqK8vP3tgJwSGAw0NtDNTz364dKWU8tagJY/pzhkTqmY+fICU+bxZob3i2O5cKFfXx9zb1eHdPmJMYA0zCwBMJBhgpH67qqZv4JB+695wt595ZTxQ2BrMnjCOOhlMtAfAai/KFrNBRhAAAmmffdsW1JOZPwF2N6VBA8CyhdxXGX2172H7sLPVnwD8pW2q+3Ml5K3FHTL4Pmu3/0B5QrY78I+gxPDBI+RlOzN2T5hWWJWzoWu8tiLnnDCW6nIZOssIDAXQiSQIzfhMwJ9ZrNvayr97rlmmFNhn44Yisl9RV5/IDLS0fPL+RIL0IzevqZ35YNfRyWRSbVyTrl01T99usVkRDstfhSPyodWv6JUr53oXjfyWfadf8k+1I/odk5f2B+/pUlVMfImlnszM1H4/W73LVt1qUCJB2gqGjo9H1aW2kqPIAgoGufJq2rN9JuBt28qzJcBPljwQAyQloD1xIxFxL1pJySSLZDIpnror86vqfkevLeUjrw+L3bJ8w7rQ0mhM3Op6ol9HlzGGgVhUDAlH1BP/nOM9OnDUe2+U/MI3mU2xlCMrk4GRFo1bNCN/aMNE8pLJ5CfeUTmwsiXoQsFoNuimfDoDAE1N4P0CnEiQZmZx8lh7YaGo51eFhZXNGC8al99Y/EIp0dhIfmsrq1SqXPuGxW68ua4uchOTVctGqoBjHd/5vuq/ebM20RigFPxi0czYuk1/b9t2nKgcdXfnqn6R0VdVrXI9/WI4KITvGh1whCOUNRAA6uubduaZbfVlQMx0BFmQgZCQ7GP7rNWxrgrp2ZPtaQ2jpaWcBcg3N/pFuUgKAdeHDkbUA4tmFFee2kivM7O4/9/bLc8V3+3OQmutASZRdGHIAKU0uW61marhTfrqWYE1uxvHCQpICzAGwvPASnEXAEyY8JHXEgnSnGQxC/4xTEAgBOTzWNvcTGZvaOUePVwZJJVi2TDaXlwo+HdG47BKnvGFELFAWD23cHpxMACe+ECDhhBBzZBgCCIi1jCRKkE7Nuu/HTdCfu+rZ5YzbmsrK2YW3MoKYJr3SPqYoEOjPBgdCgrhFfX6QKe9tlwlyoArzcGCY4pH2g4dzWS0sgBjeBEAfFrX9rkB98yyYWZ50rnqFx0delY8KhzXN67tyAEg+WUi4hf+WPp1VcTp63vGB0nNxL4QQoAhfNd9OpVi2X4/W0RkGhvJB8DYVq6bMhJ+wA6KoAqwH64CgTBlSILctjbISl0dORKCmckIcWYsLi1pwxQLALtmXu98c0AA95QeAwBk5CXdnXpFLCzsbFYnTv+GNeu5KaXfBC37BieqEa8TKhSECjlCOQHIdL7428TNkecmrAY3TCzXYmamtjZISpB+dbp3T7xanlVi7cZi0tnRYf4ZOFTey8xiZCN2hujIkTBExELJSwwBwZBQ2azekA1ZSwBgQgLmgAHuBZoavk7pzrQ3fvNG97unnKtaXvpz8dbqGvsGX+nS4UdJGT9cry9x4cqc6/1HOpc++aLrgjcwM1EPoa8IB42N5L/2nPebaJX6UaZg3Ghc2MWCThe6vcuHDCG3TALK3uVyOPOiqelByqazSx78SAgEQ880NlKxtZXVngjHXietXUCbHva1HsD6mQ+WLrct+/YSafewQdIplsymfNE79/wfhNb1Zl2VHpqTLAhgJEgvmelNqapSP+joNq4TEpbRxs1kvfFnXBBcuysnbhsJ0UjkL3jCuzYWEXZ3Fl42D8O+/1DF+3uL4XMBruBmZrzylFvvFeVDLsOv6UtSa9OdL4qxZ4wJrkul2F69GqYJMBXPpnp63Odr2Dn0Rf1oKCASnVlTCoWFQzCljg7vorMuCLa2trLqWeMfCQaAfjVVGKCC4upczviRkLAyeTPrjPOdFZV28gsBzGBqaQHVrYagweLPwbAMGmlcWwk73elfcdo35fKeF3YBoLlX19XYSP7CJzN9QxH9RDgkv9aVMcVwSATYmEx3zh1/1gXBl3YFW2F7jY3kL5rm3hWMiFBnp3FLJbDn66ZK2fziFMMeLvvyVPeWpc8zz3vSL771CvOrz+lfAUB7O1u7azEBoO2p7uOWzvbXrpnLvHimLqx9lXnlPL154XT3pN7/2929r87wzl89j3nBdF1aNpO59e/e33tz6y9EteQkCzSBF7cUj4Rjr9YQKuhAeUavkn3l8OHrYTChnEmxi2cXtLhfC0XkU8oRfQqeKVbHRaBQMKsyeXHBGWNo3e48WwnVV57NHRYOO8uYZXWuE8xsctovfeXlN4KbAODzqpV7naVb6kFExEao28IhETTaAGByi+b7DQ3ktXyUyT8Gdu7fimMDQTnbQPQpeKZUWysCuYJ+ccOmzJlnjKF1nGK5G7DU0gJqTbaqUNB53HFkn+4O4wcsqELB//FZl4U21NeDvjBptpw4mBa3ZOpfe077C57W7tKZzHOf8B7fnZTammxVADDn4eLYV5/S3qvPGn5tDhfXvcbcPkf/Jdnze++Q5CSL1iSrHjlXAcCKufqRd5cxz2vxC4tTzC8+6v3p08L/wCatFhBAhm3vJ6EqIfMfGs4b45mSTvaIfPxRP5ySjYlGf/bDuRHhiPWEFpDKZrc6Tk5Xt/8/DV+3fli+h0WF+yaTLHqyualkumUv6cnRmLhq80ZdFJ4MdGX0gtETrX/7PKxqn1VLIuKFj2b6On2Db3maIsITIpvVT466Ql3cm7RX+O6oIzK1ngguDVSpw1RUu7XV0u7o8KecPNr6USrFckKvtV5RGVO3bRsejkavcH0E6o4QNYcNUomN7+iS2yUdn/3X893Z0/r2d2LKkWec8g1n6qdJvPvt4TKfha+izoVVcRnd/L72LEBA8L09a22n1deXG/RT7y/8IRZXh2nLlGqqpdOV9p48ebT9I2aWwEdgUxNYJppJz5iUu1Ao+3HbUsoRQKELeHOF9i0tnULWeyvjZkZfOrImt6xbv1BbI0e8MqPk0ThK7S7Z7XfSqrAYERAXuy7AnrTyOX/d25nl84nK3VT55VMykSA94+6u4YKcywrGePFaYXenzfqN2fTVu+4kpFIpWfd9UPLbrQHXV1MglMrkjZstGD+Th+empcznveUZd+uoS6+v2bhkh54djcsRnVl4VXH1l4Uz8qc1NpKfSqXkAQPcE87mn89znbTp5O4uw6qsC86cOLHBa01i52B1x08gAHCNuEqCYDvQtgPyitx0wQV1mQkToEaOxM7WMJFI6MZG8k8cOmQIC/GlQtEwM9lgUkSGAg6QThfvu+yGwze0tUFqY172PcDXhoUl7HCV/fjiOenaCasn8O5UkX3zcI9mxcYfHomIKt+Fp12glC+3ZB+LhJ5uiqWq1wYQCnYmbVhALuQkiyFDyG1sJL+xkXwiMu3PF45aOU/fNmB49QzHUZoImgQbZjYEGAZIAluYmd58E3TKefbt3Wn/3liVsHM5U6qKysOFCU6iZjK9VZH9WsNtPU21x3yiFIDngopFsMd4HQDa8BFpb1lT/i8DhgisNfygI+x0t38sNVvrl71cGG071lG5PGqUTacJ8EgnKIK5IhCpA7xOAZ8BXwPRCOxtHe6iLZEPX2hqqiIAmlMsl7yz5CdpNfTUcEgN60qjEAjJby2Z7d4z/FxqP2CKBwAoSQO1BtwCK81+1kh3y66iWd3xZcBKYqGSoOyOcvUOxsWd7dM55IjAZu3TNQMHyNtrqsV5mkUwk2OEHaCqj3a14z2RL/hLYPSbOzoK9xveMu7aa48pNTWBm5vJtABomNjguXn3GgVQKIRgTa0QwpbXH7CyVJm1pS/qaYGwGPv2Cp+1a7bb8cyxY67s0917H6cilk//Q7YvEFhtW6o2crhx+x0u7FyXmZ/bUrz0jMvDm19/hS93ffOLYEAMLrlmh/FNqpDXU0aMKWtdH+9+yrsNu9LNxTO938er1cCiZ/r5RRzvF8WgU8bRh3vaV9prD2vN4aoIZE1UKWO4b3arUp/Y3iQyRE10/k+qtrhcvFjaOl/aJuzN63UpGBFfi/UPvL5qvv+z406jx4aeKY/zfYw0XnHY0JHW90eMCaypsCuisiBXJicff3kiYQBg3l9fvuWNBemfLnts7Ril8qcZWQwcSC5N2qNcOo227mzhXs/zntFuIdrTmokKAVjwzLaqlXN/8eyyl/1pE66raisWi18rFb3XdZd0Nr1ldMlFVTgi71zWpjcufdG/qVTC8qGN4Y2VQZqaoFtby9Syt9bNSRbMLJJJFgxDLb/O3DH4lLPfhx19Kz7o6LffWszjTz0v+G6P0MD7z7TABF5t3X1Nbfz4+ki/ounqvOja/ht7/2dFq3eOkOL3dkDUCwHkMrq12pFjZ8/frvrHo7dpX/7ACUiLA75f3U+pmloglzN538Vz2vBTAnL+iefQpj29y1N3dd3Sp0/sjs4coA1DCkJtDNj8Qf72xE3h/9rvEwDJJAs0N2HY3TfcoazAtUKqEGC06xYeWzbttavH33raVwJhdYdvxBgG4HrGjceEne4ws7zu7LdOuTC2AwBmPJAdpovWrcTyoqqoBDvaBGNENX0EkQTyOZOB4RXa53bf0FJ45h0Ds63ocSFkk13yoLqWrnpXR+vftp1AX9cYEAnJDK0kUCp5nbV254DGH/bL7vP+cGW2Wn7ZdVNtdeRnnVnA94yBENSnT/iK+nEn7QgFzWTNYozrGU/ZwgqGhN2Z9v+74Rzr1t67iOMStAzAxdMnp0/N5YM/1Gkar7MymN0CqKDRgSpUVcXk6eEITgcBnidRLDFsw8VQUNiuZ9o/tKPjhKG460FCCmYGmCF8DQKJqm2+VQMg29QE+qyzI5/i4fIxh/b7l6j3Mse/GbCD/V1tQIokMxkpwV7JKy343TN9rnj0ormHfkmctHWHWe765saTRlpzdqWRlb3jir717H3pQdqVCW3si2BoWCSsSFgAS4AUQyrDUgEkwI4jUczrDW/M+dOg+MArV8ViwaMLLjQTFLPRQUeIQsHbsHH9u8f+ePIgd5/OeFTC4vnkm9Fs+Ij1ju3UGDIgIYgZXE5kHu94b8ORIyYcea0t+IOVs9+4J9E8xGX+9F14TrJo6WkwKteentzxFULkdDY4XfsYYpj7S6KagGORFGXKFXSAbR0fnAeO2bXVoWlFF/ANoBQQcIAd6dz3Ej+NPLRfaziZZNHUDG75dXZxLBo5KecZF4AFhu9YQuWy7sbO3MrBE5sb8p+xN/ypzx4JiMbmT3Y68+/tqk6zOESoQK3nUUQzVNjx81u2b3v/qp8f8fZfb89eWVXtXM+GDmXGZle7ky75aeiR/T6cVlEjWu7afu6MKb6Z9QDz9MnMz/+Rec6DzI/9MvudsrpRLiWV0z77crquNclqbwS53ofPZj7YVbPrSaP9ZlqVWWu5OzPKsZybtBYDIfCh67n3XHJjKPVFHPljZmpqAlWOTPTe3yIi3jWK9jaqPpcHKt9XpVbZu7v+f2H7GlF7Hd4VgMxM+6IH/z+1L3BWD9pBO2gH7aAdNPwvQPVefmM0DaUAAAAASUVORK5CYII=";

import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useModal } from "../context/ModalContext";
import { 
  getAllRegisteredUsers, 
  subscribeToAdminDashboard,
  updateUserRecord,
  updateUserAccountStatus,
  deleteUserRecord,
  registerUser,
  updateLeaveRequest,
  subscribeToLeaveRequests,
  uploadPaidLeave,
  deletePaidLeave,
  subscribeToPaidLeaves,
  updateAttendanceRules,
  subscribeToAttendanceRules,
  updatePaidLeaveStatus,
  subscribeToRegularizationRequests,
  updateRegularizationRequest,
  getAllMessagesAdmin,
  getAllDmThreadsAdmin,
  deleteChatMessage,
  subscribeToChannels,
  subscribeToAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  recoverChatData,
  subscribeToCompanyPayroll,
  saveEmployeePayroll,
  deleteEmployeePayroll,
  updateEmployeeGrossSalary,
  listenToCompany,
  updateCompanyDetails,
  addEnvironmentSetting,
  updateEnvironmentSetting,
  deleteEnvironmentSetting,
  subscribeToEnvironmentSettings,
  wipeAllEmployeePayrolls
} from "../firebase";

import { 
  Shield, 
  ShieldAlert,
  Users, 
  Clock, 
  Coffee, 
  MapPin, 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  AlertCircle,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  PieChart,
  UserPlus,
  Info,
  Check,
  X,
  ClipboardList,
  Trophy,
  AlertTriangle,
  MessageSquare,
  Mail,
  Paperclip,
  Plus,
  HardDrive,
  Laptop,
  Hash,
  ChevronDown,
  Layers,
  Activity,
  Lock,
  Eye,
  IndianRupee,
  Banknote,
  ExternalLink,
  Navigation,
  Compass,
  Settings,
  UserX,
  UserCheck,
  Upload
} from "lucide-react";
import { jsPDF } from "jspdf";
import { addStandardPDFHeader, addPDFFooter } from "../utils/pdfHeader";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import DomainManager from "../components/DomainManager";
import ExternalLinksTab from "../components/ExternalLinksTab";
import RolesTab from "../components/RolesTab";
import { usePermissions } from "../hooks/usePermissions";
import { subscribeToRoles } from "../firebase";
import { 
  getLocationDisplayName, 
  formatGpsCoords, 
  getGoogleMapsUrl, 
  resolveLocationName 
} from "../utils/locationHelper";
const getBase64ImageFromUrl = async (imageUrl) => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), false);
    reader.addEventListener("error", () => reject(new Error("Failed to read image")), false);
    reader.readAsDataURL(blob);
  });
};

const getMockDesignation = (name) => {
  if (!name) return "Software Engineer";
  const nameLower = name.toLowerCase();
  if (nameLower.includes("marcus")) return "Senior Developer";
  if (nameLower.includes("sarah")) return "UI Designer";
  if (nameLower.includes("emily")) return "Product Manager";
  if (nameLower.includes("julia")) return "QA Engineer";
  if (nameLower.includes("tom")) return "Marketing Specialist";
  if (nameLower.includes("sia")) return "HR Analyst";
  if (nameLower.includes("james")) return "DevOps Engineer";
  return "Software Intern";
};

const shiftPresets = [
  { label: "Morning Shift", start: "09:00", end: "18:00" },
  { label: "Night Shift", start: "21:00", end: "06:00" }
];

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const hasOverlap = (s1, e1, s2, e2) => {
  if (!s1 || !e1 || !s2 || !e2) return false;
  const start1 = new Date(s1).setHours(0, 0, 0, 0);
  const end1 = new Date(e1).setHours(23, 59, 59, 999);
  const start2 = new Date(s2).setHours(0, 0, 0, 0);
  const end2 = new Date(e2).setHours(23, 59, 59, 999);
  return start1 <= end2 && start2 <= end1;
};

const getOverlapInfo = (s1, e1, s2, e2) => {
  if (!s1 || !e1 || !s2 || !e2) return 0;
  const start1 = new Date(s1).setHours(0, 0, 0, 0);
  const end1 = new Date(e1).setHours(23, 59, 59, 999);
  const start2 = new Date(s2).setHours(0, 0, 0, 0);
  const end2 = new Date(e2).setHours(23, 59, 59, 999);
  
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  
  if (overlapStart <= overlapEnd) {
    const diffTime = Math.abs(overlapEnd - overlapStart);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
};

const getDurationDays = (s, e) => {
  if (!s || !e) return 1;
  const start = new Date(s).setHours(0, 0, 0, 0);
  const end = new Date(e).setHours(23, 59, 59, 999);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function AdminDashboard() {
  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('att_users') || '[]');
      const atts = JSON.parse(localStorage.getItem('att_attendance') || '{}');
      const tasks = JSON.parse(localStorage.getItem('att_tasks') || '[]');
      let missingName = 'Mohammed Arshak M U';
      let missingUid = null;
      let missingCompany = null;
      for (const logs of Object.values(atts)) {
        for (const log of logs) {
          if (log.userName === missingName || log.name === missingName) {
            missingUid = log.uid;
            missingCompany = log.companyId;
            break;
          }
        }
      }
      if (!missingUid) {
        for (const task of tasks) {
          if (task.assigneeName === missingName) {
            missingUid = task.assigneeId;
            missingCompany = task.companyId;
            break;
          }
        }
      }
      if (missingUid && !users.find(u => u.uid === missingUid)) {
        users.push({
          uid: missingUid,
          companyId: missingCompany,
          name: missingName,
          email: 'mohammedarshak@example.com',
          role: 'employee',
          status: 'active',
          department: 'Development',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('att_users', JSON.stringify(users));
        alert('Successfully recovered missing user profile!');
        window.location.reload();
      }
    } catch (e) { console.error('Recovery failed', e); }
  }, []);

  const { currentUser } = useAuth();
  const { can } = usePermissions();
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminUser = currentUser?.role === "admin" || currentUser?.role === "superadmin" || currentUser?.role === "system admin";

  // Sync activeTab with sidebar parameters: 'live' | 'logs' | 'users' | 'analytics'
  const activeTabParam = searchParams.get("tab");
  let defaultTab = "live";
  
  if (!activeTabParam && !isAdminUser) {
    if (can("read", "Dashboard")) defaultTab = "analytics";
    else if (can("read", "LiveActivity")) defaultTab = "live";
    else if (can("read", "EmployeeManagement")) defaultTab = "users";
    else if (can("read", "LeaveApprovals") || can("read", "Regularization")) defaultTab = "logs";
    else if (can("read", "NoticeBoard")) defaultTab = "rules";
    else if (can("read", "TeamHub")) defaultTab = "chat";
    else if (can("read", "Assets")) defaultTab = "assets";
    else if (can("read", "ExternalLinks")) defaultTab = "external-links";
    else if (can("read", "Payroll")) defaultTab = "payroll";
    else if (can("read", "CustomDomains")) defaultTab = "domains";
    else if (can("read", "RolesPermissions")) defaultTab = "roles";
    else if (can("read", "EnvironmentSetup")) defaultTab = "environmental-setup";
  }

  const activeTab = activeTabParam || defaultTab;
  const setActiveTab = (tab) => setSearchParams({ tab });

  const [users, setUsers] = useState([]);
  const [showPayrollSettingsModal, setShowPayrollSettingsModal] = useState(false);
  const [companyPayrollSettings, setCompanyPayrollSettings] = useState({ pf: true, esi: true, pt: true, insurance: false, insuranceAmount: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Environment Setup States
  const [envSettings, setEnvSettings] = useState([]);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [envForm, setEnvForm] = useState({ id: "", key: "", value: "", description: "", status: "active" });
  const [envLoading, setEnvLoading] = useState(false);

  // Modals & Form States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Add Employee Form Fields
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newShiftType, setNewShiftType] = useState("Morning");
  const [newShiftStart, setNewShiftStart] = useState("09:00");
  const [newShiftEnd, setNewShiftEnd] = useState("18:00");
  const [newAnnual, setNewAnnual] = useState(25);
  const [newSick, setNewSick] = useState(10);
  const [newCasual, setNewCasual] = useState(6);
  
  const [newDob, setNewDob] = useState("");
  const [newJoiningDate, setNewJoiningDate] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newJobType, setNewJobType] = useState("Full-time");
  const [newDesignation, setNewDesignation] = useState("");
  const [newRole, setNewRole] = useState("Employee");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPersonalEmail, setNewPersonalEmail] = useState("");
  const [newPersonalMobileNumber, setNewPersonalMobileNumber] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newMaritalStatus, setNewMaritalStatus] = useState("Single");
  const [newEmployeeStatus, setNewEmployeeStatus] = useState("Active");
  const [newSourceOfHire, setNewSourceOfHire] = useState("");
  const [newCurrentExperience, setNewCurrentExperience] = useState("");
  const [newReportingManager, setNewReportingManager] = useState("");
  const [newUan, setNewUan] = useState("");
  const [newPan, setNewPan] = useState("");
  const [newAadharNum, setNewAadharNum] = useState("");
  const [newBankAcNo, setNewBankAcNo] = useState("");
  const [newIfscCode, setNewIfscCode] = useState("");
  const [newPermanentAddress, setNewPermanentAddress] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newInstituteName, setNewInstituteName] = useState("");
  const [newYearOfCompletion, setNewYearOfCompletion] = useState("");
  const [newDateOfExit, setNewDateOfExit] = useState("");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newCostCenter, setNewCostCenter] = useState("");
  const [newPfNo, setNewPfNo] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newAddTab, setNewAddTab] = useState("Personal");

  // Edit Form Fields
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editShiftType, setEditShiftType] = useState("Morning");
  const [editShiftStart, setEditShiftStart] = useState("10:00");
  const [editShiftEnd, setEditShiftEnd] = useState("19:00");
  const [editAnnual, setEditAnnual] = useState(25);
  const [editSick, setEditSick] = useState(10);
  const [editCasual, setEditCasual] = useState(6);

  const [editDob, setEditDob] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editJobType, setEditJobType] = useState("Full-time");
  const [editDesignation, setEditDesignation] = useState("");
  const [editRole, setEditRole] = useState("Employee");
  const [editAllowManualCheckIn, setEditAllowManualCheckIn] = useState(false);
  const [editProgram, setEditProgram] = useState("Internship");
  const [editTasks, setEditTasks] = useState([]);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPersonalEmail, setEditPersonalEmail] = useState("");
  const [editPersonalMobileNumber, setEditPersonalMobileNumber] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editCostCenter, setEditCostCenter] = useState("");
  const [editPfNo, setEditPfNo] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editMaritalStatus, setEditMaritalStatus] = useState("Single");
  const [editEmployeeStatus, setEditEmployeeStatus] = useState("Active");
  const [editSourceOfHire, setEditSourceOfHire] = useState("");
  const [editCurrentExperience, setEditCurrentExperience] = useState("");
  const [editReportingManager, setEditReportingManager] = useState("");
  const [editUan, setEditUan] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editAadharNum, setEditAadharNum] = useState("");
  const [editBankAcNo, setEditBankAcNo] = useState("");
  const [editIfscCode, setEditIfscCode] = useState("");
  const [editPermanentAddress, setEditPermanentAddress] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editInstituteName, setEditInstituteName] = useState("");
  const [editYearOfCompletion, setEditYearOfCompletion] = useState("");
  const [editDateOfExit, setEditDateOfExit] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editTab, setEditTab] = useState("Personal");

  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Location Details Modal State
  const [locationModalData, setLocationModalData] = useState(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [, setLocationCacheVersion] = useState(0);
  const [liveViewMode, setLiveViewMode] = useState("live"); // 'live' | 'all-logs'
  
  // Action state loader
  const [actionLoading, setActionLoading] = useState(false);

  // Leave Requests state
  const [allRequests, setAllRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [managerCommentInput, setManagerCommentInput] = useState("");

  // Regularization Requests state
  const approvalsSubTab = searchParams.get("sub") || "leaves";
  const setApprovalsSubTab = (sub) => setSearchParams({ tab: "logs", sub });
  const [regularizationRequests, setRegularizationRequests] = useState([]);
  const [allRegularizationRequests, setAllRegularizationRequests] = useState([]);
  const [selectedRegRequestId, setSelectedRegRequestId] = useState(null);
  const [regManagerCommentInput, setRegManagerCommentInput] = useState("");

  // History Filter states
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("all");
  const [historyStatus, setHistoryStatus] = useState("all");

  // Pagination states
  const [livePage, setLivePage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [leavesPendingPage, setLeavesPendingPage] = useState(1);
  const [regsPendingPage, setRegsPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [customRoles, setCustomRoles] = useState([]);
  useEffect(() => {
    if (currentUser?.companyId) {
      return subscribeToRoles(currentUser.companyId, setCustomRoles);
    }
  }, [currentUser?.companyId]);


  // Notice Board / Rules & Leaves tab states
  const [rulesInput, setRulesInput] = useState("");
  const [paidLeaves, setPaidLeaves] = useState([]);
  const [leaveTitle, setLeaveTitle] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("active");
  const [leaveDesc, setLeaveDesc] = useState("");

  // Delete Paid Leave confirmation popup states
  const [showDeletePaidLeaveConfirm, setShowDeletePaidLeaveConfirm] = useState(false);
  const [selectedPaidLeave, setSelectedPaidLeave] = useState(null);

  // Asset Management States
  const [assets, setAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetCategoryFilter, setAssetCategoryFilter] = useState("all");
  const [assetStatusFilter, setAssetStatusFilter] = useState("all");
  const [assetsPage, setAssetsPage] = useState(1);

  // Asset Form States
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [assetFormName, setAssetFormName] = useState("");
  const [assetFormCategory, setAssetFormCategory] = useState(["Laptop"]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [assetFormSerial, setAssetFormSerial] = useState("");
  const [assetFormStatus, setAssetFormStatus] = useState("Available");
  const [assetFormAssignedUser, setAssetFormAssignedUser] = useState("");
  const [assetFormAssignedDate, setAssetFormAssignedDate] = useState("");
  const [assetFormAssigningAuthority, setAssetFormAssigningAuthority] = useState("");
  const [assetLoading, setAssetLoading] = useState(false);

  // Bulk Assign Assets Modal States
  const [showAssignAssetsModal, setShowAssignAssetsModal] = useState(false);
  const [assignAssetsTargetUser, setAssignAssetsTargetUser] = useState("");
  const [assignAssetsDate, setAssignAssetsDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignAssetsAuthority, setAssignAssetsAuthority] = useState("");
  const [assignAssetsSelectedIds, setAssignAssetsSelectedIds] = useState([]);
  const [assignAssetsLoading, setAssignAssetsLoading] = useState(false);

  // Chat Monitor states
  const [chatMessages, setChatMessages]       = useState([]);
  const [chatChannels, setChatChannels]       = useState([]);
  const [chatDmThreads, setChatDmThreads]     = useState([]);
  const [chatLoading, setChatLoading]         = useState(false);
  const [chatFilter, setChatFilter]           = useState(""); // search
  const [chatTypeFilter, setChatTypeFilter]   = useState("all"); // 'all' | 'channel' | 'dm'
  const [chatThreadFilter, setChatThreadFilter] = useState("all"); // specific thread id or 'all'
  const [chatStatusFilter, setChatStatusFilter] = useState("all"); // 'all' | 'deleted' | 'active'
  const [chatPage, setChatPage] = useState(1);


  const formatShiftTime = (timeStr) => {
    if (!timeStr) return "10:00 AM";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = String(minutes).padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Ticking time effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filters
  const searchQuery = searchParams.get("q") || "";
  const setSearchQuery = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set("q", val);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  };
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Payroll Module
  const [payrollMonth, setPayrollMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  useEffect(() => {
    if (currentUser?.companyId) {
      const unsub = listenToCompany(currentUser.companyId, (data) => {
        if(data) {
          setCompanyName(data.name || "ZUNA HRMS");
          setCompanyLogo(data.logoBase64 || "");
          setCompanyAddress(data.address || "");
          if (data.payrollSettings) {
            setCompanyPayrollSettings(data.payrollSettings);
          }
        }
      });
      return () => unsub();
    }
  }, [currentUser?.companyId]);
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showDeletePayslipConfirm, setShowDeletePayslipConfirm] = useState(false);
  const [selectedPayrollUser, setSelectedPayrollUser] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState("");
  const [editLeaveDaysValue, setEditLeaveDaysValue] = useState("");

  useEffect(() => {
    if (activeTab === "payroll" && currentUser?.role === "admin") {
      const unsub = subscribeToCompanyPayroll(currentUser.companyId, payrollMonth, payrollYear, (data) => {
        setPayrollData(data);
      });
      return () => unsub();
    }
  }, [activeTab, payrollMonth, payrollYear, currentUser?.companyId, currentUser?.role]);

    const numberToWords = (num) => {
    const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
    const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
    num = Math.round(Number(num));
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str || 'zero';
  };

  const loadDirectoryData = async () => {
    try {
      const u = await getAllRegisteredUsers(currentUser.companyId);
      setUsers(u);
    } catch (err) {
      showToast("Failed to load user directory.", "error");
    }
  };

  useEffect(() => {
    if (currentUser.role !== "admin") return;

    loadDirectoryData();

    // Subscribe to live logs
    const unsubscribe = subscribeToAdminDashboard(currentUser.companyId, (data) => {
      setLogs(data);
      setLoading(false);
    });

    // Subscribe to leave requests
    const unsubscribeLeaves = subscribeToLeaveRequests(currentUser.companyId, (data) => {
      setAllRequests(data || []);
      setLeaveRequests(data.filter(r => r.status === "pending"));
    });

    // Subscribe to regularization requests
    const unsubscribeRegs = subscribeToRegularizationRequests(currentUser.companyId, (data) => {
      setAllRegularizationRequests(data || []);
      setRegularizationRequests(data.filter(r => r.status === "pending"));
    });

    // Subscribe to attendance rules
    const unsubscribeRules = subscribeToAttendanceRules((data) => {
      setRulesInput(data || "");
    }, currentUser.companyId);

    // Subscribe to paid leaves
    const unsubscribePaidLeaves = subscribeToPaidLeaves(currentUser.companyId, (data) => {
      setPaidLeaves(data || []);
    });

    // Subscribe to assets
    const unsubscribeAssets = subscribeToAssets(currentUser.companyId, (data) => {
      setAssets(data || []);
    });

    // Subscribe to environment settings
    const unsubscribeEnv = subscribeToEnvironmentSettings(currentUser.companyId, (data) => {
      setEnvSettings(data || []);
    });

    return () => {
      unsubscribe();
      unsubscribeLeaves();
      unsubscribeRegs();
      unsubscribeRules();
      unsubscribePaidLeaves();
      unsubscribeAssets();
      unsubscribeEnv();
    };
  }, [currentUser.role]);

  // Load Chat Monitor data when tab=chat is active
  useEffect(() => {
    if (activeTab !== "chat" || currentUser.role !== "admin") return;
    setChatLoading(true);
    Promise.all([
      getAllMessagesAdmin(currentUser.companyId),
      getAllDmThreadsAdmin(currentUser.companyId)
    ]).then(([msgs, dms]) => {
      setChatMessages(msgs || []);
      setChatDmThreads(dms || []);
    }).catch(() => {}).finally(() => setChatLoading(false));

    const unsubCh = subscribeToChannels(currentUser.companyId, setChatChannels);
    return unsubCh;
  }, [activeTab, currentUser.role]);

  useEffect(() => {
    if (leaveRequests.length > 0 && (!selectedRequestId || !leaveRequests.some(r => r.id === selectedRequestId))) {
      setSelectedRequestId(leaveRequests[0].id);
    }
  }, [leaveRequests, selectedRequestId]);

  // Reset pagination on tab/filter change
  useEffect(() => {
    setLivePage(1);
    setUsersPage(1);
    setLeavesPendingPage(1);
    setRegsPendingPage(1);
    setHistoryPage(1);
    setChatPage(1);
  }, [activeTab, approvalsSubTab, searchQuery, historySearch, historyType, historyStatus, chatFilter, chatTypeFilter, chatThreadFilter, chatStatusFilter]);

  useEffect(() => {
    let isMounted = true;
    const resolveUncached = async () => {
      if (!logs || logs.length === 0) return;
      const locationsToResolve = [];
      logs.forEach(l => {
        if (l.checkInLocation) locationsToResolve.push(l.checkInLocation);
        if (l.checkOutLocation) locationsToResolve.push(l.checkOutLocation);
      });

      let hasUpdate = false;
      for (const loc of locationsToResolve) {
        const lat = loc.latitude ?? loc.lat;
        const lon = loc.longitude ?? loc.lng ?? loc.lon;
        if (lat && lon && (!loc.locationName || loc.locationName === "Unknown Location")) {
          const resolved = await resolveLocationName(lat, lon);
          if (resolved && resolved !== "—") {
            hasUpdate = true;
          }
        }
      }
      if (hasUpdate && isMounted) {
        setLocationCacheVersion(v => v + 1);
      }
    };
    resolveUncached();
    return () => { isMounted = false; };
  }, [logs]);

  if (currentUser.role !== "admin") {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle size={48} className="text-brand-danger mb-4" />
        <h2 className="text-2xl font-bold text-text-main">Access Denied</h2>
        <p className="text-text-sec text-center mt-2">You must be an administrator to access this dashboard.</p>
      </div>
    );
  }

  // Filter out admin users from directory and counts
  const staffUsers = users.filter(u => u.role !== "admin" && u.email !== "admin@teamcarrezza.com");

  // Get department options
  const departments = [...new Set(staffUsers.map((u) => u.department).filter(Boolean))];

  // Get user's current status and details for today
  const getLiveUserStatus = (user) => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const userLog = logs.find((l) => l.userId === user.uid && l.date === todayStr);

    if (!userLog) {
      return { status: "not-started", details: null };
    }
    return { status: userLog.status, details: userLog };
  };

  // Filter logs for table
  const filteredLogs = logs.filter((log) => {
    const user = users.find((u) => u.uid === log.userId) || { name: log.userName, email: "", department: log.userDept };
    const inLocName = getLocationDisplayName(log.checkInLocation);
    const outLocName = getLocationDisplayName(log.checkOutLocation);
    const inGps = formatGpsCoords(log.checkInLocation);
    const outGps = formatGpsCoords(log.checkOutLocation);

    const matchesSearch = 
      (log.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.date || "").includes(searchQuery) ||
      inLocName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outLocName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inGps.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outGps.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = !selectedDept || log.userDept === selectedDept;
    const matchesDate = !selectedDate || log.date === selectedDate;
    const matchesLocation = selectedLocationFilter === "all" || 
      inLocName.toLowerCase().includes(selectedLocationFilter.toLowerCase()) || 
      outLocName.toLowerCase().includes(selectedLocationFilter.toLowerCase());
    
    return matchesSearch && matchesDept && matchesDate && matchesLocation;
  });

  // Filter live users
  const liveStatusList = staffUsers.map((u) => {
    const live = getLiveUserStatus(u);
    return {
      user: u,
      status: live.status,
      log: live.details
    };
  }).filter((item) => {
    const inLocName = getLocationDisplayName(item.log?.checkInLocation);
    const outLocName = getLocationDisplayName(item.log?.checkOutLocation);
    const inGps = formatGpsCoords(item.log?.checkInLocation);
    const outGps = formatGpsCoords(item.log?.checkOutLocation);

    const matchesSearch = 
      (item.user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      inLocName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outLocName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inGps.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outGps.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = !selectedDept || item.user.department === selectedDept;
    const matchesLocation = selectedLocationFilter === "all" || 
      inLocName.toLowerCase().includes(selectedLocationFilter.toLowerCase()) || 
      outLocName.toLowerCase().includes(selectedLocationFilter.toLowerCase());
    
    return matchesSearch && matchesDept && matchesLocation;
  });

  // Distinct detected location names for location filter dropdown
  const detectedLocations = [...new Set([
    ...logs.map(l => [
      getLocationDisplayName(l.checkInLocation), 
      getLocationDisplayName(l.checkOutLocation)
    ]).flat()
  ])].filter(name => name && name !== "—" && !name.includes("Unknown"));

  // Filter user profiles
  const filteredProfiles = staffUsers.filter((u) => {
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDept || u.department === selectedDept;
    
    let matchesStatus = true;
    if (selectedStatus) {
      const userToday = getLiveUserStatus(u);
      const isWorking = userToday.status === "checked-in" || userToday.status === "on-break";
      if (selectedStatus === "active") {
        matchesStatus = isWorking;
      } else if (selectedStatus === "offline") {
        matchesStatus = !isWorking;
      }
    }
    
    let matchesShift = true;
    if (selectedShiftFilter) {
      const start = u.shiftStart || "10:00";
      const isNight = start >= "18:00" || start < "06:00";
      if (selectedShiftFilter === "morning") matchesShift = !isNight;
      else if (selectedShiftFilter === "night") matchesShift = isNight;
    }
    
    return matchesSearch && matchesDept && matchesStatus && matchesShift;
  });

  // Filter leave requests for the queue
  const filteredLeaveRequests = leaveRequests;

  // Filter regularization requests for the queue
  const filteredRegRequests = regularizationRequests;

  // Filter unified request history
  const getUnifiedHistory = () => {
    const leaveHistory = allRequests.filter(r => r.status !== "pending").map(r => ({
      ...r,
      reqType: "Leave",
      dateLabel: r.startDate && r.endDate ? `${r.startDate} to ${r.endDate}` : "—",
      details: `${r.type} (${r.duration})`,
    }));

    const regHistory = allRegularizationRequests.filter(r => r.status !== "pending").map(r => ({
      ...r,
      reqType: "Regularization",
      dateLabel: r.date,
      details: `Missed Check-In (${formatShiftTime(r.checkInTime)} - ${formatShiftTime(r.checkOutTime)})`,
    }));

    const combined = [...leaveHistory, ...regHistory];
    
    return combined.filter(item => {
      const searchLower = historySearch.toLowerCase();
      const matchesSearch = !historySearch || 
        (item.userName || "").toLowerCase().includes(searchLower) ||
        (item.reason || "").toLowerCase().includes(searchLower) ||
        (item.details || "").toLowerCase().includes(searchLower);
      const matchesType = historyType === "all" || item.reqType.toLowerCase() === historyType;
      const matchesStatus = historyStatus === "all" || item.status === historyStatus;
      return matchesSearch && matchesType && matchesStatus;
    }).sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || "";
      const dateB = b.updatedAt || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });
  };

  const filteredHistory = getUnifiedHistory();

  // Stats calculation
  const totalRegistered = staffUsers.length;
  const activeWorking = liveStatusList.filter((item) => item.status === "checked-in").length;
  const activeBreak = liveStatusList.filter((item) => item.status === "on-break").length;
  const checkedOut = liveStatusList.filter((item) => item.status === "checked-out").length;
  const presentCount = activeWorking + activeBreak;
  const absentCount = Math.max(0, totalRegistered - presentCount);

  // Late arrivals (checked in > shift start + 15 mins)
  const getLateArrivalsCount = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter(l => l.date === todayStr);
    let count = 0;
    todayLogs.forEach(log => {
      const user = users.find(u => u.uid === log.userId);
      if (user && user.shiftStart && log.checkInTime) {
        const checkInDate = new Date(log.checkInTime);
        const [shiftH, shiftM] = user.shiftStart.split(":").map(Number);
        const checkInMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();
        const shiftMinutes = shiftH * 60 + shiftM;
        if (checkInMinutes > shiftMinutes + 15) {
          count++;
        }
      }
    });
    return count;
  };

  const lateArrivalsCount = getLateArrivalsCount();

  // Leave Requests actions
  const handleApproveLeave = async (id, name, comment) => {
    try {
      await updateLeaveRequest(id, "approved", comment);
      showToast(`Leave request approved for ${name}.`, "success");
      setLeaveRequests(prev => prev.filter(r => r.id !== id));
      setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved", managerComment: comment, rejectionReason: comment } : r));
      setManagerCommentInput("");
      setSelectedRequestId(null);
      loadDirectoryData();
    } catch (err) {
      showToast(err.message || "Failed to approve leave request.", "error");
    }
  };

  const handleRejectLeave = async (id, name, comment) => {
    try {
      await updateLeaveRequest(id, "rejected", comment);
      showToast(`Leave request rejected for ${name}.`, "error");
      setLeaveRequests(prev => prev.filter(r => r.id !== id));
      setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected", managerComment: comment, rejectionReason: comment } : r));
      setManagerCommentInput("");
      setSelectedRequestId(null);
      loadDirectoryData();
    } catch (err) {
      showToast(err.message || "Failed to reject leave request.", "error");
    }
  };

  // Regularization Requests actions
  const handleApproveReg = async (id, name, comment) => {
    try {
      await updateRegularizationRequest(id, "approved", comment);
      showToast(`Regularization request approved for ${name}.`, "success");
      setRegularizationRequests(prev => prev.filter(r => r.id !== id));
      setAllRegularizationRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved", managerComment: comment, rejectionReason: comment } : r));
      setRegManagerCommentInput("");
      setSelectedRegRequestId(null);
    } catch (err) {
      showToast(err.message || "Failed to approve regularization request.", "error");
    }
  };

  const handleRejectReg = async (id, name, comment) => {
    try {
      await updateRegularizationRequest(id, "rejected", comment);
      showToast(`Regularization request rejected for ${name}.`, "error");
      setRegularizationRequests(prev => prev.filter(r => r.id !== id));
      setAllRegularizationRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected", managerComment: comment, rejectionReason: comment } : r));
      setRegManagerCommentInput("");
      setSelectedRegRequestId(null);
    } catch (err) {
      showToast(err.message || "Failed to reject regularization request.", "error");
    }
  };

  // Asset Management Handlers
  const handleOpenAssignAssetsModal = () => {
    setAssignAssetsTargetUser("");
    setAssignAssetsSelectedIds([]);
    setAssignAssetsDate(new Date().toISOString().split("T")[0]);
    const currentIsAuth = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");
    setAssignAssetsAuthority(currentIsAuth ? currentUser.uid : "");
    setShowAssignAssetsModal(true);
  };

  const handleAssignAssetsSubmit = async (e) => {
    e.preventDefault();
    if (!assignAssetsTargetUser) {
      return showToast("Please select an employee.", "warning");
    }
    if (assignAssetsSelectedIds.length === 0) {
      return showToast("Please select at least one asset to assign.", "warning");
    }
    if (!assignAssetsAuthority) {
      return showToast("Please select the assigning authority.", "warning");
    }

    const targetUser = users.find(u => u.uid === assignAssetsTargetUser);
    if (!targetUser) return;

    let authorityName = "";
    const foundAuth = users.find(u => u.uid === assignAssetsAuthority);
    if (foundAuth) {
      authorityName = foundAuth.name;
    } else if (currentUser && currentUser.uid === assignAssetsAuthority) {
      authorityName = currentUser.name;
    }

    setAssignAssetsLoading(true);
    try {
      for (const assetId of assignAssetsSelectedIds) {
        const originalAsset = assets.find(a => a.id === assetId);
        if (originalAsset) {
          const updatedAssetData = {
            ...originalAsset,
            status: "Assigned",
            assignedUserId: targetUser.uid,
            assignedUserName: targetUser.name,
            assignedDate: assignAssetsDate,
            assigningAuthorityId: assignAssetsAuthority,
            assigningAuthorityName: authorityName
          };
          await updateAsset(assetId, updatedAssetData);
        }
      }
      showToast(`Successfully assigned ${assignAssetsSelectedIds.length} asset(s) to ${targetUser.name}.`, "success");
      setShowAssignAssetsModal(false);
      setAssignAssetsTargetUser("");
      setAssignAssetsSelectedIds([]);
      setAssignAssetsAuthority("");
    } catch (err) {
      showToast(err.message || "Failed to assign assets.", "error");
    } finally {
      setAssignAssetsLoading(false);
    }
  };

  const canEditAsset = (asset) => {
    if (!currentUser) return false;
    
    // Super Admin (main admin) can always edit everything
    if (currentUser.role === "superadmin" || currentUser.email === "admin@teamcarrezza.com" || (currentUser.name || "").toLowerCase().includes("super admin")) {
      return true;
    }
    
    // System Admins can edit assets globally
    if ((currentUser.name || "").toLowerCase().includes("system admin") || currentUser.role === "admin") {
      return true;
    }
    
    // If the asset has an assigning authority set:
    if (asset.assigningAuthorityId) {
      // Only that specific authority can edit it, along with the admins above.
      return currentUser.uid === asset.assigningAuthorityId;
    }
    
    return false;
  };

  const handleOpenAddAssetModal = () => {
    setIsEditingAsset(false);
    setSelectedAssetId(null);
    setAssetFormName("");
    setAssetFormCategory(["Laptop"]);
    setAssetFormSerial("");
    setAssetFormStatus("Available");
    setAssetFormAssignedUser("");
    setAssetFormAssignedDate(new Date().toISOString().split("T")[0]);
    setAssetFormAssigningAuthority("");
    setShowCategoryDropdown(false);
    setShowAssetModal(true);
  };

  const handleOpenEditAssetModal = (asset) => {
    if (!canEditAsset(asset)) {
      return showToast("You do not have permission to edit this asset's details.", "error");
    }
    setIsEditingAsset(true);
    setSelectedAssetId(asset.id);
    setAssetFormName(asset.name || "");
    
    // Support category as both string (existing data) and array (new multi-select model)
    const rawCat = asset.category;
    let initialCategories = ["Laptop"];
    if (Array.isArray(rawCat)) {
      initialCategories = rawCat;
    } else if (typeof rawCat === "string" && rawCat.trim() !== "") {
      initialCategories = rawCat.split(",").map(c => c.trim());
    }
    setAssetFormCategory(initialCategories);
    
    setAssetFormSerial(asset.serialNumber || "");
    setAssetFormStatus(asset.status || "Available");
    setAssetFormAssignedUser(asset.assignedUserId || "");
    setAssetFormAssignedDate(asset.assignedDate || new Date().toISOString().split("T")[0]);
    setAssetFormAssigningAuthority(asset.assigningAuthorityId || "");
    setShowCategoryDropdown(false);
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!assetFormName.trim() || !assetFormSerial.trim()) {
      return showToast("Please fill in Asset Name and Serial Number.", "warning");
    }
    if (assetFormCategory.length === 0) {
      return showToast("Please select at least one category.", "warning");
    }
    
    // Find assigned user details if set
    let assignedUserName = "";
    if (assetFormAssignedUser) {
      const foundUser = users.find(u => u.uid === assetFormAssignedUser);
      if (foundUser) {
        assignedUserName = foundUser.name;
      }
    }

    // Find assigning authority details if set
    let authorityName = "";
    if (assetFormAssigningAuthority) {
      const foundAuth = users.find(u => u.uid === assetFormAssigningAuthority);
      if (foundAuth) {
        authorityName = foundAuth.name;
      } else if (currentUser && currentUser.uid === assetFormAssigningAuthority) {
        authorityName = currentUser.name;
      }
    }

    const assetData = {
      name: assetFormName.trim(),
      category: assetFormCategory,
      serialNumber: assetFormSerial.trim(),
      status: assetFormStatus,
      assignedUserId: assetFormAssignedUser || null,
      assignedUserName: assignedUserName || null,
      assignedDate: (assetFormStatus === "Assigned" || assetFormAssignedUser) ? assetFormAssignedDate : null,
      assigningAuthorityId: (assetFormStatus === "Assigned" || assetFormAssignedUser) ? assetFormAssigningAuthority : null,
      assigningAuthorityName: (assetFormStatus === "Assigned" || assetFormAssignedUser) ? authorityName : null,
      companyId: currentUser.companyId
    };

    setAssetLoading(true);
    try {
      if (isEditingAsset) {
        await updateAsset(selectedAssetId, assetData);
        showToast("Asset updated successfully.", "success");
      } else {
        await addAsset(assetData);
        showToast("Asset added successfully.", "success");
      }
      setShowAssetModal(false);
    } catch (err) {
      showToast(err.message || "Failed to save asset.", "error");
    } finally {
      setAssetLoading(false);
    }
  };

  const handleDeleteAssetClick = (id, name) => {
    const asset = assets.find(a => a.id === id);
    if (asset && !canEditAsset(asset)) {
      return showToast("You do not have permission to delete this asset.", "error");
    }
    showConfirm("Delete Asset", `Are you sure you want to delete ${name}? This action cannot be undone.`, async () => {
      try {
        await deleteAsset(id);
        showToast("Asset deleted successfully.", "success");
      } catch (err) {
        showToast(err.message || "Failed to delete asset.", "error");
      }
    });
  };

  const handleExportAssetsExcel = () => {
    if (assets.length === 0) {
      return showToast("No assets to export.", "warning");
    }

    const tableData = assets.map((a) => ({
      "Asset Name": a.name || "",
      "Category": Array.isArray(a.category) ? a.category.join(", ") : (a.category || ""),
      "Serial Number": a.serialNumber || "",
      "Status": a.status || "",
      "Assigned To": a.assignedUserName || "Unassigned",
      "Date Assigned": a.assignedDate || "N/A",
      "Assigning Authority": a.assigningAuthorityName || "N/A",
      "Date Registered": a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""
    }));

    const headers = Object.keys(tableData[0]);
    const aoaData = [headers, ...tableData.map(item => headers.map(h => item[h]))];

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets Inventory");

    const max_len = {};
    aoaData.forEach(row => {
      row.forEach((cell, idx) => {
        const cellLen = cell ? String(cell).length : 5;
        max_len[idx] = Math.max(max_len[idx] || 0, cellLen);
      });
    });
    ws["!cols"] = Object.keys(max_len).map((colIdx) => ({ wch: max_len[colIdx] + 3 }));

    XLSX.writeFile(wb, `Organization_Assets_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    showToast("Excel assets registry generated successfully.", "success");
  };

  const handleExportAssetsPDF = async () => {
    if (assets.length === 0) {
      return showToast("No assets to export.", "warning");
    }

    const doc = new jsPDF("l", "mm", "a4");
    const titleText = "Organization Assets Report";
    const subtitleText = `Scope: Active Hardware & Devices Inventory | Generated: ${new Date().toLocaleString()} | Total Count: ${assets.length} item(s)`;
    let currentY = await addStandardPDFHeader(doc, titleText, subtitleText, true);

    const headers = ["Asset Details", "Category", "Serial Number", "Status", "Assigned To", "Date Assigned", "Authority"];
    const colWidths = [45, 30, 40, 25, 45, 35, 45];
    
    doc.setFillColor(0, 97, 224);
    doc.rect(14, currentY - 5, 266, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    
    let xOffset = 14;
    headers.forEach((h, idx) => {
      doc.text(h, xOffset + 2, currentY - 0.5);
      xOffset += colWidths[idx];
    });
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    
    assets.forEach((asset, index) => {
      if (currentY > 185) {
        doc.addPage();
        currentY = 25;
        
        doc.setFillColor(0, 97, 224);
        doc.rect(14, currentY - 5, 266, 7, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        
        xOffset = 14;
        headers.forEach((h, idx) => {
          doc.text(h, xOffset + 2, currentY - 0.5);
          xOffset += colWidths[idx];
        });
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY - 4.5, 266, 6, "F");
      }
      
      const nameVal = asset.name || "—";
      const catVal = Array.isArray(asset.category) ? asset.category.join(", ") : (asset.category || "—");
      const serialVal = asset.serialNumber || "—";
      const statusVal = asset.status || "—";
      const assignedVal = asset.assignedUserName || "Unassigned";
      const dateVal = asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : "—";
      const authVal = asset.assigningAuthorityName || "—";
      
      xOffset = 14;
      
      doc.text(nameVal.substring(0, 24), xOffset + 2, currentY);
      xOffset += colWidths[0];
      
      doc.text(catVal, xOffset + 2, currentY);
      xOffset += colWidths[1];
      
      doc.text(serialVal.substring(0, 20), xOffset + 2, currentY);
      xOffset += colWidths[2];
      
      doc.text(statusVal, xOffset + 2, currentY);
      xOffset += colWidths[3];
      
      doc.text(assignedVal.substring(0, 24), xOffset + 2, currentY);
      xOffset += colWidths[4];
      
      doc.text(dateVal, xOffset + 2, currentY);
      xOffset += colWidths[5];
      
      doc.text(authVal.substring(0, 24), xOffset + 2, currentY);
      
      currentY += 6;
    });
    
    addPDFFooter(doc);
    doc.save(`Assets_Inventory_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("PDF report downloaded successfully.", "success");
  };

  // Notice Board / Rules & Leaves Handlers
  const handleSaveRules = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateAttendanceRules(rulesInput, currentUser?.companyId);
      showToast("Attendance rules updated successfully.", "success");
    } catch (err) {
      showToast(err.message || "Failed to update attendance rules.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (payrollData.length === 0) return showToast("No employees to process.", "warning");
    
    setActionLoading(true);
    try {
      const promises = payrollData.map(user => 
        saveEmployeePayroll(currentUser.companyId, user.uid, {
          month: payrollMonth,
          year: payrollYear,
          grossSalary: user.gross,
          basic: user.basic,
          hra: user.hra,
          special: user.special,
          pf: user.pf,
          esi: user.esi,
          pt: user.pt,
          tds: user.tds,
          lopAmount: user.lopAmount || 0,
          lopsDays: user.lopsDays || 0,
          net: user.net,
          paidDays: user.paidDays || 0,
          workingDays: user.workingDays || 30
        })
      );
      await Promise.all(promises);
      showToast(`Successfully processed payroll for ${payrollData.length} employees`, "success");
    } catch (err) {
      showToast("Failed to process payroll.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ["Email", "Gross Salary", "Paid Days"]
    ];
    // Add active users to template
    staffUsers.forEach(u => {
      wsData.push([u.email, u.grossSalary || 0, u.paidDays || 30]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Template");
    XLSX.writeFile(wb, `Payroll_Template_${payrollMonth}_${payrollYear}.xlsx`);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      const workingDays = companyPayrollSettings?.workingDays || 30;

      // Internal calculate function
      const calculatePayroll = (gross, paidDays, wDays) => {
        const lopsDays = Math.max(0, wDays - paidDays);
        const actualGross = (gross / wDays) * paidDays;
        const lopAmount = gross - actualGross;

        const basic = gross * 0.5;
        const hra = basic * 0.4;
        const special = gross - basic - hra;
        
        const actualBasic = actualGross * 0.5;
        const pf = companyPayrollSettings?.pf ? actualBasic * 0.12 : 0;
        const esi = (companyPayrollSettings?.esi && actualGross <= 21000) ? actualGross * 0.0075 : 0;
        
        const getPTDeduction = (g) => {
          if (companyPayrollSettings && !companyPayrollSettings.pt) return 0;
          if (g <= 21000) return 0;
          if (g <= 30000) return Math.round((180 / 6) * 100) / 100;
          if (g <= 45000) return Math.round((425 / 6) * 100) / 100;
          if (g <= 60000) return Math.round((930 / 6) * 100) / 100;
          if (g <= 75000) return Math.round((1025 / 6) * 100) / 100;
          return Math.round((1250 / 6) * 100) / 100;
        };
        const pt = getPTDeduction(actualGross);
        const insurance = companyPayrollSettings?.insurance ? Number(companyPayrollSettings.insuranceAmount || 0) : 0;

        const tds = actualGross > 50000 ? (actualGross - pf - pt - insurance) * 0.05 : 0;
        const net = actualGross - (pf + esi + pt + tds + insurance);
        return { basic, hra, special, pf, esi, pt, tds, insurance, net, actualGross, lopAmount, lopsDays };
      };

      const promises = [];
      for (let row of rows) {
        const email = row["Email"];
        const grossStr = row["Gross Salary"];
        const paidStr = row["Paid Days"];
        
        if (!email) continue;
        const user = staffUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) continue;

        const gross = Number(grossStr) || 0;
        const paidDays = Number(paidStr) || workingDays;

        // Calculate new payroll
        const calc = calculatePayroll(gross, paidDays, workingDays);

        // Save directly to payroll data for selected month/year
        const payrollRecord = {
          month: payrollMonth,
          year: payrollYear,
          workingDays,
          paidDays,
          grossSalary: gross,
          ...calc
        };

        promises.push(saveEmployeePayroll(currentUser.companyId, user.uid, payrollRecord));
      }
      
      if(promises.length === 0) {
        showToast("No valid rows found to import.", "warning");
      } else {
        await Promise.all(promises);
        showToast("Payroll imported and saved successfully!", "success");
      }
    } catch (err) {
      showToast("Error importing Excel: " + err.message, "error");
    } finally {
      setActionLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleBulkExportPDF = async (filteredData) => {
    if (!filteredData || filteredData.length === 0) {
      return showToast("No records to export.", "warning");
    }
    setActionLoading(true);
    const element = document.getElementById('bulk-payslip-content');
    const opt = {
      margin:       0,
      filename:     `Bulk_Payslips_${payrollMonth}_${payrollYear}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      showToast("Bulk Payslips Exported!", "success");
      setActionLoading(false);
    }).catch(() => {
      showToast("Failed to export bulk payslips.", "error");
      setActionLoading(false);
    });
  };

  const handlePublishPaidLeave = async (e) => {
    e.preventDefault();
    if (!leaveTitle || !leaveStartDate || !leaveEndDate || !leaveDesc) {
      return showToast("Please fill in all fields for paid leave.", "warning");
    }
    const startD = new Date(leaveStartDate);
    const endD = new Date(leaveEndDate);
    if (endD < startD) {
      return showToast("End Date cannot be before Start Date.", "warning");
    }
    setActionLoading(true);
    try {
      await uploadPaidLeave(leaveTitle, leaveStartDate, leaveEndDate, leaveDesc, leaveStatus, currentUser.companyId);
      showToast(`Paid leave "${leaveTitle}" published successfully.`, "success");
      setLeaveTitle("");
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveStatus("active");
      setLeaveDesc("");
    } catch (err) {
      showToast(err.message || "Failed to publish paid leave.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePaidLeaveStatus = async (id, title, currentStatus) => {
    const nextStatus = (currentStatus || "active") === "inactive" ? "active" : "inactive";
    try {
      await updatePaidLeaveStatus(id, nextStatus);
      showToast(`Paid leave "${title}" status updated to ${nextStatus}.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update paid leave status.", "error");
    }
  };

  const handleRemovePaidLeave = (pl) => {
    setSelectedPaidLeave(pl);
    setShowDeletePaidLeaveConfirm(true);
  };

  const confirmDeletePaidLeave = async () => {
    if (!selectedPaidLeave) return;
    setActionLoading(true);
    try {
      await deletePaidLeave(selectedPaidLeave.id);
      showToast(`Paid leave "${selectedPaidLeave.title}" deleted successfully.`, "success");
      setShowDeletePaidLeaveConfirm(false);
      setSelectedPaidLeave(null);
    } catch (err) {
      showToast(err.message || "Failed to delete paid leave.", "error");
    } finally {
      setActionLoading(false);
    }
  };


  // ----------------------------------------------------
  // REPORT EXPORT HANDLERS
  // ----------------------------------------------------

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      return showToast("No records to export.", "warning");
    }

    const aoaData = [
      ["CARREZZA GLOBAL SOLUTIONS PVT LTD"],
      ["Corporate Attendance & Location Registry Report"],
      [`Scope: All Employees`, `Record Count: ${filteredLogs.length}`],
      [`Generated On: ${new Date().toLocaleString()}`],
      [], // Blank row
      [
        "Date", 
        "Employee Name", 
        "Department", 
        "Program Type", 
        "Check-In Time", 
        "Check-In Location (Name)",
        "Check-In GPS",
        "Check-Out Time", 
        "Check-Out Location (Name)",
        "Check-Out GPS",
        "Break 1", 
        "Break 2", 
        "Active Minutes", 
        "Active Hours"
      ]
    ];

    filteredLogs.forEach((log) => {
      const shorts = log.breaks?.filter(b => b.type === "short").length || 0;
      const longs = log.breaks?.filter(b => b.type === "long").length || 0;
      aoaData.push([
        log.date,
        log.userName,
        log.userDept || "—",
        log.programType || "—",
        log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "—",
        getLocationDisplayName(log.checkInLocation),
        formatGpsCoords(log.checkInLocation),
        log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "—",
        getLocationDisplayName(log.checkOutLocation),
        formatGpsCoords(log.checkOutLocation),
        shorts,
        longs,
        log.totalWorkingMinutes || 0,
        ((log.totalWorkingMinutes || 0) / 60).toFixed(2)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Registry");
    
    // Auto-fit columns
    const max_len = {};
    aoaData.forEach((row) => {
      row.forEach((val, colIdx) => {
        const valStr = String(val || "");
        max_len[colIdx] = Math.max(max_len[colIdx] || 10, valStr.length);
      });
    });
    ws["!cols"] = Object.keys(max_len).map((colIdx) => ({ wch: max_len[colIdx] + 3 }));

    XLSX.writeFile(wb, `Corporate_Attendance_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    showToast("Excel spreadsheet generated successfully.", "success");
  };

  const handleExportPDF = async () => {
    if (filteredLogs.length === 0) {
      return showToast("No records to export.", "warning");
    }

    const doc = new jsPDF("l", "mm", "a4");
    const titleText = "Corporate Attendance & Location Registry Report";
    const subtitleText = `Generated: ${new Date().toLocaleString()} | Filtered Count: ${filteredLogs.length} record(s)`;
    let currentY = await addStandardPDFHeader(doc, titleText, subtitleText, true);
    
    // Table Headers
    const headers = ["Date", "Name", "Dept", "Check In", "In Location", "Check Out", "Out Location", "Hours"];
    const colWidths = [24, 38, 28, 22, 54, 22, 54, 24];
    
    // Print header background band
    doc.setFillColor(0, 97, 224);
    doc.rect(14, currentY - 5, 266, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    
    let xOffset = 14;
    headers.forEach((h, idx) => {
      doc.text(h, xOffset + 2, currentY - 0.5);
      xOffset += colWidths[idx];
    });
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    
    filteredLogs.forEach((log, index) => {
      if (currentY > 185) {
        doc.addPage();
        currentY = 25;
        
        // Print headers on new page
        doc.setFillColor(0, 97, 224);
        doc.rect(14, currentY - 5, 266, 7, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        
        xOffset = 14;
        headers.forEach((h, idx) => {
          doc.text(h, xOffset + 2, currentY - 0.5);
          xOffset += colWidths[idx];
        });
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
      }
      
      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY - 4.5, 266, 6, "F");
      }
      
      const checkInStr = log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
      const checkOutStr = log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
      
      const inLoc = getLocationDisplayName(log.checkInLocation);
      const outLoc = getLocationDisplayName(log.checkOutLocation);
      const inLocTruncated = inLoc.length > 25 ? inLoc.substring(0, 23) + ".." : inLoc;
      const outLocTruncated = outLoc.length > 25 ? outLoc.substring(0, 23) + ".." : outLoc;

      const hrsStr = `${((log.totalWorkingMinutes || 0) / 60).toFixed(2)} hrs`;

      xOffset = 14;
      doc.text(log.date || "—", xOffset + 2, currentY);
      xOffset += colWidths[0];
      
      const truncatedName = log.userName.length > 18 ? log.userName.substring(0, 16) + ".." : log.userName;
      doc.text(truncatedName, xOffset + 2, currentY);
      xOffset += colWidths[1];
      
      const truncatedDept = (log.userDept || "").length > 13 ? log.userDept.substring(0, 11) + ".." : (log.userDept || "—");
      doc.text(truncatedDept, xOffset + 2, currentY);
      xOffset += colWidths[2];
      
      doc.text(checkInStr, xOffset + 2, currentY);
      xOffset += colWidths[3];
      
      doc.text(inLocTruncated, xOffset + 2, currentY);
      xOffset += colWidths[4];
      
      doc.text(checkOutStr, xOffset + 2, currentY);
      xOffset += colWidths[5];
      
      doc.text(outLocTruncated, xOffset + 2, currentY);
      xOffset += colWidths[6];
      
      doc.setFont("helvetica", "bold");
      doc.text(hrsStr, xOffset + 2, currentY);
      doc.setFont("helvetica", "normal");
      
      currentY += 6;
    });

    addPDFFooter(doc);
    doc.save(`Corporate_Attendance_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("PDF corporate report downloaded successfully.", "success");
  };

  const exportSingleUserExcel = (user) => {
    const userLogs = logs.filter(l => l.userId === user.uid || l.uid === user.uid);
    if (userLogs.length === 0) {
      return showToast(`No attendance logs found for ${user.name}.`, "warning");
    }

    const aoaData = [
      ["CARREZZA GLOBAL SOLUTIONS PVT LTD"],
      [`Attendance & Location History Report for ${user.name}`],
      [`Department: ${user.department || "—"}`, `Email: ${user.email || "—"}`],
      [`Generated On: ${new Date().toLocaleString()}`],
      [], // Blank row
      [
        "Date", 
        "Check-In Time", 
        "Check-In Location (Name)",
        "Check-In GPS",
        "Check-Out Time", 
        "Check-Out Location (Name)",
        "Check-Out GPS",
        "Break 1", 
        "Break 2", 
        "Active Minutes", 
        "Active Hours"
      ]
    ];

    userLogs.forEach((log) => {
      const shorts = log.breaks?.filter(b => b.type === "short").length || 0;
      const longs = log.breaks?.filter(b => b.type === "long").length || 0;
      aoaData.push([
        log.date,
        log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "—",
        getLocationDisplayName(log.checkInLocation),
        formatGpsCoords(log.checkInLocation),
        log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "—",
        getLocationDisplayName(log.checkOutLocation),
        formatGpsCoords(log.checkOutLocation),
        shorts,
        longs,
        log.totalWorkingMinutes || 0,
        ((log.totalWorkingMinutes || 0) / 60).toFixed(2)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    
    // Auto-fit columns
    const max_len = {};
    aoaData.forEach((row) => {
      row.forEach((val, colIdx) => {
        const valStr = String(val || "");
        max_len[colIdx] = Math.max(max_len[colIdx] || 10, valStr.length);
      });
    });
    ws["!cols"] = Object.keys(max_len).map((colIdx) => ({ wch: max_len[colIdx] + 3 }));

    XLSX.writeFile(wb, `Attendance_Report_${user.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
    showToast(`Excel report for ${user.name} generated.`, "success");
  };

  const exportSingleUserPDF = async (user) => {
    const userLogs = logs.filter(l => l.userId === user.uid || l.uid === user.uid);
    if (userLogs.length === 0) {
      return showToast(`No attendance logs found for ${user.name}.`, "warning");
    }

    const doc = new jsPDF("l", "mm", "a4");
    const titleText = `Individual Attendance & Location History for ${user.name} (${user.email})`;
    const subtitleText = `Department: ${user.department || "N/A"} | Generated: ${new Date().toLocaleString()}`;
    let currentY = await addStandardPDFHeader(doc, titleText, subtitleText, true);
    
    // Table Headers
    const headers = ["Date", "Check In", "In Location", "Check Out", "Out Location", "Breaks", "Hours"];
    const colWidths = [28, 24, 60, 24, 60, 45, 25];
    
    // Print header backgrounds
    doc.setFillColor(0, 97, 224);
    doc.rect(14, currentY - 5, 266, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    
    let xOffset = 14;
    headers.forEach((h, idx) => {
      doc.text(h, xOffset + 2, currentY - 0.5);
      xOffset += colWidths[idx];
    });
    
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // Slate 900
    
    userLogs.forEach((log, index) => {
      if (currentY > 185) {
        doc.addPage();
        currentY = 25;
        
        // Print headers on new page
        doc.setFillColor(0, 97, 224);
        doc.rect(14, currentY - 5, 266, 7, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        
        xOffset = 14;
        headers.forEach((h, idx) => {
          doc.text(h, xOffset + 2, currentY - 0.5);
          xOffset += colWidths[idx];
        });
        currentY += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
      }
      
      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // light slate 50
        doc.rect(14, currentY - 4.5, 266, 6, "F");
      }
      
      const checkInStr = log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
      const checkOutStr = log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
      
      const inLoc = getLocationDisplayName(log.checkInLocation);
      const outLoc = getLocationDisplayName(log.checkOutLocation);
      const inLocTrunc = inLoc.length > 28 ? inLoc.substring(0, 26) + ".." : inLoc;
      const outLocTrunc = outLoc.length > 28 ? outLoc.substring(0, 26) + ".." : outLoc;

      const shorts = log.breaks?.filter(b => b.type === "short").length || 0;
      const longs = log.breaks?.filter(b => b.type === "long").length || 0;
      const breaksStr = `${shorts} short, ${longs} long`;
      
      const hrsStr = `${((log.totalWorkingMinutes || 0) / 60).toFixed(2)} hrs`;

      xOffset = 14;
      doc.text(log.date || "—", xOffset + 2, currentY);
      xOffset += colWidths[0];
      
      doc.text(checkInStr, xOffset + 2, currentY);
      xOffset += colWidths[1];
      
      doc.text(inLocTrunc, xOffset + 2, currentY);
      xOffset += colWidths[2];

      doc.text(checkOutStr, xOffset + 2, currentY);
      xOffset += colWidths[3];
      
      doc.text(outLocTrunc, xOffset + 2, currentY);
      xOffset += colWidths[4];
      
      doc.text(breaksStr, xOffset + 2, currentY);
      xOffset += colWidths[5];
      
      doc.setFont("helvetica", "bold");
      doc.text(hrsStr, xOffset + 2, currentY);
      doc.setFont("helvetica", "normal");
      
      currentY += 6;
    });

    addPDFFooter(doc);
    doc.save(`Attendance_Report_${user.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast(`PDF report for ${user.name} downloaded.`, "success");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "checked-in":
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">ON-TIME</span>;
      case "on-break":
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">ON BREAK</span>;
      case "checked-out":
        return <span className="bg-slate-500/10 text-text-sec border border-border-card text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">SHIFT ENDED</span>;
      case "not-started":
      default:
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">ABSENT</span>;
    }
  };

  // ----------------------------------------------------
  // ANALYTICS CALCULATIONS
  // ----------------------------------------------------

  const getDailyAttendanceStats = () => {
    const datesList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      datesList.push(d.toISOString().split("T")[0]);
    }
    
    return datesList.map(dateStr => {
      const count = logs.filter(l => l.date === dateStr && l.checkInTime).length;
      const formattedDate = new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
      return { dateLabel: formattedDate, date: dateStr, count };
    });
  };

  const getDeptAttendanceRates = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const depts = departments.length > 0 ? departments : ["Engineering", "HR", "Marketing", "Design"];
    
    return depts.map(dept => {
      const totalUsersInDept = staffUsers.filter(u => u.department === dept).length;
      const checkedInToday = logs.filter(l => l.date === todayStr && l.userDept === dept && l.checkInTime).length;
      const rate = totalUsersInDept > 0 ? Math.round((checkedInToday / totalUsersInDept) * 100) : 0;
      return { department: dept, total: totalUsersInDept, present: checkedInToday, rate };
    });
  };

  const getEmployeeWorkingStats = () => {
    const userHrs = {};
    logs.forEach(l => {
      if (l.totalWorkingMinutes) {
        if (!userHrs[l.userId]) {
          userHrs[l.userId] = { name: l.userName, totalMins: 0, count: 0 };
        }
        userHrs[l.userId].totalMins += l.totalWorkingMinutes;
        userHrs[l.userId].count += 1;
      }
    });
    
    return Object.values(userHrs).map(u => {
      const avgMins = u.count > 0 ? u.totalMins / u.count : 0;
      return { name: u.name, avgHours: parseFloat((avgMins / 60).toFixed(1)) };
    }).sort((a, b) => b.avgHours - a.avgHours).slice(0, 5);
  };

  // Add Employee handler
  const handleAddNewEmployee = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newDept || !newShiftStart || !newShiftEnd) {
      return showToast("Please fill in all fields.", "warning");
    }

    setActionLoading(true);
    try {
      
      const roleStr = newRole === "Admin" ? "admin" : (newRole === "System Admin" ? "system admin" : "employee");
      const isPm = newRole === "Project Manager" || newRole === "Admin" || newRole === "System Admin";
      
      const additionalData = {
        firstName: newFirstName, lastName: newLastName, personalEmail: newPersonalEmail,
        personalMobileNumber: newPersonalMobileNumber, gender: newGender, maritalStatus: newMaritalStatus,
        employeeStatus: newEmployeeStatus, sourceOfHire: newSourceOfHire, currentExperience: newCurrentExperience,
        reportingManager: newReportingManager, uan: newUan, pan: newPan, aadharNum: newAadharNum,
        bankAcNo: newBankAcNo, ifscCode: newIfscCode, permanentAddress: newPermanentAddress,
        specialization: newSpecialization, instituteName: newInstituteName, yearOfCompletion: newYearOfCompletion,
        dateOfExit: newDateOfExit, photo: newPhoto, age: newAge, employeeId: newEmployeeId,
        location: newLocation, unit: newUnit, grade: newGrade, costCenter: newCostCenter, pfNo: newPfNo
      };
      
      await registerUser(newName, newDept, newProgram, newEmail, "Welcome@123", newShiftStart, newShiftEnd, newAnnual, newSick, newCasual, newDob, newJoiningDate, newProject.split(',').map(s=>s.trim()).filter(Boolean), [], newJobType, newDesignation, isPm, newEmployeeId, "", roleStr, currentUser.companyId, additionalData);
      showToast(`Employee ${newName} registered successfully. Default password is 'Welcome@123'.`, "success");
      setShowAddModal(false);
      
      // Reset fields
      setNewName("");
      setNewEmail("");
      setNewDept("");
      setNewShiftType("Morning");
      setNewShiftStart("09:00");
      setNewShiftEnd("18:00");
      setNewAnnual(25);
      setNewSick(10);
      setNewCasual(6);
      setNewDob("");
      setNewJoiningDate("");
      setNewProject("");
      setNewRole("Employee");
      setNewJobType("Full-time");
      setNewDesignation("");
      setNewFirstName(""); setNewLastName(""); setNewPersonalEmail(""); setNewPersonalMobileNumber("");
      setNewGender(""); setNewMaritalStatus("Single"); setNewEmployeeStatus("Active"); setNewSourceOfHire("");
      setNewCurrentExperience(""); setNewReportingManager(""); setNewUan(""); setNewPan("");
      setNewAadharNum(""); setNewBankAcNo(""); setNewIfscCode(""); setNewPermanentAddress("");
      setNewSpecialization(""); setNewInstituteName(""); setNewYearOfCompletion(""); setNewDateOfExit("");
      setNewLocation(""); setNewUnit(""); setNewGrade(""); setNewCostCenter(""); setNewPfNo("");
      setNewEmployeeId(""); setNewPhoto(""); setNewAge(""); setNewAddTab("Personal");
      
      // Refresh list
      loadDirectoryData();
    } catch (err) {
      showToast(err.message || "Failed to add employee.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name || "");
    setEditDept(user.department || "");
    setEditShiftStart(user.shiftStart || "10:00");
    setEditShiftEnd(user.shiftEnd || "19:00");
    setEditAnnual(user.annualLeaves !== undefined ? user.annualLeaves : 25);
    setEditSick(user.sickLeaves !== undefined ? user.sickLeaves : 10);
    setEditCasual(user.casualLeaves !== undefined ? user.casualLeaves : 6);
    setEditDob(user.dob || "");
    setEditJoiningDate(user.joiningDate || "");
    setEditProject(user.projects ? user.projects.join(', ') : (user.project || ""));
    setEditJobType(user.jobType || "Full-time");
    setEditDesignation(user.designation || "");
    setEditProgram(user.programType || "Internship");
    setEditTasks(user.tasks || []);
    setEditEmployeeId(user.employeeId || "");
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditPersonalEmail(user.personalEmail || "");
    setEditPersonalMobileNumber(user.personalMobileNumber || "");
    setEditGender(user.gender || "");
    setEditMaritalStatus(user.maritalStatus || "Single");
    setEditEmployeeStatus(user.employeeStatus || "Active");
    setEditSourceOfHire(user.sourceOfHire || "");
    setEditCurrentExperience(user.currentExperience || "");
    setEditReportingManager(user.reportingManager || "");
    setEditUan(user.uan || "");
    setEditPan(user.pan || "");
    setEditAadharNum(user.aadharNum || "");
    setEditBankAcNo(user.bankAcNo || "");
    setEditIfscCode(user.ifscCode || "");
    setEditPermanentAddress(user.permanentAddress || "");
    setEditSpecialization(user.specialization || "");
    setEditInstituteName(user.instituteName || "");
    setEditYearOfCompletion(user.yearOfCompletion || "");
    setEditDateOfExit(user.dateOfExit || "");
    setEditPhoto(user.photo || "");
    setEditAge(user.age || "");
    setEditLocation(user.location || "");
    setEditUnit(user.unit || "");
    setEditGrade(user.grade || "");
    setEditCostCenter(user.costCenter || "");
    setEditPfNo(user.pfNo || "");
    setEditAllowManualCheckIn(user.allowManualCheckIn || false);
    setEditTab("Personal");
    
    let currentRole = "Employee";
    if (user.role === "admin") currentRole = "Admin";
    else if (user.role === "system admin" || user.role === "systemadmin") currentRole = "System Admin";
    else if (user.isProjectManager) currentRole = "Project Manager";
    setEditRole(currentRole);
    setShowEditModal(true);
  };

  const openDeleteConfirm = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleToggleUserStatus = async (user, e) => {
    e.stopPropagation(); // prevent row click
    if (!can("update", "EmployeeManagement")) {
      return showToast("You do not have permission to change user status.", "error");
    }
    const currentStatus = user.status;
    const newStatus = (currentStatus === "inactive") ? "offline" : "inactive";
    const newEmployeeStatus = (currentStatus === "inactive") ? "Active" : "Inactive";
    
    setActionLoading(true);
    try {
      await updateUserAccountStatus(user.uid, newStatus);
      await updateUserRecord(user.uid, user.name, user.department, user.programType, user.shiftStart, user.shiftEnd, user.annualLeaves, user.sickLeaves, user.casualLeaves, undefined, user.dob, user.joiningDate, user.projects, user.tasks, user.jobType, user.designation, user.isProjectManager, user.employeeId, { employeeStatus: newEmployeeStatus });
      
      setUsers(prev => prev.map(u => u.uid === user.uid ? {
        ...u,
        status: newStatus,
        employeeStatus: newEmployeeStatus
      } : u));
      
      showToast(`${user.name} is now ${newEmployeeStatus}.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to update status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editName || !editDept || !editShiftStart || !editShiftEnd) {
      return showToast("Please fill in all fields.", "warning");
    }
    
    setActionLoading(true);
    try {
      const additionalData = {
        firstName: editFirstName, lastName: editLastName, personalEmail: editPersonalEmail,
        personalMobileNumber: editPersonalMobileNumber, gender: editGender, maritalStatus: editMaritalStatus,
        employeeStatus: editEmployeeStatus, sourceOfHire: editSourceOfHire, currentExperience: editCurrentExperience,
        reportingManager: editReportingManager, uan: editUan, pan: editPan, aadharNum: editAadharNum,
        bankAcNo: editBankAcNo, ifscCode: editIfscCode, permanentAddress: editPermanentAddress,
        specialization: editSpecialization, instituteName: editInstituteName, yearOfCompletion: editYearOfCompletion,
        dateOfExit: editDateOfExit, photo: editPhoto, age: editAge,
        location: editLocation, unit: editUnit, grade: editGrade, costCenter: editCostCenter, pfNo: editPfNo,
        role: editRole === "Admin" ? "admin" : (editRole === "System Admin" ? "system admin" : "employee"),
        allowManualCheckIn: editAllowManualCheckIn
      };

      if (editEmployeeStatus === "Inactive" || editEmployeeStatus === "Terminated") {
        await updateUserAccountStatus(selectedUser.uid, "inactive");
      } else if (selectedUser.status === "inactive") {
        await updateUserAccountStatus(selectedUser.uid, "offline");
      }

      await updateUserRecord(
        selectedUser.uid, 
        editName, 
        editDept, 
        editProgram, 
        editShiftStart, 
        editShiftEnd,
        editAnnual,
        editSick,
        editCasual,
        undefined, // avatar
        editDob,
        editJoiningDate,
        editProject.split(',').map(s=>s.trim()).filter(Boolean),
        editTasks,
        editJobType,
        editDesignation,
        editRole === "Project Manager" || editRole === "Admin" || editRole === "System Admin",
        editEmployeeId,
        additionalData
      );
      
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? {
        ...u,
        name: editName,
        department: editDept,
        programType: editProgram,
        shiftStart: editShiftStart,
        shiftEnd: editShiftEnd,
        annualLeaves: editAnnual,
        sickLeaves: editSick,
        casualLeaves: editCasual,
        dob: editDob,
        joiningDate: editJoiningDate,
        projects: editProject.split(',').map(s=>s.trim()).filter(Boolean),
        tasks: editTasks,
        jobType: editJobType,
        designation: editDesignation,
        role: editRole === "Admin" ? "admin" : (editRole === "System Admin" ? "system admin" : "employee"),
        isProjectManager: editRole === "Project Manager" || editRole === "Admin" || editRole === "System Admin",
        status: (editEmployeeStatus === "Inactive" || editEmployeeStatus === "Terminated") ? "inactive" : (u.status === "inactive" ? "offline" : u.status),
        ...additionalData
      } : u));
      
      showToast("User profile updated successfully.", "success");
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      showToast(err.message || "Failed to update user profile.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await deleteUserRecord(selectedUser.uid);
      setUsers(prev => prev.filter(u => u.uid !== selectedUser.uid));
      showToast("User profile deleted successfully.", "success");
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    } catch (err) {
      showToast(err.message || "Failed to delete user profile.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-8 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 rounded skeleton" />
          <div className="h-4 w-96 rounded skeleton" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-24 rounded-[20px] skeleton" />
          <div className="h-24 rounded-[20px] skeleton" />
          <div className="h-24 rounded-[20px] skeleton" />
          <div className="h-24 rounded-[20px] skeleton" />
        </div>

        {/* Split Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[420px] rounded-[24px] skeleton" />
          <div className="h-[420px] rounded-[24px] skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8 w-full max-w-[1400px] mx-auto text-left">
      
      {/* ------------------ VIEW 1: ADMIN PANEL / LIVE MONITORING ------------------ */}
      {(activeTab === "live" && (isAdminUser || can("read", "LiveActivity"))) && (() => {
        const liveStartIndex = (livePage - 1) * rowsPerPage;
        const paginatedLiveStatus = liveStatusList.slice(liveStartIndex, liveStartIndex + rowsPerPage);
        const liveTotalPages = Math.ceil(liveStatusList.length / rowsPerPage) || 1;

        return (
          <>
            {/* Header Description */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Admin Monitoring Dashboard</h1>
            <p className="text-sm text-text-sec mt-1">Real-time workforce intelligence and management.</p>
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex flex-col justify-between shadow-sm min-h-[130px]">
              <div className="flex items-start justify-between w-full">
                <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Users size={22} />
                </div>
                <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  {staffUsers.filter(u => new Date(u.createdAt) >= new Date(new Date().setDate(new Date().getDate() - 30))).length} New This Month
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">TOTAL EMPLOYEES</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1">{totalRegistered}</span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex flex-col justify-between shadow-sm min-h-[130px] border-l-4 border-l-brand-primary">
              <div className="flex items-start justify-between w-full">
                <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Users size={22} />
                </div>
                <span className="bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full text-[10px] font-bold">
                  {totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0}% Active
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">CURRENTLY PRESENT</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1">{presentCount}</span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex flex-col justify-between shadow-sm min-h-[130px]">
              <div className="flex items-start justify-between w-full">
                <div className="w-12 h-12 rounded-[14px] bg-brand-warning/10 text-brand-warning flex items-center justify-center">
                  <Clock size={22} />
                </div>
                <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  Today
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">LATE ARRIVALS</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1">{lateArrivalsCount}</span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex flex-col justify-between shadow-sm min-h-[130px]">
              <div className="flex items-start justify-between w-full">
                <div className="w-12 h-12 rounded-[14px] bg-brand-danger/10 text-brand-danger flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <span className="bg-slate-500/10 text-text-sec px-2.5 py-1 rounded-full text-[10px] font-bold">
                  Leave: {allRequests.filter(lr => lr.status === "approved" && lr.startDate <= new Date().toISOString().split('T')[0] && lr.endDate >= new Date().toISOString().split('T')[0]).length}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">ABSENT</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1">{absentCount}</span>
              </div>
            </div>
          </div>

          {/* Double Columns: Live Attendance list vs Leave Requests list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Attendance Table */}
            <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-extrabold text-base text-text-main tracking-tight flex items-center gap-2">
                      <span>Live Attendance & Location Logs</span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </h3>
                    <p className="text-xs text-text-sec mt-0.5">Real-time GPS coordinates and resolved geocoded locations.</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Switcher: Live vs All Logs */}
                    <div className="inline-flex p-1 bg-bg-base/80 border border-border-card rounded-[12px]">
                      <button
                        type="button"
                        onClick={() => setLiveViewMode("live")}
                        className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-all cursor-pointer ${
                          liveViewMode === "live"
                            ? "bg-brand-primary text-white shadow-sm"
                            : "text-text-sec hover:text-text-main"
                        }`}
                      >
                        Today's Live
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveViewMode("all-logs")}
                        className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-all cursor-pointer ${
                          liveViewMode === "all-logs"
                            ? "bg-brand-primary text-white shadow-sm"
                            : "text-text-sec hover:text-text-main"
                        }`}
                      >
                        All Registry Logs
                      </button>
                    </div>

                    {/* Export Dropdown / Buttons */}
                    <button 
                      onClick={handleExportExcel}
                      className="px-2.5 py-1.5 border border-border-card hover:bg-bg-base rounded-[10px] text-xs font-bold text-text-sec hover:text-text-main transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Export Excel with Location Details"
                    >
                      <Download size={13} className="text-emerald-500" />
                      <span>Excel</span>
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="px-2.5 py-1.5 border border-border-card hover:bg-bg-base rounded-[10px] text-xs font-bold text-text-sec hover:text-text-main transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Export PDF with Location Details"
                    >
                      <FileText size={13} className="text-rose-500" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3 rounded-[16px] bg-bg-base/40 border border-border-card">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mut" size={14} />
                    <input
                      type="text"
                      placeholder="Search name, location, GPS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border-card rounded-[10px] text-xs text-text-main placeholder:text-text-mut focus:outline-none focus:border-brand-primary font-medium"
                    />
                  </div>

                  {/* Location Filter Dropdown */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mut" size={14} />
                    <select
                      value={selectedLocationFilter}
                      onChange={(e) => setSelectedLocationFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border-card rounded-[10px] text-xs font-bold text-text-sec focus:outline-none focus:border-brand-primary cursor-pointer appearance-none truncate"
                    >
                      <option value="all">📍 All Locations ({detectedLocations.length > 0 ? detectedLocations.length : "GPS"})</option>
                      {detectedLocations.map((locName, idx) => (
                        <option key={idx} value={locName}>
                          📍 {locName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-card border border-border-card rounded-[10px] text-xs font-bold text-text-sec focus:outline-none focus:border-brand-primary cursor-pointer appearance-none truncate"
                    >
                      <option value="">🏢 All Departments</option>
                      {departments.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>

                    {(searchQuery || selectedLocationFilter !== "all" || selectedDept) && (
                      <button
                        onClick={() => { setSearchQuery(""); setSelectedLocationFilter("all"); setSelectedDept(""); }}
                        className="px-2.5 py-2 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                        title="Clear Filters"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                {liveViewMode === "live" ? (
                  liveStatusList.length === 0 ? (
                    <div className="text-center py-16 text-text-mut text-sm">
                      <MapPin size={36} className="mx-auto mb-2 opacity-30 text-text-mut" />
                      No employee check logs found matching current filters today.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                            <th className="pb-3 pr-4">Staff Member</th>
                            <th className="pb-3 px-3">Department</th>
                            <th className="pb-3 px-3">Check-In & Location</th>
                            <th className="pb-3 px-3">Check-Out & Location</th>
                            <th className="pb-3 px-3 text-center">Breaks</th>
                            <th className="pb-3 px-3 text-center">Hours</th>
                            <th className="pb-3 pl-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                          {paginatedLiveStatus.map(({ user, status, log }) => {
                            const inTime = log?.checkInTime 
                              ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "—";
                            const outTime = log?.checkOutTime
                              ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "—";

                            const inLocDisplayName = getLocationDisplayName(log?.checkInLocation);
                            const outLocDisplayName = getLocationDisplayName(log?.checkOutLocation);

                            let totalHrsStr = "—";
                            let shortTaken = 0;
                            let longTaken = 0;
                            let bioTaken = 0;
                            
                            if (log) {
                              if (log.breaks) {
                                log.breaks.forEach(b => {
                                  const bStart = new Date(b.startTime).getTime();
                                  const bEnd = b.resumeTime ? new Date(b.resumeTime).getTime() : new Date().getTime();
                                  const mins = Math.round((bEnd - bStart) / 60000);
                                  if (b.type === "short") shortTaken += mins;
                                  else if (b.type === "long") longTaken += mins;
                                  else if (b.type === "bio") bioTaken += mins;
                                });
                              }
                              
                              if (log.totalWorkingMinutes !== undefined) {
                                totalHrsStr = (log.totalWorkingMinutes / 60).toFixed(2) + "h";
                              } else if (log.checkInTime) {
                                const start = new Date(log.checkInTime).getTime();
                                const now = new Date().getTime();
                                const end = log.checkOutTime ? new Date(log.checkOutTime).getTime() : now;
                                
                                const breakMinutes = log.breaks?.reduce((acc, b) => {
                                  const bStart = new Date(b.startTime).getTime();
                                  const bEnd = b.resumeTime ? new Date(b.resumeTime).getTime() : new Date().getTime();
                                  return acc + ((bEnd - bStart) / 60000);
                                }, 0) || 0;
                                
                                const elapsedMins = Math.max(0, ((end - start) / 60000) - breakMinutes);
                                totalHrsStr = (elapsedMins / 60).toFixed(2) + "h";
                              }
                            }

                            return (
                              <tr key={user.uid} className="hover:bg-bg-base/30 transition-colors">
                                <td 
                                  className="py-3.5 pr-4 flex items-center gap-3 cursor-pointer hover:bg-bg-base/50 rounded-lg transition-colors"
                                  onClick={() => { setSelectedUser(user); setShowDetailModal(true); }}
                                  title="View Records"
                                >
                                  <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm flex-shrink-0 overflow-hidden">
                                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : (user.name ? getInitials(user.name) : "U")}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-text-main truncate max-w-[130px] hover:text-brand-primary transition-colors">{user.name}</span>
                                    <span className="text-[10px] text-text-mut truncate max-w-[130px] font-normal">{user.email}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-3 text-text-sec">{user.department || "Engineering"}</td>
                                
                                {/* Check-In Time & Resolved Location */}
                                <td className="py-3.5 px-3">
                                  <div className="text-brand-primary font-bold text-xs">{inTime}</div>
                                  {log?.checkInLocation ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocationModalData({
                                          isOpen: true,
                                          title: "Check-In Location Details",
                                          employeeName: user.name,
                                          userAvatar: user.avatar,
                                          type: "Check-In",
                                          time: inTime,
                                          date: log?.date || "Today",
                                          location: log.checkInLocation
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 transition-all cursor-pointer group max-w-[150px] truncate"
                                      title={`📍 ${inLocDisplayName}\nGPS: ${formatGpsCoords(log.checkInLocation)}\nClick to view map & details`}
                                    >
                                      <MapPin size={10} className="flex-shrink-0 text-blue-500 group-hover:scale-110 transition-transform" />
                                      <span className="truncate">{inLocDisplayName}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-text-mut block mt-0.5">—</span>
                                  )}
                                </td>

                                {/* Check-Out Time & Resolved Location */}
                                <td className="py-3.5 px-3">
                                  <div className="text-text-sec font-bold text-xs">{outTime}</div>
                                  {log?.checkOutLocation ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLocationModalData({
                                          isOpen: true,
                                          title: "Check-Out Location Details",
                                          employeeName: user.name,
                                          userAvatar: user.avatar,
                                          type: "Check-Out",
                                          time: outTime,
                                          date: log?.date || "Today",
                                          location: log.checkOutLocation
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 transition-all cursor-pointer group max-w-[150px] truncate"
                                      title={`📍 ${outLocDisplayName}\nGPS: ${formatGpsCoords(log.checkOutLocation)}\nClick to view map & details`}
                                    >
                                      <MapPin size={10} className="flex-shrink-0 text-amber-500 group-hover:scale-110 transition-transform" />
                                      <span className="truncate">{outLocDisplayName}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-text-mut block mt-0.5">—</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-3 text-center">
                                  {(shortTaken > 0 || longTaken > 0 || bioTaken > 0) ? (
                                    <div className="flex flex-col gap-1 items-center text-[9px] font-extrabold uppercase">
                                      {shortTaken > 0 && <span className="text-brand-warning bg-brand-warning/10 px-1.5 py-0.5 rounded shadow-sm">B1: {shortTaken}m</span>}
                                      {longTaken > 0 && <span className="text-brand-warning bg-brand-warning/10 px-1.5 py-0.5 rounded shadow-sm">B2: {longTaken}m</span>}
                                      {bioTaken > 0 && <span className="text-brand-success bg-brand-success/10 px-1.5 py-0.5 rounded shadow-sm">Bio: {bioTaken}m</span>}
                                    </div>
                                  ) : (
                                    <span className="text-text-mut font-semibold">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3 text-brand-primary font-bold text-center">{totalHrsStr}</td>
                                <td className="py-3.5 pl-3 text-right flex justify-end items-center">{getStatusBadge(status)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  /* All Logs Registry View */
                  filteredLogs.length === 0 ? (
                    <div className="text-center py-16 text-text-mut text-sm">
                      <MapPin size={36} className="mx-auto mb-2 opacity-30 text-text-mut" />
                      No attendance registry records match the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                            <th className="pb-3 pr-3">Date</th>
                            <th className="pb-3 px-3">Employee</th>
                            <th className="pb-3 px-3">Department</th>
                            <th className="pb-3 px-3">Check-In & Location</th>
                            <th className="pb-3 px-3">Check-Out & Location</th>
                            <th className="pb-3 px-3 text-center">Active Hours</th>
                            <th className="pb-3 pl-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                          {filteredLogs.slice((livePage - 1) * rowsPerPage, livePage * rowsPerPage).map((log, idx) => {
                            const checkInTimeStr = log.checkInTime 
                              ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "—";
                            const checkOutTimeStr = log.checkOutTime
                              ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "—";

                            const inLocDisplayName = getLocationDisplayName(log.checkInLocation);
                            const outLocDisplayName = getLocationDisplayName(log.checkOutLocation);
                            const hrs = log.totalWorkingMinutes ? ((log.totalWorkingMinutes / 60).toFixed(2) + "h") : "—";

                            return (
                              <tr key={log.id || idx} className="hover:bg-bg-base/30 transition-colors">
                                <td className="py-3.5 pr-3 font-mono font-bold text-text-sec text-xs">{log.date || "—"}</td>
                                <td className="py-3.5 px-3">
                                  <span className="font-bold text-text-main block">{log.userName}</span>
                                </td>
                                <td className="py-3.5 px-3 text-text-sec">{log.userDept || "—"}</td>

                                {/* Check In Location */}
                                <td className="py-3.5 px-3">
                                  <div className="text-brand-primary font-bold text-xs">{checkInTimeStr}</div>
                                  {log.checkInLocation ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLocationModalData({
                                          isOpen: true,
                                          title: "Check-In Location Details",
                                          employeeName: log.userName,
                                          type: "Check-In",
                                          time: checkInTimeStr,
                                          date: log.date,
                                          location: log.checkInLocation
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 transition-all cursor-pointer max-w-[150px] truncate"
                                      title={`📍 ${inLocDisplayName}\nGPS: ${formatGpsCoords(log.checkInLocation)}`}
                                    >
                                      <MapPin size={10} className="flex-shrink-0 text-blue-500" />
                                      <span className="truncate">{inLocDisplayName}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-text-mut block mt-0.5">—</span>
                                  )}
                                </td>

                                {/* Check Out Location */}
                                <td className="py-3.5 px-3">
                                  <div className="text-text-sec font-bold text-xs">{checkOutTimeStr}</div>
                                  {log.checkOutLocation ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLocationModalData({
                                          isOpen: true,
                                          title: "Check-Out Location Details",
                                          employeeName: log.userName,
                                          type: "Check-Out",
                                          time: checkOutTimeStr,
                                          date: log.date,
                                          location: log.checkOutLocation
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 transition-all cursor-pointer max-w-[150px] truncate"
                                      title={`📍 ${outLocDisplayName}\nGPS: ${formatGpsCoords(log.checkOutLocation)}`}
                                    >
                                      <MapPin size={10} className="flex-shrink-0 text-amber-500" />
                                      <span className="truncate">{outLocDisplayName}</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-text-mut block mt-0.5">—</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-3 text-brand-primary font-bold text-center">{hrs}</td>
                                <td className="py-3.5 pl-3 text-right flex justify-end items-center">{getStatusBadge(log.status || (log.checkOutTime ? "checked-out" : "working"))}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>

              {/* Dynamic Pagination Bar */}
              {(() => {
                const totalItems = liveViewMode === "live" ? liveStatusList.length : filteredLogs.length;
                const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
                const startIndex = (livePage - 1) * rowsPerPage;

                if (totalItems <= 10) return null;

                return (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-text-mut font-semibold">
                        Showing {startIndex + 1} to {Math.min(totalItems, startIndex + rowsPerPage)} of {totalItems} entries
                      </span>
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setLivePage(1); setUsersPage(1); setLeavesPendingPage(1); setRegsPendingPage(1); setHistoryPage(1); setAssetsPage(1);
                        }}
                        className="px-2 py-1 bg-bg-card border border-border-card rounded-[6px] text-xs font-bold text-text-sec cursor-pointer outline-none focus:border-brand-primary"
                      >
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLivePage(prev => Math.max(1, prev - 1))}
                        disabled={livePage === 1}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (totalPages > 5 && p !== 1 && p !== totalPages && Math.abs(p - livePage) > 1) {
                          if (p === 2 || p === totalPages - 1) {
                            return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setLivePage(p)}
                            className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                              livePage === p
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setLivePage(prev => Math.min(totalPages, prev + 1))}
                        disabled={livePage === totalPages}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Leave Requests Panel */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col">
              <h3 className="font-extrabold text-base text-text-main tracking-tight mb-2">Leave Requests</h3>
              <span className="text-[10px] text-text-mut font-bold uppercase tracking-wider block mb-6">
                {leaveRequests.length} Pending Review
              </span>

              {leaveRequests.length === 0 ? (
                <div className="my-auto text-center text-text-mut text-xs py-8">No pending leave requests.</div>
              ) : (
                <div className="space-y-4 flex-grow">
                  {leaveRequests.map((req) => (
                    <div key={req.id} className="p-4 border border-border-card rounded-[16px] bg-bg-base/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-bg-base/50 p-1.5 -ml-1.5 rounded-lg transition-colors"
                          onClick={() => {
                            const u = staffUsers.find(su => su.uid === req.userId);
                            if (u) { setSelectedUser(u); setShowDetailModal(true); }
                          }}
                          title="View Records"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm flex-shrink-0 overflow-hidden">{(users.find(u => u.uid === req.userId)?.avatar) ? <img src={users.find(u => u.uid === req.userId).avatar} alt={req.userName} className="w-full h-full object-cover" /> : (req.userName ? getInitials(req.userName) : "U")}</div>
                          <div>
                            <span className="font-extrabold text-xs text-text-main block hover:text-brand-primary transition-colors">{req.userName || req.name}</span>
                            <span className="text-[10px] text-text-mut font-semibold">{req.type} • {req.duration}</span>
                          </div>
                        </div>
                        <button className="text-text-mut hover:text-brand-primary">
                          <Info size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleApproveLeave(req.id, req.userName || req.name)}
                          className="py-1.5 px-3 bg-brand-primary hover:bg-brand-hover text-white text-[10px] font-bold rounded-[8px] cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectLeave(req.id, req.userName || req.name)}
                          className="py-1.5 px-3 border border-border-card text-text-sec hover:bg-bg-base text-[10px] font-bold rounded-[8px] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
        );
      })()}

      {/* ------------------ VIEW 2: STAFF DIRECTORY / USERS REGISTRY ------------------ */}
      {(activeTab === "users" && (isAdminUser || can("read", "EmployeeManagement"))) && (() => {
        const usersStartIndex = (usersPage - 1) * rowsPerPage;
        const paginatedProfiles = filteredProfiles.slice(usersStartIndex, usersStartIndex + rowsPerPage);
        const usersTotalPages = Math.ceil(filteredProfiles.length / rowsPerPage) || 1;

        return (
          <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Staff Directory</h1>
              <p className="text-sm text-text-sec mt-1">Manage employee profiles, roles, and real-time attendance metrics across all departments.</p>
            </div>
            
            <div className="flex gap-4 items-end flex-wrap w-full md:w-auto">
              {can("create", "EmployeeManagement") && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="py-3 px-5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-md shadow-brand-primary/10 cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>Add Employee</span>
                </button>
              )}
            </div>
          </div>

          {/* Directory Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">TOTAL EMPLOYEES</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1.5">{totalRegistered}</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[9px] font-bold">Total</span>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">PRESENT TODAY</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1.5">{presentCount}</span>
              </div>
              <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-[9px] font-bold">{Math.round((presentCount / (totalRegistered || 1)) * 100)}% Active</span>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">LATE ARRIVALS</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1.5">{lateArrivalsCount}</span>
              </div>
              <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full text-[9px] font-bold">{Math.round((lateArrivalsCount / (presentCount || 1)) * 100)}% Late</span>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[20px] p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">OFFLINE</span>
                <span className="text-3xl font-extrabold text-text-main block mt-1.5">{absentCount}</span>
              </div>
              <span className="bg-slate-200 dark:bg-slate-800 text-text-sec px-2 py-0.5 rounded-full text-[9px] font-bold">{Math.round((absentCount / (totalRegistered || 1)) * 100)}% Offline</span>
            </div>
          </div>

          {/* Directory Filters */}
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
              {/* Search box */}
              <div className="flex flex-col gap-1.5 flex-grow">
                <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="search-input">Search Profile</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut" />
                  <input
                    id="search-input"
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all placeholder-text-mut"
                    placeholder="Filter by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Department drop down */}
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="dept-filter">Department</label>
                <select
                  id="dept-filter"
                  className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="status-filter">Status</label>
                <select
                  id="status-filter"
                  className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Shift */}
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="shift-filter">Shift</label>
                <select
                  id="shift-filter"
                  className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                  value={selectedShiftFilter}
                  onChange={(e) => setSelectedShiftFilter(e.target.value)}
                >
                  <option value="">All Shifts</option>
                  <option value="morning">Morning Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>

              {/* Action resets */}
              <button 
                onClick={() => { setSearchQuery(""); setSelectedDept(""); setSelectedStatus(""); setSelectedShiftFilter(""); }}
                className="py-2.5 px-5 border border-border-card rounded-[12px] hover:bg-bg-base text-xs font-bold text-text-sec cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Directory list card */}
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-16 text-text-mut text-sm">No registered staff users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                      <th className="pb-3 pr-4">Employee</th>
                      <th className="pb-3 px-4">Department</th>
                      <th className="pb-3 px-4">Role</th>
                      <th className="pb-3 px-4">Attendance</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                    {paginatedProfiles.map((user) => {
                      const userToday = getLiveUserStatus(user);
                      const isWorking = userToday.status === "checked-in" || userToday.status === "on-break";
                      
                      // Calculate mock/dynamic attendance rate bar
                      const userLogsCount = logs.filter(l => l.userId === user.uid).length;
                      const attendanceRate = user.role === "admin" ? 100 : Math.min(100, Math.max(65, 80 + userLogsCount * 3));

                      return (
                        <tr key={user.uid} className="hover:bg-bg-base/30">
                          <td 
                            className="py-3.5 pr-4 flex items-center gap-3 cursor-pointer hover:bg-bg-base/50 rounded-lg transition-colors"
                            onClick={() => { setSelectedUser(user); setShowDetailModal(true); }}
                            title="View Details"
                          >
                            <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm flex-shrink-0 overflow-hidden">{user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : (user.name ? getInitials(user.name) : "U")}</div>
                            <div className="flex flex-col text-left">
                              <span className="font-extrabold text-text-main hover:text-brand-primary transition-colors">{user.name}</span>
                              <span className="text-[10px] text-text-mut font-semibold mt-0.5">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-sec">{user.department || "—"}</td>
                          <td className="py-3.5 px-4 text-text-sec capitalize">{user.role}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-[120px]">
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${attendanceRate > 85 ? "bg-brand-success" : "bg-brand-warning"}`} 
                                  style={{ width: `${attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-text-main whitespace-nowrap">{attendanceRate}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {user.role === "admin" ? (
                              <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                admin
                              </span>
                            ) : user.status === "inactive" ? (
                              <button onClick={(e) => handleToggleUserStatus(user, e)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors cursor-pointer" title="Click to activate user">
                                inactive
                              </button>
                            ) : isWorking ? (
                              <button onClick={(e) => handleToggleUserStatus(user, e)} className="bg-emerald-500/10 text-emerald-500 hover:bg-red-500 hover:text-white border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors cursor-pointer" title="Click to deactivate user">
                                active
                              </button>
                            ) : (
                              <button onClick={(e) => handleToggleUserStatus(user, e)} className="bg-amber-500/10 text-amber-500 hover:bg-red-500 hover:text-white border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase transition-colors cursor-pointer" title="Click to deactivate user">
                                offline
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailModal(true);
                                }} 
                                className="w-7 h-7 flex items-center justify-center border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec hover:text-brand-primary transition-colors cursor-pointer" 
                                title="View User Details"
                              >
                                <Eye size={13} />
                              </button>
                              {can("update", "EmployeeManagement") && (
                                <button 
                                  onClick={() => openEditModal(user)} 
                                  className="w-7 h-7 flex items-center justify-center border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec hover:text-brand-primary transition-colors cursor-pointer" 
                                  title="Edit User"
                                >
                                  <Edit size={13} />
                                </button>
                              )}
                              <button 
                                onClick={() => exportSingleUserExcel(user)} 
                                className="w-7 h-7 flex items-center justify-center border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec hover:text-emerald-500 hover:border-emerald-500/30 transition-colors cursor-pointer" 
                                title="Download Excel Report"
                              >
                                <Download size={13} />
                              </button>
                              <button 
                                onClick={() => exportSingleUserPDF(user)} 
                                className="w-7 h-7 flex items-center justify-center border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer" 
                                title="Download PDF Report"
                              >
                                <FileText size={13} />
                              </button>
                              {can("update", "EmployeeManagement") && user.role !== "admin" && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to change the status of ${user.name} to ${user.status === 'inactive' ? 'Active' : 'Inactive'}?`)) {
                                      try {
                                        await updateUserRecord(
                                          user.uid, user.name, user.department, user.programType,
                                          user.shiftStart, user.shiftEnd, user.annualLeaves, user.sickLeaves, user.casualLeaves,
                                          user.avatar, user.dob, user.joiningDate, user.projects, user.tasks, user.jobType, user.designation, user.isProjectManager, user.employeeId,
                                          { status: user.status === 'inactive' ? 'active' : 'inactive' }
                                        );
                                        showToast(`${user.name} is now ${user.status === 'inactive' ? 'Active' : 'Inactive'}.`, "success");
                                      } catch (err) {
                                        showToast("Failed to update status", "error");
                                      }
                                    }
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base transition-colors cursor-pointer ${user.status === 'inactive' ? 'text-red-500 hover:text-emerald-500' : 'text-text-sec hover:text-red-500'}`}
                                  title={user.status === "inactive" ? "Mark as Active" : "Mark as Inactive"}
                                >
                                  {user.status === "inactive" ? <UserCheck size={13} /> : <UserX size={13} />}
                                </button>
                              )}
                              {user.role !== "admin" && can("delete", "EmployeeManagement") && (
                                <button 
                                  onClick={() => openDeleteConfirm(user)} 
                                  className="w-7 h-7 flex items-center justify-center border border-red-500/20 rounded-[8px] bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white transition-colors cursor-pointer" 
                                  title="Delete User"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredProfiles.length > 10 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-text-mut font-semibold">
                    Showing {usersStartIndex + 1} to {Math.min(filteredProfiles.length, usersStartIndex + rowsPerPage)} of {filteredProfiles.length} entries
                  </span>
                  <select 
                    value={rowsPerPage} 
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setLivePage(1); setUsersPage(1); setLeavesPendingPage(1); setRegsPendingPage(1); setHistoryPage(1); setAssetsPage(1);
                    }}
                    className="px-2 py-1 bg-bg-card border border-border-card rounded-[6px] text-xs font-bold text-text-sec cursor-pointer outline-none focus:border-brand-primary"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                  >
                    Prev
                  </button>
                  {Array.from({ length: usersTotalPages }, (_, i) => i + 1).map((p) => {
                    if (usersTotalPages > 5 && p !== 1 && p !== usersTotalPages && Math.abs(p - usersPage) > 1) {
                      if (p === 2 || p === usersTotalPages - 1) {
                        return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setUsersPage(p)}
                        className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                          usersPage === p
                            ? "bg-brand-primary border-brand-primary text-white"
                            : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                    disabled={usersPage === usersTotalPages}
                    className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
        );
      })()}

      {/* ------------------ VIEW 3: LEAVE APPROVAL CENTER ------------------ */}
      {(activeTab === "logs" && (isAdminUser || can("read", "LeaveApprovals") || can("read", "Regularization"))) && (() => {
        const pendingCount = leaveRequests.length + regularizationRequests.length;
        const approvedThisMonth = allRequests.filter(r => r.status === "approved").length;
        
        let totalApprovedDays = 0;
        allRequests.filter(r => r.status === "approved").forEach(r => {
          const dVal = parseInt(r.duration);
          if (!isNaN(dVal)) {
            totalApprovedDays += dVal;
          } else {
            totalApprovedDays += 1;
          }
        });

        const selectedRequest = leaveRequests.find(r => r.id === selectedRequestId);
        const selectedRegRequest = regularizationRequests.find(r => r.id === selectedRegRequestId);

        const leavesPendingStartIndex = (leavesPendingPage - 1) * rowsPerPage;
        const paginatedPendingLeaves = filteredLeaveRequests.slice(leavesPendingStartIndex, leavesPendingStartIndex + rowsPerPage);
        const leavesPendingTotalPages = Math.ceil(filteredLeaveRequests.length / rowsPerPage) || 1;

        const regsPendingStartIndex = (regsPendingPage - 1) * rowsPerPage;
        const paginatedPendingRegs = filteredRegRequests.slice(regsPendingStartIndex, regsPendingStartIndex + rowsPerPage);
        const regsPendingTotalPages = Math.ceil(filteredRegRequests.length / rowsPerPage) || 1;

        const historyStartIndex = (historyPage - 1) * rowsPerPage;
        const paginatedHistory = filteredHistory.slice(historyStartIndex, historyStartIndex + rowsPerPage);
        const historyTotalPages = Math.ceil(filteredHistory.length / rowsPerPage) || 1;

        return (
          <>
            {/* Header Description */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Approvals Center</h1>
                <p className="text-sm text-text-sec mt-1">Review and manage time-off and regularization requests from your direct reports.</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleExportExcel} 
                  className="flex items-center gap-1.5 py-2.5 px-4 border border-emerald-500/30 text-xs font-bold rounded-[12px] bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Download size={14} /> 
                  <span>Excel</span>
                </button>
                <button 
                  onClick={handleExportPDF} 
                  className="flex items-center gap-1.5 py-2.5 px-4 border border-red-500/30 text-xs font-bold rounded-[12px] bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                >
                  <FileText size={14} /> 
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Stats Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {/* Card 1 */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">PENDING APPROVALS</span>
                    <span className="text-4xl font-black text-text-main block mt-2">{String(pendingCount).padStart(2, '0')}</span>
                  </div>
                  <div className="w-12 h-12 rounded-[16px] bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={22} />
                  </div>
                </div>
                <div className="mt-4 text-xs font-semibold text-text-sec flex items-center gap-1.5">
                  <span className="text-brand-primary font-bold">Leaves: {leaveRequests.length}</span>
                  <span className="text-text-mut font-semibold">• Regs: {regularizationRequests.length}</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">APPROVED LEAVES (MONTH)</span>
                    <span className="text-4xl font-black text-text-main block mt-2">{String(approvedThisMonth).padStart(2, '0')}</span>
                  </div>
                  <div className="w-12 h-12 rounded-[16px] bg-brand-success/10 text-brand-success flex items-center justify-center flex-shrink-0">
                    <Calendar size={22} />
                  </div>
                </div>
                <div className="mt-4 text-xs font-semibold text-text-sec flex items-center gap-1.5">
                  <span className="text-brand-success font-bold">Total {totalApprovedDays}</span>
                  <span className="text-text-mut font-semibold">days approved</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">TEAM AVAILABILITY TODAY</span>
                    <span className="text-4xl font-black text-text-main block mt-2">92%</span>
                  </div>
                  <div className="w-12 h-12 rounded-[16px] bg-brand-warning/10 text-brand-warning flex items-center justify-center flex-shrink-0">
                    <Users size={22} />
                  </div>
                </div>
                <div className="mt-4 text-xs font-semibold text-text-sec flex items-center gap-1.5">
                  <span className="text-brand-warning font-bold">2</span>
                  <span className="text-text-mut font-semibold">offline currently</span>
                </div>
              </div>
            </div>

            {/* Sub-tab segmented control */}
            <div className="flex border-b border-border-card mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button
                onClick={() => setApprovalsSubTab("leaves")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  approvalsSubTab === "leaves"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-sec hover:text-text-main"
                }`}
              >
                Leave Requests ({leaveRequests.length})
              </button>
              <button
                onClick={() => setApprovalsSubTab("regularization")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  approvalsSubTab === "regularization"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-sec hover:text-text-main"
                }`}
              >
                Regularization Requests ({regularizationRequests.length})
              </button>
              <button
                onClick={() => setApprovalsSubTab("history")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  approvalsSubTab === "history"
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-text-sec hover:text-text-main"
                }`}
              >
                Request History ({allRequests.filter(r => r.status !== "pending").length + allRegularizationRequests.filter(r => r.status !== "pending").length})
              </button>
            </div>

            {/* Split Content */}
            {/* Split Content */}
            {approvalsSubTab === "leaves" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Leaves Queue */}
                <div className="lg:col-span-7 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-base text-text-main tracking-tight">Pending Leave Requests</h3>
                    <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {filteredLeaveRequests.length} ACTIVE
                    </span>
                  </div>

                  {filteredLeaveRequests.length === 0 ? (
                    <div className="text-center py-16 text-text-mut text-sm font-semibold flex-grow flex items-center justify-center">
                      No pending leave requests in the queue.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                            <th className="pb-3 pr-4">Employee</th>
                            <th className="pb-3 px-4">Leave Type</th>
                            <th className="pb-3 px-4">Dates</th>
                            <th className="pb-3 pl-4 text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                          {paginatedPendingLeaves.map((req) => {
                            const isSelected = req.id === selectedRequestId;
                            
                            const startF = req.startDate ? new Date(req.startDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
                            const endF = req.endDate ? new Date(req.endDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
                            
                            let typeBadge = "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
                            if (req.type === "Sick Leave") {
                              typeBadge = "bg-brand-danger/10 text-brand-danger border border-brand-danger/20";
                            } else if (req.type === "Casual Leave") {
                              typeBadge = "bg-brand-success/10 text-brand-success border border-brand-success/20";
                            }

                            return (
                              <tr 
                                key={req.id} 
                                onClick={() => setSelectedRequestId(req.id)}
                                className={`hover:bg-bg-base/30 cursor-pointer transition-all ${
                                  isSelected ? "bg-brand-primary/5 border-l-4 border-brand-primary" : ""
                                }`}
                              >
                                <td 
                                  className="py-3.5 pr-4 flex items-center gap-3 cursor-pointer hover:bg-bg-base/50 rounded-lg transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const u = staffUsers.find(su => su.uid === req.userId);
                                    if (u) { setSelectedUser(u); setShowDetailModal(true); }
                                  }}
                                  title="View Records"
                                >
                                  <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm flex-shrink-0 overflow-hidden">{(users.find(u => u.uid === req.userId)?.avatar) ? <img src={users.find(u => u.uid === req.userId).avatar} alt={req.userName} className="w-full h-full object-cover" /> : (req.userName ? getInitials(req.userName) : "U")}</div>
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-text-main truncate max-w-[130px] hover:text-brand-primary transition-colors">{req.userName}</span>
                                    <span className="text-[10px] text-text-mut font-semibold mt-0.5">{getMockDesignation(req.userName)}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${typeBadge}`}>
                                      {req.type}
                                    </span>
                                    {req.isEmergency && (
                                      <span className="text-[10px] px-2 py-0.5 rounded font-extrabold uppercase bg-brand-warning/10 text-brand-warning border border-brand-warning/20">
                                        Emergency
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-text-sec whitespace-nowrap">
                                  {startF && endF ? `${startF} - ${endF}` : "—"}
                                </td>
                                <td className="py-3.5 pl-4 text-right text-brand-primary font-bold whitespace-nowrap">
                                  {req.duration}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredLeaveRequests.length > 10 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-text-mut font-semibold">
                          Showing {leavesPendingStartIndex + 1} to {Math.min(filteredLeaveRequests.length, leavesPendingStartIndex + rowsPerPage)} of {filteredLeaveRequests.length} entries
                        </span>
                        <select 
                          value={rowsPerPage} 
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setLivePage(1); setUsersPage(1); setLeavesPendingPage(1); setRegsPendingPage(1); setHistoryPage(1); setAssetsPage(1);
                          }}
                          className="px-2 py-1 bg-bg-card border border-border-card rounded-[6px] text-xs font-bold text-text-sec cursor-pointer outline-none focus:border-brand-primary"
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                          <option value={100}>100 / page</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setLeavesPendingPage(prev => Math.max(1, prev - 1))}
                          disabled={leavesPendingPage === 1}
                          className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                        >
                          Prev
                        </button>
                        {Array.from({ length: leavesPendingTotalPages }, (_, i) => i + 1).map((p) => {
                          if (leavesPendingTotalPages > 5 && p !== 1 && p !== leavesPendingTotalPages && Math.abs(p - leavesPendingPage) > 1) {
                            if (p === 2 || p === leavesPendingTotalPages - 1) {
                              return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                            }
                            return null;
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setLeavesPendingPage(p)}
                              className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                                leavesPendingPage === p
                                  ? "bg-brand-primary border-brand-primary text-white"
                                  : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setLeavesPendingPage(prev => Math.min(leavesPendingTotalPages, prev + 1))}
                          disabled={leavesPendingPage === leavesPendingTotalPages}
                          className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Leaves Details Column */}
                <div className="lg:col-span-5 space-y-6">
                  {selectedRequest ? (
                    <>
                      <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border-card">
                          <div className="w-10 h-10 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-sm uppercase shadow-sm flex-shrink-0 overflow-hidden">{(users.find(u => u.uid === selectedRequest.userId)?.avatar) ? <img src={users.find(u => u.uid === selectedRequest.userId).avatar} alt={selectedRequest.userName} className="w-full h-full object-cover" /> : (selectedRequest.userName ? getInitials(selectedRequest.userName) : "U")}</div>
                          <div className="flex-grow text-left">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-sm text-text-main flex items-center gap-1.5">
                                <span>{selectedRequest.userName}</span>
                                {selectedRequest.isEmergency && (
                                  <span className="bg-brand-warning/10 text-brand-warning border border-brand-warning/20 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase whitespace-nowrap">
                                    Emergency
                                  </span>
                                )}
                              </span>
                              <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-[10px] px-3 py-1 rounded-[8px] font-black uppercase tracking-wider">
                                PENDING
                              </span>
                            </div>
                            <span className="text-xs text-text-sec font-semibold mt-0.5 block">{selectedRequest.type} Request</span>
                            <span className="text-[10px] text-text-mut font-bold block mt-1">
                              {selectedRequest.startDate && selectedRequest.endDate 
                                ? `${new Date(selectedRequest.startDate).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})} - ${new Date(selectedRequest.endDate).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}`
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {selectedRequest.reason && (
                          <div className="p-3 bg-bg-base/30 rounded-[12px] border border-border-card">
                            <span className="text-[9px] font-bold text-text-mut uppercase block mb-1">Reason for Leave</span>
                            <p className="text-xs text-text-sec leading-relaxed font-semibold">{selectedRequest.reason}</p>
                          </div>
                        )}

                        {/* Leave Balances Grid */}
                        <div className="bg-bg-base/30 rounded-[16px] border border-border-card p-4 space-y-3">
                          <span className="text-[10px] font-bold text-text-mut uppercase block text-left">Leave Balances</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-2 bg-bg-card rounded-[10px] border border-border-card text-center">
                              <span className="text-[8px] font-bold text-text-mut uppercase block">Annual</span>
                              <span className="text-sm font-extrabold text-text-main mt-0.5 block">
                                {users.find(u => u.uid === selectedRequest.userId)?.annualLeaves !== undefined 
                                  ? users.find(u => u.uid === selectedRequest.userId).annualLeaves 
                                  : 25}
                                <span className="text-[8px] font-semibold text-text-sec">d</span>
                              </span>
                            </div>
                            <div className="p-2 bg-bg-card rounded-[10px] border border-border-card text-center">
                              <span className="text-[8px] font-bold text-text-mut uppercase block">Sick</span>
                              <span className="text-sm font-extrabold text-text-main mt-0.5 block">
                                {users.find(u => u.uid === selectedRequest.userId)?.sickLeaves !== undefined 
                                  ? users.find(u => u.uid === selectedRequest.userId).sickLeaves 
                                  : 10}
                                <span className="text-[8px] font-semibold text-text-sec">d</span>
                              </span>
                            </div>
                            <div className="p-2 bg-bg-card rounded-[10px] border border-border-card text-center">
                              <span className="text-[8px] font-bold text-text-mut uppercase block">Casual</span>
                              <span className="text-sm font-extrabold text-text-main mt-0.5 block">
                                {users.find(u => u.uid === selectedRequest.userId)?.casualLeaves !== undefined 
                                  ? users.find(u => u.uid === selectedRequest.userId).casualLeaves 
                                  : 6}
                                <span className="text-[8px] font-semibold text-text-sec">d</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-text-sec">Manager Comment</label>
                          <textarea
                            placeholder="Add a note for the employee (optional)..."
                            className="w-full h-20 p-3 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all resize-none"
                            value={managerCommentInput}
                            onChange={(e) => setManagerCommentInput(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleRejectLeave(selectedRequest.id, selectedRequest.userName, managerCommentInput)}
                            className="py-2.5 px-4 border border-border-card hover:bg-red-500/10 text-red-500 text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
                          >
                            REJECT
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveLeave(selectedRequest.id, selectedRequest.userName, managerCommentInput)}
                            className="py-2.5 px-4 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] transition-colors shadow-md shadow-brand-primary/10 cursor-pointer"
                          >
                            APPROVE REQUEST
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const reqDept = selectedRequest.userDept || users.find(u => u.uid === selectedRequest.userId)?.department || "";
                        const deptStaff = staffUsers.filter(u => u.department === reqDept);
                        const totalCount = deptStaff.length || 1;

                        const otherOverlappingStaff = deptStaff.filter(u => {
                          if (u.uid === selectedRequest.userId) return false;
                          return allRequests.some(req => 
                            req.userId === u.uid && 
                            req.status === "approved" && 
                            hasOverlap(req.startDate, req.endDate, selectedRequest.startDate, selectedRequest.endDate)
                          );
                        });

                        const offCount = 1 + otherOverlappingStaff.length; // Requester + anyone else already off

                        return (
                          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-xs text-text-mut uppercase tracking-wider">
                                TEAM AVAILABILITY: {selectedRequest.startDate && selectedRequest.endDate 
                                  ? `${new Date(selectedRequest.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'})} - ${new Date(selectedRequest.endDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}`
                                  : "OCT 24 - OCT 28"}
                              </h4>
                            </div>

                            <div className="space-y-4">
                              {deptStaff.map(u => {
                                const isRequester = u.uid === selectedRequest.userId;
                                
                                if (isRequester) {
                                  return (
                                    <div key={u.uid} className="space-y-1">
                                      <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-brand-primary font-bold">
                                          {u.name} <span className="text-[10px] text-text-mut font-normal">({getMockDesignation(u.name)})</span>
                                        </span>
                                        <span className="text-brand-primary font-extrabold text-[10px] uppercase">Requested</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-brand-primary w-full" />
                                      </div>
                                      {selectedRequest.startDate && selectedRequest.endDate && (
                                        <span className="text-[9px] text-brand-primary font-semibold block">
                                          Duration: {new Date(selectedRequest.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'})} - {new Date(selectedRequest.endDate).toLocaleDateString([], {month: 'short', day: 'numeric'})} ({selectedRequest.duration})
                                        </span>
                                      )}
                                    </div>
                                  );
                                }

                                const overlappingLeaves = allRequests.filter(req => 
                                  req.userId === u.uid && 
                                  req.status === "approved" && 
                                  hasOverlap(req.startDate, req.endDate, selectedRequest.startDate, selectedRequest.endDate)
                                );

                                if (overlappingLeaves.length > 0) {
                                  const oLeave = overlappingLeaves[0];
                                  const overlapDays = getOverlapInfo(oLeave.startDate, oLeave.endDate, selectedRequest.startDate, selectedRequest.endDate);
                                  const reqDays = getDurationDays(selectedRequest.startDate, selectedRequest.endDate);
                                  const percentage = Math.min(100, Math.round((overlapDays / reqDays) * 100)) || 100;
                                  const durationLabel = oLeave.duration || `${overlapDays} Day${overlapDays > 1 ? "s" : ""}`;

                                  return (
                                    <div key={u.uid} className="space-y-1">
                                      <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-text-main">
                                          {u.name} <span className="text-[10px] text-text-mut font-normal">({getMockDesignation(u.name)})</span>
                                        </span>
                                        <span className="text-brand-danger font-extrabold text-[10px] uppercase">Off ({durationLabel})</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-brand-danger" style={{ width: `${percentage}%` }} />
                                      </div>
                                      {oLeave.startDate && oLeave.endDate && (
                                        <span className="text-[9px] text-text-mut font-semibold block">
                                          Duration: {new Date(oLeave.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'})} - {new Date(oLeave.endDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                                        </span>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div key={u.uid} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                      <span className="text-text-main">
                                        {u.name} <span className="text-[10px] text-text-mut font-normal">({getMockDesignation(u.name)})</span>
                                      </span>
                                      <span className="text-emerald-500 font-extrabold text-[10px] uppercase">Available</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-emerald-500 w-full" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="border-t border-border-card pt-3 mt-1 text-[11px] text-text-sec font-semibold leading-relaxed">
                              Approval will result in {offCount}/{totalCount} member{totalCount > 1 ? "s" : ""} off during this period.
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm text-center py-16 text-text-mut text-sm font-semibold">
                      Select a request from the queue to review details.
                    </div>
                  )}
                </div>
              </div>
            )}

            {approvalsSubTab === "regularization" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Regularization Queue */}
                <div className="lg:col-span-7 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-base text-text-main tracking-tight">Pending Time Regularizations</h3>
                    <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {filteredRegRequests.length} ACTIVE
                    </span>
                  </div>

                  {filteredRegRequests.length === 0 ? (
                    <div className="text-center py-16 text-text-mut text-sm font-semibold flex-grow flex items-center justify-center">
                      No pending regularization requests in the queue.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                            <th className="pb-3 pr-4">Employee</th>
                            <th className="pb-3 px-4">Missed Date</th>
                            <th className="pb-3 px-4">Req. Check-In</th>
                            <th className="pb-3 pl-4 text-right">Req. Check-Out</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                          {paginatedPendingRegs.map((req) => {
                            const isSelected = req.id === selectedRegRequestId;
                            return (
                              <tr 
                                key={req.id} 
                                onClick={() => setSelectedRegRequestId(req.id)}
                                className={`hover:bg-bg-base/30 cursor-pointer transition-all ${
                                  isSelected ? "bg-brand-primary/5 border-l-4 border-brand-primary" : ""
                                }`}
                              >
                                <td 
                                  className="py-3.5 pr-4 flex items-center gap-3 cursor-pointer hover:bg-bg-base/50 rounded-lg transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const u = staffUsers.find(su => su.uid === req.userId);
                                    if (u) { setSelectedUser(u); setShowDetailModal(true); }
                                  }}
                                  title="View Records"
                                >
                                  <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm flex-shrink-0 overflow-hidden">{(users.find(u => u.uid === req.userId)?.avatar) ? <img src={users.find(u => u.uid === req.userId).avatar} alt={req.userName} className="w-full h-full object-cover" /> : (req.userName ? getInitials(req.userName) : "U")}</div>
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-text-main truncate max-w-[130px] hover:text-brand-primary transition-colors">{req.userName}</span>
                                    <span className="text-[10px] text-text-mut font-semibold mt-0.5">{getMockDesignation(req.userName)}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-text-sec whitespace-nowrap">
                                  {req.date}
                                </td>
                                <td className="py-3.5 px-4 text-brand-primary font-bold">
                                  {formatShiftTime(req.checkInTime)}
                                </td>
                                <td className="py-3.5 pl-4 text-right text-brand-primary font-bold animate-pulse-slow">
                                  {formatShiftTime(req.checkOutTime)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredRegRequests.length > 10 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-text-mut font-semibold">
                          Showing {regsPendingStartIndex + 1} to {Math.min(filteredRegRequests.length, regsPendingStartIndex + rowsPerPage)} of {filteredRegRequests.length} entries
                        </span>
                        <select 
                          value={rowsPerPage} 
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setLivePage(1); setUsersPage(1); setLeavesPendingPage(1); setRegsPendingPage(1); setHistoryPage(1); setAssetsPage(1);
                          }}
                          className="px-2 py-1 bg-bg-card border border-border-card rounded-[6px] text-xs font-bold text-text-sec cursor-pointer outline-none focus:border-brand-primary"
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                          <option value={100}>100 / page</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRegsPendingPage(prev => Math.max(1, prev - 1))}
                          disabled={regsPendingPage === 1}
                          className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                        >
                          Prev
                        </button>
                        {Array.from({ length: regsPendingTotalPages }, (_, i) => i + 1).map((p) => {
                          if (regsPendingTotalPages > 5 && p !== 1 && p !== regsPendingTotalPages && Math.abs(p - regsPendingPage) > 1) {
                            if (p === 2 || p === regsPendingTotalPages - 1) {
                              return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                            }
                            return null;
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setRegsPendingPage(p)}
                              className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                                regsPendingPage === p
                                  ? "bg-brand-primary border-brand-primary text-white"
                                  : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setRegsPendingPage(prev => Math.min(regsPendingTotalPages, prev + 1))}
                          disabled={regsPendingPage === regsPendingTotalPages}
                          className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Regularization Details Column */}
                <div className="lg:col-span-5 space-y-6">
                  {selectedRegRequest ? (
                    <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm space-y-6 text-left">
                      <div className="flex items-center gap-3 pb-4 border-b border-border-card">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-sm uppercase shadow-sm flex-shrink-0 overflow-hidden">{(users.find(u => u.uid === selectedRegRequest.userId)?.avatar) ? <img src={users.find(u => u.uid === selectedRegRequest.userId).avatar} alt={selectedRegRequest.userName} className="w-full h-full object-cover" /> : (selectedRegRequest.userName ? getInitials(selectedRegRequest.userName) : "U")}</div>
                        <div className="flex-grow text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-sm text-text-main">{selectedRegRequest.userName}</span>
                            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-[10px] px-3 py-1 rounded-[8px] font-black uppercase tracking-wider">
                              PENDING
                            </span>
                          </div>
                          <span className="text-xs text-text-sec font-semibold mt-0.5 block">Time Regularization Request</span>
                          <span className="text-[10px] text-text-mut font-bold block mt-1">
                            Missed Date: {selectedRegRequest.date}
                          </span>
                        </div>
                      </div>

                      {/* Times display */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-base/30 rounded-[16px] border border-border-card p-4">
                        <div>
                          <span className="text-[10px] font-bold text-text-mut uppercase block">Requested Check-In</span>
                          <span className="text-sm font-extrabold text-brand-primary mt-1 block">{formatShiftTime(selectedRegRequest.checkInTime)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-text-mut uppercase block">Requested Check-Out</span>
                          <span className="text-sm font-extrabold text-brand-primary mt-1 block">{formatShiftTime(selectedRegRequest.checkOutTime)}</span>
                        </div>
                      </div>

                      {selectedRegRequest.reason && (
                        <div className="p-3 bg-bg-base/30 rounded-[12px] border border-border-card">
                          <span className="text-[9px] font-bold text-text-mut uppercase block mb-1">Reason / Explanation</span>
                          <p className="text-xs text-text-sec leading-relaxed font-semibold">{selectedRegRequest.reason}</p>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-sec">Manager Comment</label>
                        <textarea
                          placeholder="Add a note for the employee (optional)..."
                          className="w-full h-20 p-3 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all resize-none"
                          value={regManagerCommentInput}
                          onChange={(e) => setRegManagerCommentInput(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleRejectReg(selectedRegRequest.id, selectedRegRequest.userName, regManagerCommentInput)}
                          className="py-2.5 px-4 border border-border-card hover:bg-red-500/10 text-red-500 text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
                        >
                          REJECT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveReg(selectedRegRequest.id, selectedRegRequest.userName, regManagerCommentInput)}
                          className="py-2.5 px-4 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] transition-colors shadow-md shadow-brand-primary/10 cursor-pointer"
                        >
                          APPROVE REQUEST
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm text-center py-16 text-text-mut text-sm font-semibold">
                      Select a regularization request from the queue to review details.
                    </div>
                  )}
                </div>
              </div>
            )}

            {approvalsSubTab === "history" && (
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-extrabold text-base text-text-main tracking-tight">Processed Request History</h3>
                    <p className="text-xs text-text-mut font-semibold mt-1">Review approved and rejected leaves and regularization requests.</p>
                  </div>
                </div>

                {/* Filter Toolbar Removed */}

                {filteredHistory.length === 0 ? (
                  <div className="text-center py-16 text-text-mut text-sm font-semibold">
                    No requests found matching the search or filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                          <th className="pb-3 pr-4">Employee</th>
                          <th className="pb-3 px-4">Request Type</th>
                          <th className="pb-3 px-4">Date / Period</th>
                          <th className="pb-3 px-4">Details</th>
                          <th className="pb-3 px-4">Reason</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4 text-right">Manager Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                        {paginatedHistory.map((item) => {
                          const isApproved = item.status === "approved";
                          const isRejected = item.status === "rejected";
                          let statusBadge = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
                          if (isApproved) {
                            statusBadge = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                          } else if (isRejected) {
                            statusBadge = "bg-red-500/10 text-red-500 border border-red-500/20";
                          }

                          let typeBadge = "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
                          if (item.reqType === "Regularization") {
                            typeBadge = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                          }

                          return (
                            <tr key={item.id} className="hover:bg-bg-base/30">
                              <td 
                                className="py-3.5 pr-4 flex items-center gap-3 cursor-pointer hover:bg-bg-base/50 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const u = staffUsers.find(su => su.uid === item.userId);
                                  if (u) { setSelectedUser(u); setShowDetailModal(true); }
                                }}
                                title="View Records"
                              >
                                <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30 flex items-center justify-center font-extrabold text-xs uppercase shadow-sm flex-shrink-0 overflow-hidden">{(users.find(u => u.uid === item.userId)?.avatar) ? <img src={users.find(u => u.uid === item.userId).avatar} alt={item.userName} className="w-full h-full object-cover" /> : (item.userName ? getInitials(item.userName) : "U")}</div>
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-text-main truncate max-w-[130px] hover:text-brand-primary transition-colors">{item.userName}</span>
                                  <span className="text-[10px] text-text-mut font-semibold mt-0.5">{item.userDept || "Staff"}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${typeBadge}`}>
                                  {item.reqType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-text-sec whitespace-nowrap">
                                {item.dateLabel}
                              </td>
                              <td className="py-3.5 px-4 text-text-main truncate max-w-[180px]" title={item.details}>
                                {item.details}
                              </td>
                              <td className="py-3.5 px-4 text-text-sec truncate max-w-[200px]" title={item.reason}>
                                {item.reason || "—"}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${statusBadge}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3.5 pl-4 text-right text-[11px] text-text-mut font-semibold truncate max-w-[150px]" title={item.managerComment || ""}>
                                {item.managerComment || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredHistory.length > 10 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-text-mut font-semibold">
                        Showing {historyStartIndex + 1} to {Math.min(filteredHistory.length, historyStartIndex + rowsPerPage)} of {filteredHistory.length} entries
                      </span>
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setLivePage(1); setUsersPage(1); setLeavesPendingPage(1); setRegsPendingPage(1); setHistoryPage(1); setAssetsPage(1);
                        }}
                        className="px-2 py-1 bg-bg-card border border-border-card rounded-[6px] text-xs font-bold text-text-sec cursor-pointer outline-none focus:border-brand-primary"
                      >
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                        disabled={historyPage === 1}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Prev
                      </button>
                      {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => {
                        if (historyTotalPages > 5 && p !== 1 && p !== historyTotalPages && Math.abs(p - historyPage) > 1) {
                          if (p === 2 || p === historyTotalPages - 1) {
                            return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setHistoryPage(p)}
                            className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                              historyPage === p
                                ? "bg-brand-primary border-brand-primary text-white"
                                : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setHistoryPage(prev => Math.min(historyTotalPages, prev + 1))}
                        disabled={historyPage === historyTotalPages}
                        className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* ------------------ VIEW 4: ANALYTICS & INSIGHTS ------------------ */}
      {(activeTab === "analytics" && (isAdminUser || can("read", "Dashboard"))) && (() => {
        const dailyStats = getDailyAttendanceStats();
        const deptStats = getDeptAttendanceRates();
        const employeeStats = getEmployeeWorkingStats();
        
        const maxDailyCount = Math.max(1, ...dailyStats.map(d => d.count));
        const maxHours = Math.max(8, ...employeeStats.map(e => e.avgHours));

        return (
          <>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Workforce Analytics</h1>
              <p className="text-sm text-text-sec mt-1">Review employee attendance levels, rates by department, and working shift durations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Daily Attendance Level Bar Chart */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                <h4 className="font-extrabold text-base text-text-main mb-1.5 flex items-center gap-2">
                  <Calendar size={18} className="text-brand-primary" /> 
                  <span>Daily Attendance Level (Last 7 Days)</span>
                </h4>
                <p className="text-[10px] text-text-mut font-semibold mb-6">Total number of unique employees checked-in per day</p>
                
                {/* Chart body */}
                <div className="h-[200px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis 
                        dataKey="dateLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => [`${value} present`, 'Attendance']}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {dailyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#4f46e5' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Attendance Rates */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                <h4 className="font-extrabold text-base text-text-main mb-1.5 flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-success" /> 
                  <span>Domain Attendance Rates (Today)</span>
                </h4>
                <p className="text-[10px] text-text-mut font-semibold mb-6">Percentage of checked-in staff out of registered domain members today</p>
                
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptStats} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis 
                        dataKey="department" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 'bold' }} 
                        width={80}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        formatter={(value, name, props) => {
                          const d = props.payload;
                          return [`${value}% (${d.present}/${d.total})`, 'Attendance Rate'];
                        }}
                      />
                      <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={24} background={{ fill: '#f1f5f9' }}>
                        {deptStats.map((entry, index) => {
                          let fill = '#10b981'; // success
                          if (entry.rate < 40) fill = '#ef4444'; // danger
                          else if (entry.rate < 80) fill = '#f59e0b'; // warning
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                        <LabelList 
                          dataKey="rate" 
                          position="right" 
                          formatter={(value) => `${value}%`} 
                          style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Employees Working Hours - Premium Leaderboard */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm lg:col-span-2 overflow-hidden relative">
                {/* Background decorative gradient */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative">
                  <div>
                    <h4 className="font-extrabold text-base text-text-main flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-primary to-indigo-500 flex items-center justify-center shadow-md shadow-brand-primary/25">
                        <Clock size={16} className="text-white" />
                      </div>
                      <span>Average Work Hours — Top Performers</span>
                    </h4>
                    <p className="text-[10px] text-text-mut font-semibold mt-1 ml-10">Ranked by average active hours logged per shift session</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-brand-primary/5 border border-brand-primary/15 rounded-[10px] px-3 py-1.5 text-[10px] font-bold text-brand-primary self-start sm:self-auto">
                    <TrendingUp size={12} />
                    <span>TARGET: 8h / SHIFT</span>
                  </div>
                </div>

                {employeeStats.length === 0 ? (
                  <div className="text-center py-14 text-text-mut text-xs font-semibold">
                    <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
                    No attendance logs available yet for analysis.
                  </div>
                ) : (
                  <div className="space-y-4 relative">
                    {employeeStats.map((e, idx) => {
                      const fillPercent = Math.max(5, Math.round((e.avgHours / maxHours) * 100));
                      const targetPercent = Math.round((e.avgHours / 8) * 100);
                      const isAboveTarget = e.avgHours >= 8;
                      const isNearTarget = e.avgHours >= 6 && e.avgHours < 8;

                      // Rank visuals
                      const rankEmoji = idx === 0 ? <Trophy size={14} className="text-yellow-500" /> : idx === 1 ? <Trophy size={14} className="text-slate-400" /> : idx === 2 ? <Trophy size={14} className="text-amber-600" /> : null;
                      const rankColors = [
                        "from-amber-400 to-yellow-300",   // 1st - gold
                        "from-slate-400 to-slate-300",    // 2nd - silver
                        "from-orange-500 to-amber-400",   // 3rd - bronze
                        "from-brand-primary to-indigo-500", // 4th
                        "from-brand-primary to-indigo-500"  // 5th
                      ];
                      const barColor = isAboveTarget
                        ? "from-brand-success to-emerald-400"
                        : isNearTarget
                          ? "from-brand-warning to-amber-300"
                          : "from-red-500 to-red-400";
                      const badgeColor = isAboveTarget
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : isNearTarget
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20";

                      return (
                        <div key={idx} className="group flex items-center gap-4 p-3 rounded-[16px] hover:bg-bg-base/60 transition-all duration-200">
                          {/* Rank badge */}
                          <div className={`w-9 h-9 rounded-[10px] bg-gradient-to-br ${rankColors[idx]} flex items-center justify-center font-extrabold text-white text-xs shadow-sm flex-shrink-0`}>
                            {rankEmoji || `#${idx + 1}`}
                          </div>

                          {/* Name */}
                          <div className="w-28 flex-shrink-0">
                            <span className="text-xs font-extrabold text-text-main truncate block leading-tight">{e.name}</span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${badgeColor}`}>
                              {isAboveTarget ? "On Target" : isNearTarget ? "Near Target" : "Below Target"}
                            </span>
                          </div>

                          {/* Bar track */}
                          <div className="flex-grow flex flex-col gap-1.5">
                            {/* Target line marker */}
                            <div className="relative w-full bg-bg-base dark:bg-slate-800/60 h-6 rounded-[8px] overflow-hidden border border-border-card/50">
                              {/* Filled bar */}
                              <div
                                className={`absolute left-0 top-0 h-full bg-gradient-to-r ${barColor} rounded-[8px] transition-all duration-700 ease-out flex items-center justify-end pr-2 shadow-sm`}
                                style={{ width: `${fillPercent}%` }}
                              >
                                <span className="text-[9px] font-extrabold text-white drop-shadow">{e.avgHours}h</span>
                              </div>
                              {/* Target line at 8h (100% of maxHours reference) */}
                              {maxHours > 8 && (
                                <div
                                  className="absolute top-0 h-full w-px bg-white/40 border-l border-dashed border-white/60 pointer-events-none"
                                  style={{ left: `${Math.round((8 / maxHours) * 100)}%` }}
                                />
                              )}
                            </div>
                            {/* Progress mini-label */}
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-text-mut font-semibold">{targetPercent}% of 8h target</span>
                              <span className="text-[9px] text-text-mut font-semibold">{e.avgHours}h avg</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary stats footer */}
                {employeeStats.length > 0 && (() => {
                  const overallAvg = parseFloat((employeeStats.reduce((s, e) => s + e.avgHours, 0) / employeeStats.length).toFixed(1));
                  const topPerformer = employeeStats[0];
                  const aboveTargetCount = employeeStats.filter(e => e.avgHours >= 8).length;
                  return (
                    <div className="mt-6 pt-5 border-t border-border-card grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-[12px] bg-bg-base/50 border border-border-card">
                        <span className="text-[9px] font-bold text-text-mut uppercase tracking-wide block mb-1">Team Avg</span>
                        <span className="text-lg font-extrabold text-brand-primary">{overallAvg}h</span>
                      </div>
                      <div className="text-center p-3 rounded-[12px] bg-bg-base/50 border border-border-card">
                        <span className="text-[9px] font-bold text-text-mut uppercase tracking-wide block mb-1">Top Performer</span>
                        <span className="text-sm font-extrabold text-text-main truncate block">{topPerformer.name.split(" ")[0]}</span>
                        <span className="text-[10px] font-bold text-emerald-500">{topPerformer.avgHours}h</span>
                      </div>
                      <div className="text-center p-3 rounded-[12px] bg-bg-base/50 border border-border-card">
                        <span className="text-[9px] font-bold text-text-mut uppercase tracking-wide block mb-1">On Target</span>
                        <span className="text-lg font-extrabold text-brand-success">{aboveTargetCount}</span>
                        <span className="text-[9px] text-text-mut font-semibold block">/ {employeeStats.length} staff</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        );
      })()}

      {/* ------------------ VIEW 5: NOTICE BOARD / RULES & LEAVES ------------------ */}
      {(activeTab === "rules" && (isAdminUser || can("read", "NoticeBoard"))) && (
        <>
          <div className="mb-6 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Notice Board Management</h1>
            <p className="text-sm text-text-sec mt-1">Configure company guidelines and upload upcoming official paid leaves.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* Left Column: Guidelines / Rules - Col-span 5 */}
            <div className="lg:col-span-5 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border-card">
                <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-main tracking-tight">Attendance Guidelines</h3>
                  <span className="text-[10px] text-text-mut font-semibold">Updates propagate to all user help popups</span>
                </div>
              </div>

              <form onSubmit={handleSaveRules} className="flex flex-col flex-grow space-y-4">
                <div className="flex flex-col gap-1.5 flex-grow">
                  <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider" htmlFor="rules-editor">Rules Content (One rule per line)</label>
                  <textarea
                    id="rules-editor"
                    className="w-full min-h-[300px] flex-grow p-4 border border-border-card rounded-[16px] bg-bg-base/30 text-xs text-text-main font-semibold leading-relaxed outline-none focus:bg-bg-card focus:border-brand-primary transition-all resize-none"
                    placeholder="Enter attendance rules, one per line..."
                    value={rulesInput}
                    onChange={(e) => setRulesInput(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] shadow-md shadow-brand-primary/10 transition-colors cursor-pointer"
                >
                  {actionLoading ? "Saving Rules..." : "Save & Propagate Rules"}
                </button>
              </form>
            </div>

            {/* Right Column: Paid Leaves Manager - Col-span 7 */}
            <div className="lg:col-span-7 space-y-8">
              {/* Publish Paid Leave Card */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-text-main tracking-tight mb-1 flex items-center gap-2">
                  <Calendar size={18} className="text-brand-primary" />
                  <span>Publish Official Paid Leave</span>
                </h3>
                <p className="text-[10px] text-text-mut font-bold uppercase tracking-wider mb-6">Declare holiday dates and benefits</p>

                <form onSubmit={handlePublishPaidLeave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-text-sec">Holiday Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Independence Day Holiday"
                        className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={leaveTitle}
                        onChange={(e) => setLeaveTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-sec">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-sec">End Date</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-sec">Publish Status</label>
                      <select
                        className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-bold outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                        value={leaveStatus}
                        onChange={(e) => setLeaveStatus(e.target.value)}
                        required
                      >
                        <option value="active">Active (Visible)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec">Holiday Description</label>
                    <textarea
                      placeholder="e.g. All operations will remain suspended. This day counts as fully paid leave."
                      className="w-full h-20 p-3.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all resize-none"
                      value={leaveDesc}
                      onChange={(e) => setLeaveDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] transition-colors shadow-md shadow-brand-primary/10 cursor-pointer"
                    >
                      {actionLoading ? "Publishing..." : "Publish Leave Announcement"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Published Paid Leaves List */}
              <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-text-main tracking-tight mb-4">Published Paid Leaves</h3>
                
                {paidLeaves.length === 0 ? (
                  <div className="text-center py-8 text-text-mut text-xs font-bold font-semibold">No official paid leaves published yet.</div>
                ) : (
                  <div className="space-y-3">
                    {paidLeaves.map((pl) => (
                      <div key={pl.id} className="p-4 border border-border-card rounded-[16px] bg-bg-base/20 hover:bg-bg-base/40 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-1.5 text-left flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-text-main">{pl.title}</span>
                            <span className="bg-brand-primary/10 text-brand-primary text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {pl.startDate && pl.endDate ? (
                                pl.startDate === pl.endDate ? (
                                  new Date(pl.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                                ) : (
                                  `${new Date(pl.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} - ${new Date(pl.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
                                )
                              ) : (
                                new Date(pl.date || pl.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTogglePaidLeaveStatus(pl.id, pl.title, pl.status)}
                              className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase transition-all cursor-pointer ${
                                (pl.status || "active") === "active"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20"
                              }`}
                              title="Click to toggle status"
                            >
                              {pl.status || "active"}
                            </button>
                          </div>
                          <p className="text-[11px] text-text-sec leading-relaxed font-semibold">{pl.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePaidLeave(pl)}
                          className="p-2 border border-red-500/20 text-red-500 rounded-[8px] bg-red-500/5 hover:bg-red-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                          title="Delete Paid Leave Announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ------------------ MODALS ------------------ */}

      {/* Employee Detail Modal */}
      {showDetailModal && selectedUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[600px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main">Employee Details</h3>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedUser(null); }} 
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center gap-4 bg-brand-primary/5 p-4 rounded-[16px] border border-brand-primary/10">
                <div className="w-16 h-16 rounded-full bg-brand-primary/15 text-brand-primary border-2 border-brand-primary/30 flex items-center justify-center font-black text-2xl uppercase shadow-md flex-shrink-0 overflow-hidden">{selectedUser.avatar ? <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" /> : (selectedUser.name ? getInitials(selectedUser.name) : "U")}</div>
                <div>
                  <h4 className="text-xl font-black text-text-main">{selectedUser.name}</h4>
                  <p className="text-xs text-text-mut font-semibold">{selectedUser.email}</p>
                  <p className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full inline-block mt-1 uppercase font-bold">{selectedUser.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Department</span>
                  <span className="text-sm font-bold text-text-main">{selectedUser.department || "—"}</span>
                </div>
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Designation</span>
                  <span className="text-sm font-bold text-text-main">{selectedUser.designation || "—"}</span>
                </div>
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Job Type</span>
                  <span className="text-sm font-bold text-text-main">{selectedUser.jobType || "Full-time"}</span>
                </div>
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Assigned Project</span>
                  <span className="text-sm font-bold text-text-main">{(selectedUser.projects && selectedUser.projects.length > 0) ? selectedUser.projects.join(', ') : (selectedUser.project || "—")}</span>
                </div>
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Date of Birth</span>
                  <span className="text-sm font-bold text-text-main">{selectedUser.dob || "—"}</span>
                </div>
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Joining Date</span>
                  <span className="text-sm font-bold text-text-main">{selectedUser.joiningDate || "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedUser.role !== "superadmin" && (
                  <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                    <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Shift Schedule</span>
                    <span className="text-sm font-bold text-text-main">{selectedUser.shiftStart || "10:00"} - {selectedUser.shiftEnd || "19:00"}</span>
                  </div>
                )}
                <div className="bg-bg-base/30 p-3 rounded-[12px] border border-border-card">
                  <span className="text-[10px] font-bold text-text-sec uppercase block mb-1">Program Type</span>
                  <span className="text-sm font-bold text-text-main">{selectedUser.programType || "Internship"}</span>
                </div>
              </div>

              <div className="bg-bg-base/30 p-4 rounded-[12px] border border-border-card mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold text-text-main">Assigned Tasks</h5>
                  <span className="text-[10px] text-text-mut">
                    {selectedUser.tasks?.filter(t => t.completed).length || 0} / {selectedUser.tasks?.length || 0} Completed
                  </span>
                </div>
                
                <div className="space-y-2">
                  {!selectedUser.tasks || selectedUser.tasks.length === 0 ? (
                    <p className="text-[10px] text-text-mut italic">No tasks assigned to this employee yet.</p>
                  ) : (
                    selectedUser.tasks.map((task, idx) => (
                      <div key={task.id || idx} className={`flex items-center gap-3 p-2.5 rounded-[8px] border ${task.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-bg-card border-border-card'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-emerald-500 text-white' : 'border border-text-mut'}`}>
                          {task.completed && <Check size={10} strokeWidth={4} />}
                        </div>
                        <span className={`text-xs font-semibold ${task.completed ? 'text-text-mut line-through' : 'text-text-main'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>


              <div className="bg-bg-base/30 p-4 rounded-[12px] border border-border-card mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold text-text-main">Attendance Records</h5>
                  <span className="text-[10px] text-text-mut">
                    {logs.filter(l => l.uid === selectedUser.uid).length} Records
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {logs.filter(l => l.uid === selectedUser.uid).length === 0 ? (
                    <p className="text-[10px] text-text-mut italic">No attendance records found.</p>
                  ) : (
                    logs.filter(l => l.uid === selectedUser.uid)
                    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                    .map((log, idx) => {
                      const checkIn = log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
                      const checkOut = log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
                      const totalHrs = log.totalWorkingMinutes ? (log.totalWorkingMinutes / 60).toFixed(2) : (log.checkInTime && !log.checkOutTime ? "Active" : "0.00");
                      
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-[8px] bg-bg-card border border-border-card">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-main">{log.date || "Unknown Date"}</span>
                            <span className="text-[10px] text-text-mut">{checkIn} - {checkOut}</span>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="text-xs font-bold text-brand-primary">{totalHrs === "Active" ? "Active" : `${totalHrs} hrs`}</span>
                            <span className="text-[10px] text-text-mut">{log.status || (log.checkOutTime ? "Present" : "Checked In")}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border-card mt-4">
              <button 
                onClick={() => { setShowDetailModal(false); openEditModal(selectedUser); }}
                className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add New Employee Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[500px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main">Add New Employee</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
                        <form onSubmit={handleAddNewEmployee} className="flex flex-col max-h-[85vh]">
              {/* TABS */}
              <div className="flex border-b border-border-card mb-4 overflow-x-auto scrollbar-none">
                {['Personal', 'Educational', 'Professional', 'Government & Identity', 'Employment', 'Banking'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setNewAddTab(tab)}
                    className={`py-2 px-4 text-xs font-bold whitespace-nowrap ${newAddTab === tab ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-mut hover:text-text-main'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-2">
                {newAddTab === 'Personal' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1 md:col-span-3">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Profile Photo (URL)</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} placeholder="e.g. https://..." />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Staff ID *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)} placeholder="e.g. ST1001" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">First Name *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newFirstName} onChange={(e) => { setNewFirstName(e.target.value); setNewName(e.target.value + ' ' + newLastName); }} placeholder="e.g. John" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Last Name *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newLastName} onChange={(e) => { setNewLastName(e.target.value); setNewName(newFirstName + ' ' + e.target.value); }} placeholder="e.g. Doe" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Work Email Address *</label>
                        <input type="email" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="e.g. john.doe@company.com" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Personal Email Address</label>
                        <input type="email" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newPersonalEmail} onChange={(e) => setNewPersonalEmail(e.target.value)} placeholder="e.g. john.doe@gmail.com" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Mobile Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newPersonalMobileNumber} onChange={(e) => setNewPersonalMobileNumber(e.target.value)} placeholder="e.g. 9876543210" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Date of Birth</label>
                        <input type="date" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newDob} onChange={(e) => { setNewDob(e.target.value); if(e.target.value) { const age = new Date().getFullYear() - new Date(e.target.value).getFullYear(); setNewAge(age.toString()); } }} max={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Age</label>
                        <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newAge} onChange={(e) => setNewAge(e.target.value)} placeholder="e.g. 28" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Gender</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newGender} onChange={(e) => setNewGender(e.target.value)}>
                          <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Marital Status</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newMaritalStatus} onChange={(e) => setNewMaritalStatus(e.target.value)}>
                          <option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Permanent Address</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newPermanentAddress} onChange={(e) => setNewPermanentAddress(e.target.value)} placeholder="e.g. 123 Street Name" />
                      </div>
                    </div>
                  </>
                )}

                {newAddTab === 'Educational' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Specialization / Degree</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Institute / College Name</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newInstituteName} onChange={(e) => setNewInstituteName(e.target.value)} placeholder="e.g. MIT" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Year of Completion</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newYearOfCompletion} onChange={(e) => setNewYearOfCompletion(e.target.value)} placeholder="e.g. 2021" />
                      </div>
                    </div>
                  </>
                )}

                {newAddTab === 'Professional' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Current Experience (Years)</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newCurrentExperience} onChange={(e) => setNewCurrentExperience(e.target.value)} placeholder="e.g. 3.5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Assigned Projects</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="e.g. Web App, API (comma separated)" />
                      </div>
                    </div>
                  </>
                )}

                {newAddTab === 'Government & Identity' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">UAN Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newUan} onChange={(e) => setNewUan(e.target.value)} placeholder="e.g. 10002345678" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">PAN Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newPan} onChange={(e) => setNewPan(e.target.value)} placeholder="e.g. ABCDE1234F" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Aadhar Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newAadharNum} onChange={(e) => setNewAadharNum(e.target.value)} placeholder="e.g. 1234 5678 9101" />
                      </div>
                    </div>
                  </>
                )}

                {newAddTab === 'Employment' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Department *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="e.g. Engineering" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Designation</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newDesignation} onChange={(e) => setNewDesignation(e.target.value)} placeholder="e.g. Developer" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Role</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                          <option value="Employee">Employee</option><option value="Project Manager">Project Manager</option><option value="Admin">Admin</option><option value="System Admin">System Admin</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Job Type</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newJobType} onChange={(e) => setNewJobType(e.target.value)}>
                          <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Employee Status</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newEmployeeStatus} onChange={(e) => setNewEmployeeStatus(e.target.value)}>
                          <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Leave">On Leave</option><option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Source of Hire</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newSourceOfHire} onChange={(e) => setNewSourceOfHire(e.target.value)} placeholder="e.g. LinkedIn" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Reporting Manager</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newReportingManager} onChange={(e) => setNewReportingManager(e.target.value)} placeholder="e.g. Jane Doe" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Joining Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newJoiningDate} onChange={(e) => setNewJoiningDate(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Date of Exit</label>
                        <input type="date" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newDateOfExit} onChange={(e) => setNewDateOfExit(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Location</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Bangalore" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Unit</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="e.g. Unit 1" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Grade</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="e.g. G3" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Cost Center</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newCostCenter} onChange={(e) => setNewCostCenter(e.target.value)} placeholder="e.g. CC001" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">PF Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newPfNo} onChange={(e) => setNewPfNo(e.target.value)} placeholder="e.g. PF123456" />
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-2 col-span-3">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Shift Type *</label>
                        <div className="flex gap-2">
                          <button type="button" className={`flex-1 py-1.5 px-2 border rounded-[8px] text-[11px] font-bold transition-all ${newShiftType === 'Morning' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-card text-text-main'}`} onClick={() => { setNewShiftType('Morning'); setNewShiftStart('09:00'); setNewShiftEnd('18:00'); }}>Morning Shift</button>
                          <button type="button" className={`flex-1 py-1.5 px-2 border rounded-[8px] text-[11px] font-bold transition-all ${newShiftType === 'Night' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-card text-text-main'}`} onClick={() => { setNewShiftType('Night'); setNewShiftStart('21:00'); setNewShiftEnd('06:00'); }}>Night Shift</button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-sec uppercase">Annual Leaves</label>
                          <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none" value={newAnnual} onChange={(e) => setNewAnnual(Number(e.target.value))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-sec uppercase">Sick Leaves</label>
                          <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none" value={newSick} onChange={(e) => setNewSick(Number(e.target.value))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-sec uppercase">Casual Leaves</label>
                          <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none" value={newCasual} onChange={(e) => setNewCasual(Number(e.target.value))} required />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {newAddTab === 'Banking' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Bank Account Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newBankAcNo} onChange={(e) => setNewBankAcNo(e.target.value)} placeholder="e.g. 1234567890" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">IFSC Code</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={newIfscCode} onChange={(e) => setNewIfscCode(e.target.value)} placeholder="e.g. SBIN0001234" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-border-card pt-4 mt-4 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="py-2.5 px-4 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold transition-colors cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 px-5 bg-brand-primary hover:bg-brand-hover shadow-md shadow-brand-primary/20 text-white text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Registering..." : "Add Staff Member"}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[500px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main">Edit User Profile</h3>
              <button 
                onClick={() => { setShowEditModal(false); setSelectedUser(null); }} 
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
                        <form onSubmit={handleSaveUserEdit} className="flex flex-col max-h-[85vh]">
              {/* TABS */}
              <div className="flex border-b border-border-card mb-4 overflow-x-auto scrollbar-none">
                {['Personal', 'Educational', 'Professional', 'Government & Identity', 'Employment', 'Banking'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEditTab(tab)}
                    className={`py-2 px-4 text-xs font-bold whitespace-nowrap ${editTab === tab ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-mut hover:text-text-main'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-2">
                {editTab === 'Personal' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Profile Photo (URL)</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editPhoto} onChange={(e) => setEditPhoto(e.target.value)} placeholder="e.g. https://..." />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Staff ID</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} placeholder="e.g. ST1001" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">First Name *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editFirstName} onChange={(e) => { setEditFirstName(e.target.value); setEditName(e.target.value + ' ' + editLastName); }} placeholder="e.g. John" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Last Name *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editLastName} onChange={(e) => { setEditLastName(e.target.value); setEditName(editFirstName + ' ' + e.target.value); }} placeholder="e.g. Doe" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Full Name * (Derived)</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. John Doe" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Personal Email Address</label>
                        <input type="email" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editPersonalEmail} onChange={(e) => setEditPersonalEmail(e.target.value)} placeholder="e.g. john.doe@gmail.com" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Mobile Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editPersonalMobileNumber} onChange={(e) => setEditPersonalMobileNumber(e.target.value)} placeholder="e.g. 9876543210" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Date of Birth</label>
                        <input type="date" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editDob} onChange={(e) => { setEditDob(e.target.value); if(e.target.value) { const age = new Date().getFullYear() - new Date(e.target.value).getFullYear(); setEditAge(age.toString()); } }} max={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Age</label>
                        <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editAge} onChange={(e) => setEditAge(e.target.value)} placeholder="e.g. 28" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Gender</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                          <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Marital Status</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editMaritalStatus} onChange={(e) => setEditMaritalStatus(e.target.value)}>
                          <option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Permanent Address</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editPermanentAddress} onChange={(e) => setEditPermanentAddress(e.target.value)} placeholder="e.g. 123 Street Name" />
                      </div>
                    </div>
                  </>
                )}

                {editTab === 'Educational' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Specialization / Degree</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editSpecialization} onChange={(e) => setEditSpecialization(e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Institute / College Name</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editInstituteName} onChange={(e) => setEditInstituteName(e.target.value)} placeholder="e.g. MIT" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Year of Completion</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editYearOfCompletion} onChange={(e) => setEditYearOfCompletion(e.target.value)} placeholder="e.g. 2021" />
                      </div>
                    </div>
                  </>
                )}

                {editTab === 'Professional' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Current Experience (Years)</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editCurrentExperience} onChange={(e) => setEditCurrentExperience(e.target.value)} placeholder="e.g. 3.5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Assigned Projects</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editProject} onChange={(e) => setEditProject(e.target.value)} placeholder="e.g. Web App, API (comma separated)" />
                      </div>
                    </div>
                  </>
                )}

                {editTab === 'Government & Identity' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">UAN Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editUan} onChange={(e) => setEditUan(e.target.value)} placeholder="e.g. 10002345678" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">PAN Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editPan} onChange={(e) => setEditPan(e.target.value)} placeholder="e.g. ABCDE1234F" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Aadhar Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editAadharNum} onChange={(e) => setEditAadharNum(e.target.value)} placeholder="e.g. 1234 5678 9101" />
                      </div>
                    </div>
                  </>
                )}

                {editTab === 'Employment' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Department *</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editDept} onChange={(e) => setEditDept(e.target.value)} placeholder="e.g. Engineering" required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Designation</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="e.g. Developer" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Role</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                          <option value="Employee">Employee</option><option value="Project Manager">Project Manager</option><option value="Admin">Admin</option><option value="System Admin">System Admin</option>
                          {customRoles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2 mt-2 mb-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-text-main cursor-pointer p-3 border border-border-card rounded-[8px] bg-bg-base/30">
                          <input 
                            type="checkbox" 
                            checked={editAllowManualCheckIn} 
                            onChange={(e) => setEditAllowManualCheckIn(e.target.checked)}
                            className="w-4 h-4 text-brand-primary"
                          />
                          Allow Manual Check-In (Bypass Geofence / WFH)
                        </label>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Job Type</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editJobType} onChange={(e) => setEditJobType(e.target.value)}>
                          <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Employee Status</label>
                        <select className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editEmployeeStatus} onChange={(e) => setEditEmployeeStatus(e.target.value)}>
                          <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Leave">On Leave</option><option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Source of Hire</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editSourceOfHire} onChange={(e) => setEditSourceOfHire(e.target.value)} placeholder="e.g. LinkedIn" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Reporting Manager</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editReportingManager} onChange={(e) => setEditReportingManager(e.target.value)} placeholder="e.g. Jane Doe" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Joining Date</label>
                        <input type="date" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editJoiningDate} onChange={(e) => setEditJoiningDate(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Date of Exit</label>
                        <input type="date" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editDateOfExit} onChange={(e) => setEditDateOfExit(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Location</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Bangalore" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Unit</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} placeholder="e.g. Unit 1" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Grade</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="e.g. G3" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Cost Center</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editCostCenter} onChange={(e) => setEditCostCenter(e.target.value)} placeholder="e.g. CC001" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">PF Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editPfNo} onChange={(e) => setEditPfNo(e.target.value)} placeholder="e.g. PF123456" />
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-2 sm:col-span-2">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Shift Type *</label>
                        <div className="flex gap-2">
                          <button type="button" className={`flex-1 py-1.5 px-2 border rounded-[8px] text-[11px] font-bold transition-all ${editShiftStart === '09:00' || editShiftType === 'Morning' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-card text-text-main'}`} onClick={() => { setEditShiftType('Morning'); setEditShiftStart('09:00'); setEditShiftEnd('18:00'); }}>Morning Shift</button>
                          <button type="button" className={`flex-1 py-1.5 px-2 border rounded-[8px] text-[11px] font-bold transition-all ${editShiftStart === '21:00' || editShiftType === 'Night' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-card text-text-main'}`} onClick={() => { setEditShiftType('Night'); setEditShiftStart('21:00'); setEditShiftEnd('06:00'); }}>Night Shift</button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:col-span-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-sec uppercase">Annual Leaves</label>
                          <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none" value={editAnnual} onChange={(e) => setEditAnnual(Number(e.target.value))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-sec uppercase">Sick Leaves</label>
                          <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none" value={editSick} onChange={(e) => setEditSick(Number(e.target.value))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-sec uppercase">Casual Leaves</label>
                          <input type="number" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none" value={editCasual} onChange={(e) => setEditCasual(Number(e.target.value))} required />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {editTab === 'Banking' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">Bank Account Number</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editBankAcNo} onChange={(e) => setEditBankAcNo(e.target.value)} placeholder="e.g. 1234567890" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-sec uppercase">IFSC Code</label>
                        <input type="text" className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-base/30 text-xs text-text-main outline-none focus:border-brand-primary" value={editIfscCode} onChange={(e) => setEditIfscCode(e.target.value)} placeholder="e.g. SBIN0001234" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-border-card pt-4 mt-4 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setSelectedUser(null); }} 
                  className="py-2.5 px-4 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold transition-colors cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 px-5 bg-brand-primary hover:bg-brand-hover shadow-md shadow-brand-primary/20 text-white text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* Delete User Confirm Modal */}
      {showDeleteConfirm && selectedUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[440px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-brand-danger">Delete User Profile</h3>
              <button 
                onClick={() => { setShowDeleteConfirm(false); setSelectedUser(null); }} 
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6 text-sm text-text-sec leading-relaxed">
              <p>Are you sure you want to delete the profile for <strong>{selectedUser.name}</strong> ({selectedUser.email})?</p>
              <p className="text-brand-danger font-bold text-xs flex items-center gap-1">
                <AlertTriangle size={18} className='text-amber-500 inline-block mr-1' /> Warning: This action is permanent and will remove the user record from the database directory.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowDeleteConfirm(false); setSelectedUser(null); }} 
                className="py-2.5 px-4 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDeleteUser} 
                className="py-2.5 px-5 bg-brand-danger text-white text-xs font-bold rounded-[12px] hover:bg-brand-danger-hover transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Paid Leave Confirm Modal */}
      {showDeletePaidLeaveConfirm && selectedPaidLeave && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[440px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-brand-danger">Delete Paid Leave</h3>
              <button 
                onClick={() => { setShowDeletePaidLeaveConfirm(false); setSelectedPaidLeave(null); }} 
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6 text-sm text-text-sec leading-relaxed">
              <p>Are you sure you want to delete the paid leave announcement for <strong>{selectedPaidLeave.title}</strong>?</p>
              <p className="text-brand-danger font-bold text-xs flex items-center gap-1">
                <AlertTriangle size={18} className='text-amber-500 inline-block mr-1' /> Warning: This action is permanent and will remove the announcement from the system.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowDeletePaidLeaveConfirm(false); setSelectedPaidLeave(null); }} 
                className="py-2.5 px-4 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePaidLeave} 
                className="py-2.5 px-5 bg-brand-danger text-white text-xs font-bold rounded-[12px] hover:bg-brand-danger-hover transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete Announcement"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── CHAT MONITOR TAB ─── */}
      {(activeTab === "chat" && (isAdminUser || can("read", "TeamHub"))) && (() => {
        const getThreadLabel = (msg) => {
          if (msg.threadType === "channel") {
            const ch = chatChannels.find(c => c.id === msg.threadId);
            return "#" + (ch?.displayName || ch?.name || msg.threadId);
          }
          const dm = chatDmThreads.find(d => d.id === msg.threadId);
          if (dm) {
            const ids = dm.participantIds || [];
            const names = ids.map(id => dm.participantNames?.[id] || id);
            return "DM: " + names.join(" ↔ ");
          }
          return "DM: " + msg.threadId;
        };

        const filteredMsgs = chatMessages.filter(m => {
          const matchType = chatTypeFilter === "all" || m.threadType === chatTypeFilter;
          const matchThread = chatThreadFilter === "all" || m.threadId === chatThreadFilter;
          const matchStatus = chatStatusFilter === "all" ||
            (chatStatusFilter === "deleted" && m.isDeleted) ||
            (chatStatusFilter === "active" && !m.isDeleted);
          const q = chatFilter.toLowerCase();
          const matchSearch = !chatFilter ||
            (m.senderName || "").toLowerCase().includes(q) ||
            (m.text || "").toLowerCase().includes(q) ||
            getThreadLabel(m).toLowerCase().includes(q);
          return matchType && matchThread && matchStatus && matchSearch;
        });

        const handleDeleteMsg = async (id) => {
          showConfirm("Delete Message", "Are you sure you want to delete this message? It will be marked as deleted in chat but retained here in Chat Monitor.", async () => {
            await deleteChatMessage(id);
            setChatMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, deletedBy: currentUser.name || "Admin" } : m));
            showToast("Message deleted", "success");
          }, { confirmText: "Delete", cancelText: "Cancel" });
        };

        const handleExportChat = () => {
          const rows = [
            ["Timestamp", "Type", "Thread", "Sender", "Message", "File Name", "File URL"]
          ];
          filteredMsgs.forEach(m => {
            let fileUrl = m.fileData?.url || "";
            if (fileUrl.startsWith("data:") && fileUrl.length > 500) {
              fileUrl = "[Embedded File Data]";
            }
            
            const rowData = [
              m.timestamp ? new Date(m.timestamp).toLocaleString() : "",
              m.threadType,
              getThreadLabel(m),
              m.senderName,
              m.isDeleted ? `[DELETED] ${m.text || ""}` : (m.text || ""),
              m.fileData?.name || "",
              fileUrl
            ];
            
            // Truncate to avoid Excel's 32,767 character limit per cell
            rows.push(rowData.map(val => String(val).substring(0, 32000)));
          });
          const ws = XLSX.utils.aoa_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Chat Log");
          const max_len = {};
          rows.forEach(row => row.forEach((val, i) => {
            max_len[i] = Math.max(max_len[i] || 10, String(val || "").length);
          }));
          // Prevent column width from exceeding 255 (Excel limit)
          ws["!cols"] = Object.keys(max_len).map(i => ({ wch: Math.min(max_len[i] + 3, 250) }));
          XLSX.writeFile(wb, `Chat_Monitor_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
          showToast("Chat log exported!", "success");
        };

        const handleRecoverChat = async () => {
          showToast("Recovering Carrezza chat data...", "info");
          const res = await recoverChatData();
          if (res.success) {
            showToast(res.msg, "success");
          } else {
            showToast(res.msg, "error");
          }
        };

        const uniqueThreads = [...new Set(chatMessages.map(m => m.threadId))];

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">Chat Monitor</h1>
                <p className="text-sm text-text-sec mt-1">View, search and moderate all team messages and direct conversations.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRecoverChat}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-500 text-sm font-bold rounded-[12px] hover:bg-amber-500 hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  <ShieldAlert size={15} /> Recover Chat Data
                </button>
                <button
                  onClick={handleExportChat}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-[12px] hover:bg-brand-hover transition-colors cursor-pointer shadow-md"
                >
                  <Download size={15} /> Export Chat Log
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Messages", val: chatMessages.length, icon: <MessageSquare size={18} className='inline-block mr-1' />, color: "text-brand-primary", filter: "all" },
                { label: "Deleted Messages", val: chatMessages.filter(m => m.isDeleted).length, icon: <Trash2 size={18} className='inline-block mr-1' />, color: "text-red-500", filter: "deleted" },
                { label: "Channels", val: chatChannels.length, icon: "#", color: "text-indigo-500" },
                { label: "DM Threads", val: chatDmThreads.length, icon: <Mail size={18} className='inline-block mr-1' />, color: "text-amber-500" }
              ].map((s, i) => (
                <div 
                  key={i} 
                  onClick={() => s.filter && setChatStatusFilter(prev => prev === s.filter ? "all" : s.filter)}
                  className={`bg-bg-card border border-border-card rounded-[16px] p-4 flex items-center gap-3 ${s.filter ? "cursor-pointer hover:border-brand-primary/40 transition-colors" : ""} ${s.filter && chatStatusFilter === s.filter ? "ring-2 ring-brand-primary" : ""}`}
                >
                  <span className={`text-2xl font-black ${s.color}`}>{s.icon}</span>
                  <div>
                    <div className="text-[10px] font-bold text-text-mut uppercase tracking-wider">{s.label}</div>
                    <div className="text-2xl font-extrabold text-text-main">{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 bg-bg-card border border-border-card rounded-[16px] p-4">
              <div className="flex items-center gap-2 bg-bg-base border border-border-card rounded-[10px] px-3 py-2 min-w-[200px] flex-1">
                <Search size={14} className="text-text-mut" />
                <input
                  type="text"
                  value={chatFilter}
                  onChange={e => setChatFilter(e.target.value)}
                  placeholder="Search messages, users, channels..."
                  className="bg-transparent text-sm text-text-main outline-none flex-1"
                />
              </div>
              <select
                value={chatStatusFilter}
                onChange={e => setChatStatusFilter(e.target.value)}
                className="bg-bg-base border border-border-card text-text-main text-xs font-semibold rounded-[10px] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="deleted">Deleted Messages Only</option>
                <option value="active">Active Messages Only</option>
              </select>
              <select
                value={chatTypeFilter}
                onChange={e => { setChatTypeFilter(e.target.value); setChatThreadFilter("all"); }}
                className="bg-bg-base border border-border-card text-text-main text-xs font-semibold rounded-[10px] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="channel">Channels Only</option>
                <option value="dm">DMs Only</option>
              </select>
              <select
                value={chatThreadFilter}
                onChange={e => setChatThreadFilter(e.target.value)}
                className="bg-bg-base border border-border-card text-text-main text-xs font-semibold rounded-[10px] px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">All Threads</option>
                {uniqueThreads.map(tid => (
                  <option key={tid} value={tid}>
                    {chatMessages.find(m => m.threadId === tid) ? getThreadLabel(chatMessages.find(m => m.threadId === tid)) : tid}
                  </option>
                ))}
              </select>
            </div>

            {/* Messages Table */}
            <div className="bg-bg-card border border-border-card rounded-[20px] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-card flex items-center justify-between">
                <span className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  {filteredMsgs.length} message{filteredMsgs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {chatLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-text-mut">Loading chat history...</p>
                </div>
              ) : filteredMsgs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-2xl mb-2"><MessageSquare size={18} className='inline-block mr-1' /></p>
                  <p className="text-sm font-semibold text-text-mut">No messages found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-card bg-bg-base">
                        {["Timestamp", "Type", "Thread / Channel", "Sender", "Message", "Attachment", "Actions"].map(h => (
                          <th key={h} className="text-[10px] font-extrabold text-text-mut uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMsgs.slice((chatPage - 1) * 20, chatPage * 20).map(msg => (
                        <tr key={msg.id} className={`border-b border-border-card hover:bg-bg-base transition-colors ${msg.isDeleted ? "bg-red-500/5" : ""}`}>
                          <td className="px-4 py-3 text-[11px] text-text-mut whitespace-nowrap">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.threadType === "channel" ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-500"}`}>
                              {msg.threadType === "channel" ? "Channel" : "DM"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-text-sec whitespace-nowrap">
                            {getThreadLabel(msg)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[9px] font-bold overflow-hidden">{(users.find(u => u.uid === msg.senderId)?.avatar) ? <img src={users.find(u => u.uid === msg.senderId).avatar} alt={msg.senderName} className="w-full h-full object-cover" /> : ((msg.senderName || "?").charAt(0).toUpperCase())}</div>
                              <span className="text-xs font-semibold text-text-main whitespace-nowrap">{msg.senderName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[280px]">
                            {msg.isDeleted ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 w-fit">
                                  <Trash2 size={10} /> Deleted {msg.deletedBy ? `by ${msg.deletedBy}` : ""}
                                </span>
                                <span className="text-xs text-red-400/90 line-through line-clamp-2" title={msg.text}>
                                  {msg.text || <span className="text-text-mut italic">—</span>}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-text-sec line-clamp-2" title={msg.text}>{msg.text || <span className="text-text-mut italic">—</span>}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {msg.fileData ? (
                              <a
                                href={msg.fileData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-1 whitespace-nowrap"
                              >
                                <Paperclip size={18} className='inline-block mr-1' /> {msg.fileData.name?.substring(0, 20) || "File"}
                              </a>
                            ) : <span className="text-text-mut text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteMsg(msg.id)}
                              className="p-1.5 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-colors cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {Math.ceil(filteredMsgs.length / 20) > 1 && (
                  <div className="px-5 py-3 border-t border-border-card flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider">
                      Page {chatPage} of {Math.ceil(filteredMsgs.length / 20)}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setChatPage(p => Math.max(1, p - 1))}
                        disabled={chatPage === 1}
                        className="px-3 py-1.5 bg-bg-base border border-border-card text-text-main text-xs font-bold rounded-[8px] hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setChatPage(p => Math.min(Math.ceil(filteredMsgs.length / 20), p + 1))}
                        disabled={chatPage === Math.ceil(filteredMsgs.length / 20)}
                        className="px-3 py-1.5 bg-bg-base border border-border-card text-text-main text-xs font-bold rounded-[8px] hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>

            {/* Channels Overview */}
            {chatChannels.length > 0 && (
              <div className="bg-bg-card border border-border-card rounded-[20px] p-5">
                <h3 className="text-sm font-extrabold text-text-main mb-4 flex items-center gap-2">
                  <span className="text-lg">#</span> Channels Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {chatChannels.map(ch => (
                    <div key={ch.id} className="flex items-start gap-3 p-3 bg-bg-base rounded-[12px] border border-border-card">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm flex-shrink-0">#</div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-main truncate">{ch.displayName || ch.name}</div>
                        <div className="text-[10px] text-text-mut truncate">{ch.description || "No description"}</div>
                        <div className="text-[10px] text-text-mut mt-0.5">{ch.memberIds?.length || 0} members · by {ch.createdByName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ------------------ VIEW 7: ASSET MANAGEMENT ------------------ */}
      {(activeTab === "assets" && (isAdminUser || can("read", "Assets"))) && (() => {
        // Filter assets by search query, status, and category
        const filteredAssets = assets.filter((asset) => {
          const matchSearch =
            (asset.name || "").toLowerCase().includes(assetSearch.toLowerCase()) ||
            (asset.serialNumber || "").toLowerCase().includes(assetSearch.toLowerCase()) ||
            (asset.assignedUserName || "").toLowerCase().includes(assetSearch.toLowerCase());
          const matchCategory = assetCategoryFilter === "all" || 
            (Array.isArray(asset.category) ? asset.category.includes(assetCategoryFilter) : asset.category === assetCategoryFilter);
          const matchStatus = assetStatusFilter === "all" || asset.status === assetStatusFilter;
          return matchSearch && matchCategory && matchStatus;
        });

        // Pagination for assets
        const assetsPerPage = rowsPerPage;
        const assetsStartIndex = (assetsPage - 1) * assetsPerPage;
        const paginatedAssets = filteredAssets.slice(assetsStartIndex, assetsStartIndex + assetsPerPage);
        const assetsTotalPages = Math.ceil(filteredAssets.length / assetsPerPage) || 1;

        const canManageAssetsGlobal = currentUser?.role === "admin" || currentUser?.role === "superadmin" || (currentUser?.name || "").toLowerCase().includes("super admin") || (currentUser?.name || "").toLowerCase().includes("system admin");

        return (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Asset Management</h1>
                <p className="text-sm text-text-sec mt-1">Register, track, and assign organization devices (laptops, headsets, chargers, etc.)</p>
              </div>
              <div className="flex gap-2 self-start sm:self-center">
                <button 
                  onClick={handleExportAssetsExcel} 
                  className="flex items-center gap-1.5 py-2.5 px-4 border border-emerald-500/30 text-xs font-bold rounded-[12px] bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Download size={14} /> 
                  <span>Excel</span>
                </button>
                <button 
                  onClick={handleExportAssetsPDF} 
                  className="flex items-center gap-1.5 py-2.5 px-4 border border-red-500/30 text-xs font-bold rounded-[12px] bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                >
                  <FileText size={14} /> 
                  <span>PDF</span>
                </button>
                {canManageAssetsGlobal && (
                  <>
                    <button
                      onClick={handleOpenAssignAssetsModal}
                      className="py-2.5 px-4 bg-bg-card border border-border-card text-text-sec hover:text-text-main text-xs font-bold rounded-[12px] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus size={16} />
                      <span>Assign Assets</span>
                    </button>
                    <button
                      onClick={handleOpenAddAssetModal}
                      className="py-2.5 px-4 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] shadow-md shadow-brand-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Add Asset</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut font-semibold" size={16} />
                <input
                  type="text"
                  placeholder="Search assets name, serial, employee..."
                  className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-card text-xs text-text-main outline-none focus:border-brand-primary transition-all"
                  value={assetSearch}
                  onChange={(e) => {
                    setAssetSearch(e.target.value);
                    setAssetsPage(1);
                  }}
                />
              </div>

              <div>
                <select
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-card text-xs text-text-main outline-none focus:border-brand-primary transition-all cursor-pointer"
                  value={assetCategoryFilter}
                  onChange={(e) => {
                    setAssetCategoryFilter(e.target.value);
                    setAssetsPage(1);
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="Laptop">Laptops</option>
                  <option value="Headset">Headsets</option>
                  <option value="Charger">Chargers</option>
                  <option value="Keyboard">Keyboards</option>
                  <option value="Mouse">Mice</option>
                  <option value="Monitor">Monitors</option>
                  <option value="Mobile">Mobiles</option>
                  <option value="Other">Others</option>
                </select>
              </div>

              <div>
                <select
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-card text-xs text-text-main outline-none focus:border-brand-primary transition-all cursor-pointer"
                  value={assetStatusFilter}
                  onChange={(e) => {
                    setAssetStatusFilter(e.target.value);
                    setAssetsPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Under Repair">Under Repair</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            {/* Assets Table */}
            <div className="bg-bg-card border border-border-card rounded-[24px] overflow-hidden shadow-sm text-left">
              {filteredAssets.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
                    <HardDrive size={22} />
                  </div>
                  <p className="text-sm font-bold text-text-main">No assets found</p>
                  <p className="text-xs text-text-mut mt-1">Try resetting your search filters or add a new device.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-card bg-bg-base/30">
                          {["Asset Details", "Category", "Serial Number", "Status", "Assigned To", "Date Assigned", "Authority", "Actions"].map((h) => (
                            <th
                              key={h}
                              className="text-[10px] font-extrabold text-text-mut uppercase tracking-wider px-6 py-4 text-left whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssets.map((asset) => {
                          let statusColor = "bg-green-500/10 text-green-500 border border-green-500/20";
                          if (asset.status === "Assigned") {
                            statusColor = "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
                          } else if (asset.status === "Under Repair") {
                            statusColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                          } else if (asset.status === "Retired") {
                            statusColor = "bg-red-500/10 text-red-500 border border-red-500/20";
                          }

                          return (
                            <tr key={asset.id} className="border-b border-border-card hover:bg-bg-base/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-xs text-text-main">{asset.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs text-text-sec font-semibold">
                                  {Array.isArray(asset.category) ? asset.category.join(", ") : (asset.category || "Other")}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-text-sec">
                                {asset.serialNumber}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                                  {asset.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {asset.assignedUserId ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[9px] font-bold overflow-hidden">{(users.find(u => u.uid === asset.assignedUserId)?.avatar) ? <img src={users.find(u => u.uid === asset.assignedUserId).avatar} alt={asset.assignedUserName} className="w-full h-full object-cover" /> : ((asset.assignedUserName || "?").charAt(0).toUpperCase())}</div>
                                    <span className="text-xs font-semibold text-text-main whitespace-nowrap">{asset.assignedUserName}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-text-mut italic">Unassigned</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-xs text-text-sec whitespace-nowrap font-semibold">
                                {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : "—"}
                              </td>
                              <td className="px-6 py-4 text-xs text-text-sec whitespace-nowrap font-semibold">
                                {asset.assigningAuthorityName || "—"}
                              </td>
                              <td className="px-6 py-4">
                                {canEditAsset(asset) ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenEditAssetModal(asset)}
                                      className="p-1.5 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded-[6px] transition-colors cursor-pointer"
                                      title="Edit asset"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAssetClick(asset.id, asset.name)}
                                      className="p-1.5 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-colors cursor-pointer"
                                      title="Delete asset"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[10px] text-text-mut font-semibold bg-bg-base px-2.5 py-1 rounded-[8px] border border-border-card/60 w-fit select-none">
                                    <Lock size={10} className="text-text-mut/80" />
                                    <span>Locked</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filteredAssets.length > assetsPerPage && (
                    <div className="p-4 border-t border-border-card flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-text-mut font-semibold">
                          Showing {assetsStartIndex + 1} to {Math.min(filteredAssets.length, assetsStartIndex + assetsPerPage)} of {filteredAssets.length} entries
                        </span>
                        <select 
                          value={rowsPerPage} 
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setLivePage(1); setUsersPage(1); setLeavesPendingPage(1); setRegsPendingPage(1); setHistoryPage(1); setAssetsPage(1);
                          }}
                          className="px-2 py-1 bg-bg-card border border-border-card rounded-[6px] text-xs font-bold text-text-sec cursor-pointer outline-none focus:border-brand-primary"
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={50}>50 / page</option>
                          <option value={100}>100 / page</option>
                        </select>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          disabled={assetsPage === 1}
                          onClick={() => setAssetsPage(p => p - 1)}
                          className="px-3 py-1.5 bg-bg-base border border-border-card rounded-[8px] text-xs font-bold text-text-sec hover:text-text-main transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          disabled={assetsPage === assetsTotalPages}
                          onClick={() => setAssetsPage(p => p + 1)}
                          className="px-3 py-1.5 bg-bg-base border border-border-card rounded-[8px] text-xs font-bold text-text-sec hover:text-text-main transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Asset Add/Edit Modal */}
      {showAssetModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[550px] bg-bg-card border border-border-card/85 rounded-[24px] p-6 shadow-2xl shadow-brand-primary/5 animate-scale-up relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Premium Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-hover" />
            
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-card flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-brand-primary/20 to-brand-hover/10 text-brand-primary flex items-center justify-center border border-brand-primary/10">
                  <Laptop size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-text-main tracking-tight">
                    {isEditingAsset ? "Edit Asset Registry" : "Add New Asset"}
                  </h3>
                  <p className="text-[10px] text-text-mut font-bold uppercase tracking-wider">Asset Configuration Panel</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAssetModal(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-base border border-border-card text-text-mut hover:text-text-main hover:border-brand-primary/40 hover:rotate-90 transition-all duration-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAsset} className="flex-1 overflow-y-auto pr-1 space-y-5 py-1">
              {/* Asset Specs Section */}
              <div className="bg-bg-base/30 dark:bg-slate-900/10 rounded-[18px] p-5 border border-border-card space-y-4">
                <div className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Laptop size={12} />
                  <span>Asset Specifications</span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Asset Name</label>
                  <div className="relative flex items-center">
                    <Laptop size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all font-semibold shadow-sm" 
                      value={assetFormName}
                      onChange={(e) => setAssetFormName(e.target.value)}
                      placeholder="e.g. Dell Latitude 5420"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
                    <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Category</label>
                    <div className="relative flex items-center">
                      <Layers size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="w-full pl-10 pr-10 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all cursor-pointer font-semibold shadow-sm flex items-center justify-between text-left"
                      >
                        <span className="truncate">
                          {assetFormCategory.length === 0 
                            ? "Select Categories" 
                            : assetFormCategory.join(", ")}
                        </span>
                        <ChevronDown size={14} className="text-text-mut/70 pointer-events-none flex-shrink-0" />
                      </button>
                    </div>
                    {showCategoryDropdown && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-bg-card border border-border-card rounded-[14px] shadow-xl p-3 space-y-2.5 max-h-[220px] overflow-y-auto animate-scale-up">
                        {["Laptop", "Headset", "Charger", "Keyboard", "Mouse", "Monitor", "Mobile", "Other"].map((cat) => {
                          const isChecked = assetFormCategory.includes(cat);
                          return (
                            <label key={cat} className="flex items-center gap-2.5 text-xs font-bold text-text-sec hover:text-text-main cursor-pointer select-none py-0.5 transition-colors">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setAssetFormCategory(prev => prev.filter(c => c !== cat));
                                  } else {
                                    setAssetFormCategory(prev => [...prev, cat]);
                                  }
                                }}
                                className="rounded-[4px] border-border-card text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4 transition-all accent-brand-primary"
                              />
                              <span>{cat}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Serial Number / ID</label>
                    <div className="relative flex items-center">
                      <Hash size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all font-mono font-semibold shadow-sm" 
                        value={assetFormSerial}
                        onChange={(e) => setAssetFormSerial(e.target.value)}
                        placeholder="e.g. SN-Dell-98A"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Details Section */}
              <div className="bg-bg-base/30 dark:bg-slate-900/10 rounded-[18px] p-5 border border-border-card space-y-4">
                <div className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <UserPlus size={12} />
                  <span>Assignment Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Status</label>
                    <div className="relative flex items-center">
                      <Activity size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                      <select 
                        className="w-full pl-10 pr-10 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all cursor-pointer font-semibold shadow-sm appearance-none"
                        value={assetFormStatus}
                        onChange={(e) => setAssetFormStatus(e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Under Repair">Under Repair</option>
                        <option value="Retired">Retired</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 text-text-mut/70 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Assign to Employee</label>
                    <div className="relative flex items-center">
                      <Users size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                      <select 
                        className="w-full pl-10 pr-10 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all cursor-pointer font-semibold shadow-sm appearance-none"
                        value={assetFormAssignedUser}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAssetFormAssignedUser(val);
                          if (val) {
                            setAssetFormStatus("Assigned");
                          } else if (assetFormStatus === "Assigned") {
                            setAssetFormStatus("Available");
                          }
                        }}
                      >
                        <option value="">Unassigned / Available</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name} ({u.department || "No Dept"})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 text-text-mut/70 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {(assetFormStatus === "Assigned" || assetFormAssignedUser) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-card/60 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Date of Assigning</label>
                      <div className="relative flex items-center">
                        <Calendar size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                        <input 
                          type="date" 
                          className="w-full pl-10 pr-4 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all font-semibold shadow-sm" 
                          value={assetFormAssignedDate}
                          onChange={(e) => setAssetFormAssignedDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Assigning Authority</label>
                      <div className="relative flex items-center">
                        <Shield size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                        <select 
                          className="w-full pl-10 pr-10 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all cursor-pointer font-semibold shadow-sm appearance-none"
                          value={assetFormAssigningAuthority}
                          onChange={(e) => setAssetFormAssigningAuthority(e.target.value)}
                          required
                        >
                          <option value="">Select Authority</option>
                          {users.filter(u => 
                            (u.role === "admin" || u.role === "superadmin" || u.role === "systemadmin" || u.role === "system admin") &&
                            !(u.name || "").toLowerCase().includes("zoho")
                          ).map((u) => (
                            <option key={u.uid} value={u.uid}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 text-text-mut/70 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-card flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="py-2.5 px-5 text-xs font-bold text-text-sec hover:text-text-main hover:bg-bg-base rounded-[14px] transition-all cursor-pointer border border-transparent hover:border-border-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assetLoading}
                  className="py-2.5 px-6 bg-gradient-to-r from-brand-primary to-brand-hover text-white text-xs font-bold rounded-[14px] shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/35 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  {assetLoading ? "Saving..." : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Assign Assets Modal */}
      {showAssignAssetsModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in text-left">
          <div className="w-full max-w-[550px] bg-bg-card border border-border-card/85 rounded-[24px] p-6 shadow-2xl shadow-brand-primary/5 animate-scale-up relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Top Premium Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-hover" />
            
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-card flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-brand-primary/20 to-brand-hover/10 text-brand-primary flex items-center justify-center border border-brand-primary/10">
                  <UserPlus size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-text-main tracking-tight">
                    Assign Assets to Employee
                  </h3>
                  <p className="text-[10px] text-text-mut font-bold uppercase tracking-wider">Bulk Asset Assignment Panel</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAssignAssetsModal(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-base border border-border-card text-text-mut hover:text-text-main hover:border-brand-primary/40 hover:rotate-90 transition-all duration-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAssignAssetsSubmit} className="flex-1 overflow-y-auto pr-1 space-y-5 py-1">
              {/* Assignment Specs Section */}
              <div className="bg-bg-base/30 dark:bg-slate-900/10 rounded-[18px] p-5 border border-border-card space-y-4">
                <div className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <UserPlus size={12} />
                  <span>Assignment Parameters</span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Assign to Employee</label>
                  <div className="relative flex items-center">
                    <Users size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                    <select 
                      className="w-full pl-10 pr-10 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all cursor-pointer font-semibold shadow-sm appearance-none"
                      value={assignAssetsTargetUser}
                      onChange={(e) => setAssignAssetsTargetUser(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {users.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.name} ({u.department || "No Dept"})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 text-text-mut/70 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Date of Assigning</label>
                    <div className="relative flex items-center">
                      <Calendar size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                      <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all font-semibold shadow-sm" 
                        value={assignAssetsDate}
                        onChange={(e) => setAssignAssetsDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-sec uppercase tracking-wider">Assigning Authority</label>
                    <div className="relative flex items-center">
                      <Shield size={15} className="absolute left-3.5 text-text-mut/70 pointer-events-none" />
                      <select 
                        className="w-full pl-10 pr-10 py-2.5 border border-border-card/80 hover:border-brand-primary/40 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 rounded-[14px] bg-bg-card text-xs text-text-main outline-none transition-all cursor-pointer font-semibold shadow-sm appearance-none"
                        value={assignAssetsAuthority}
                        onChange={(e) => setAssignAssetsAuthority(e.target.value)}
                        required
                      >
                        <option value="">Select Authority</option>
                        {users.filter(u => 
                          (u.role === "admin" || u.role === "superadmin" || u.role === "systemadmin" || u.role === "system admin") &&
                          !(u.name || "").toLowerCase().includes("zoho")
                        ).map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 text-text-mut/70 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Section */}
              <div className="bg-bg-base/30 dark:bg-slate-900/10 rounded-[18px] p-5 border border-border-card space-y-3">
                <div className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop size={12} />
                  <span>Select Available Asset(s)</span>
                </div>
                <div className="border border-border-card/80 rounded-[14px] bg-bg-card max-h-[160px] overflow-y-auto p-4 space-y-3 shadow-inner">
                  {assets.filter(a => a.status === "Available").length === 0 ? (
                    <div className="text-xs text-text-mut text-center py-6 font-semibold">No available assets in inventory.</div>
                  ) : (
                    assets.filter(a => a.status === "Available").map((asset) => (
                      <label key={asset.id} className="flex items-center gap-3.5 text-xs font-bold text-text-sec hover:text-text-main cursor-pointer select-none transition-colors">
                        <input
                          type="checkbox"
                          checked={assignAssetsSelectedIds.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignAssetsSelectedIds(prev => [...prev, asset.id]);
                            } else {
                              setAssignAssetsSelectedIds(prev => prev.filter(id => id !== asset.id));
                            }
                          }}
                          className="rounded-[6px] border-border-card text-brand-primary focus:ring-brand-primary cursor-pointer w-4.5 h-4.5 transition-all accent-brand-primary mr-1"
                        />
                        <span className="flex items-center gap-2">
                          <span className="text-text-main">{asset.name}</span>
                          <span className="text-[10px] text-text-mut font-mono font-semibold bg-bg-base px-2 py-0.5 rounded-[6px] border border-border-card/50">(SN: {asset.serialNumber})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-card flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAssignAssetsModal(false)}
                  className="py-2.5 px-5 text-xs font-bold text-text-sec hover:text-text-main hover:bg-bg-base rounded-[14px] transition-all cursor-pointer border border-transparent hover:border-border-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignAssetsLoading || assignAssetsSelectedIds.length === 0 || !assignAssetsTargetUser || !assignAssetsAuthority}
                  className="py-2.5 px-6 bg-gradient-to-r from-brand-primary to-brand-hover text-white text-xs font-bold rounded-[14px] shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/35 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  {assignAssetsLoading ? "Assigning..." : "Assign Asset(s)"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ------------------ VIEW: PAYROLL (INDIA) ------------------ */}
      {(activeTab === "payroll" && (isAdminUser || can("read", "Payroll"))) && (() => {
        // Calculations for Indian Payroll
        const calculatePayroll = (gross, paidDays, workingDays) => {
          const lopsDays = Math.max(0, workingDays - paidDays);
          const actualGross = (gross / workingDays) * paidDays;
          const lopAmount = gross - actualGross;

          const basic = gross * 0.5;
          const hra = basic * 0.4;
          const special = gross - basic - hra;
          
          const actualBasic = actualGross * 0.5;
          const pf = companyPayrollSettings?.pf ? actualBasic * 0.12 : 0;
          const esi = (companyPayrollSettings?.esi && actualGross <= 21000) ? actualGross * 0.0075 : 0;
          
          const getPTDeduction = (g) => {
            if (companyPayrollSettings && !companyPayrollSettings.pt) return 0;
            if (g <= 21000) return 0;
            if (g <= 30000) return Math.round((180 / 6) * 100) / 100;
            if (g <= 45000) return Math.round((425 / 6) * 100) / 100;
            if (g <= 60000) return Math.round((930 / 6) * 100) / 100;
            if (g <= 75000) return Math.round((1025 / 6) * 100) / 100;
            return Math.round((1250 / 6) * 100) / 100;
          };
          const pt = getPTDeduction(actualGross);
          const insurance = companyPayrollSettings?.insurance ? Number(companyPayrollSettings.insuranceAmount || 0) : 0;

          const tds = actualGross > 50000 ? (actualGross - pf - pt - insurance) * 0.05 : 0;
          const net = actualGross - (pf + esi + pt + tds + insurance);
          return { basic, hra, special, pf, esi, pt, tds, insurance, net, actualGross, lopAmount, lopsDays };
        };

        const currentPayroll = staffUsers.map(user => {
          const savedPayslip = payrollData.find(p => p.employeeId === user.uid);
          
          if (savedPayslip) {
            return {
              ...user,
              ...savedPayslip,
              gross: savedPayslip.grossSalary || savedPayslip.gross,
              paidDays: savedPayslip.paidDays,
              workingDays: savedPayslip.workingDays,
              isSaved: true
            };
          }

          const gross = user.grossSalary || 0;
          const workingDays = companyPayrollSettings?.workingDays || 30;
          const paidDays = user.paidDays !== undefined ? user.paidDays : workingDays;
          const calc = calculatePayroll(gross, paidDays, workingDays);
          
          return {
            ...user,
            gross,
            workingDays,
            paidDays,
            ...calc,
            isSaved: false
          };
        });

        // Search logic for payroll table
        const filteredPayroll = currentPayroll.filter((u) => {
          const matchesSearch = 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesDept = !selectedDept || u.department === selectedDept;
          return matchesSearch && matchesDept;
        });

        const totalGross = payrollData.reduce((acc, curr) => acc + (curr.grossSalary || 0), 0);
        const totalPF = payrollData.reduce((acc, curr) => acc + (curr.pf || 0), 0);
        const totalNet = payrollData.reduce((acc, curr) => acc + (curr.net || 0), 0);
        
        return (
          <>
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Payroll Management</h1>
                <p className="text-sm text-text-sec mt-1">Manage employee salaries, EPF, ESI, and generate payslips complying with Indian Law.</p>
              </div>
              <div className="flex items-center gap-2">

                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 px-4 h-10 whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-[14px] transition-colors shadow-sm"
                >
                  <Download size={16} /> Template
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleExcelUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    disabled={actionLoading}
                    title="Upload Payroll Excel"
                  />
                  <button className="flex items-center justify-center gap-2 px-4 h-10 whitespace-nowrap bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-[14px] transition-colors shadow-sm disabled:opacity-50 w-full">
                    <Upload size={16} /> {actionLoading ? 'Importing...' : 'Import Excel'}
                  </button>
                </div>
                <button 
                  onClick={() => handleBulkExportPDF(filteredPayroll)} 
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-4 h-10 whitespace-nowrap bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-[14px] transition-colors shadow-sm disabled:opacity-50"
                >
                  <Download size={16} /> {actionLoading ? 'Exporting...' : 'Bulk Export PDF'}
                </button>
                <button onClick={() => setShowPayrollSettingsModal(true)} className="flex items-center justify-center gap-2 px-4 h-10 whitespace-nowrap bg-bg-card border border-border-card text-text-main text-sm font-bold rounded-[14px] hover:bg-bg-base transition-colors shadow-sm">
                  <Edit size={16} /> Payroll Settings
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-bg-card border border-border-card rounded-[20px] p-5 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Total Gross Payout</span>
                  <span className="text-3xl font-extrabold text-text-main block mt-1.5 flex items-center gap-1"><IndianRupee size={24} /> {totalGross.toLocaleString('en-IN')}</span>
                </div>
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <Banknote size={80} />
                </div>
              </div>
              <div className="bg-bg-card border border-border-card rounded-[20px] p-5 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Total PF Contribution</span>
                  <span className="text-3xl font-extrabold text-brand-primary block mt-1.5 flex items-center gap-1"><IndianRupee size={24} /> {totalPF.toLocaleString('en-IN')}</span>
                </div>
                <div className="absolute right-0 top-0 p-4 text-brand-primary opacity-5">
                  <Activity size={80} />
                </div>
              </div>
              <div className="bg-bg-card border border-border-card rounded-[20px] p-5 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Total Net Payout</span>
                  <span className="text-3xl font-extrabold text-emerald-500 block mt-1.5 flex items-center gap-1"><IndianRupee size={24} /> {totalNet.toLocaleString('en-IN')}</span>
                </div>
                <div className="absolute right-0 top-0 p-4 text-emerald-500 opacity-5">
                  <Check size={80} />
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
                <div className="flex flex-col gap-1.5 flex-grow">
                  <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider">Search Employee</label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all placeholder-text-mut"
                      placeholder="Search name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 min-w-[150px]">
                  <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider">Department</label>
                  <select
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept, idx) => <option key={idx} value={dept}>{dept}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 min-w-[120px]">
                  <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider">Month</label>
                  <select
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 min-w-[100px]">
                  <label className="text-[10px] font-bold text-text-mut uppercase tracking-wider">Year</label>
                  <select
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/40 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(Number(e.target.value))}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm overflow-hidden text-left">
              <div className="overflow-x-auto custom-scrollbar -mx-6 px-6">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-border-card">
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">Employee</th>
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">Gross Salary</th>
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">Basic Pay</th>
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">HRA</th>
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">PF (12%)</th>
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">ESI</th>
                      <th className="pb-3 px-4 text-left text-[10px] font-extrabold text-text-mut uppercase tracking-wider">Net Salary</th>
                      <th className="pb-3 px-4 text-right text-[10px] font-extrabold text-text-mut uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayroll.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-sm text-text-mut">No payroll data found.</td>
                      </tr>
                    ) : (
                      filteredPayroll.map(user => (
                        <tr key={user.uid} className="border-b border-border-card/50 hover:bg-bg-base/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-extrabold text-text-main">{user.name}</span>
                              <span className="text-[10px] font-bold text-text-sec uppercase mt-0.5">{user.designation || user.role}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-extrabold text-text-main flex items-center gap-0.5"><IndianRupee size={12} /> {user.gross.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-text-sec">₹{user.basic.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-xs font-bold text-text-sec">₹{user.hra.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-xs font-bold text-brand-danger">₹{user.pf.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-xs font-bold text-brand-danger">₹{user.esi.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-[6px] border border-emerald-500/20">₹{user.net.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedPayrollUser(user);
                                  setEditSalaryValue(user.gross);
                                  setEditLeaveDaysValue(user.paidDays !== undefined ? Math.max(0, (companyPayrollSettings?.workingDays || 30) - user.paidDays) : 0);
                                  setShowEditSalaryModal(true);
                                }}
                                className="p-1.5 text-text-mut hover:text-brand-primary bg-bg-base hover:bg-brand-primary/10 rounded-lg transition-colors border border-border-card/60"
                                title="Edit Salary Structure"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedPayrollUser(user);
                                  setShowPayslipModal(true);
                                }}
                                className="p-1.5 text-text-mut hover:text-emerald-500 bg-bg-base hover:bg-emerald-500/10 rounded-lg transition-colors border border-border-card/60"
                                title="View Payslip"
                              >
                                <FileText size={14} />
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
          </div>

            {/* HIDDEN BULK PDF CONTAINER */}
            <div className="absolute top-[-9999px] left-[-9999px] w-[800px] pointer-events-none opacity-0">
              <div id="bulk-payslip-content" className="bg-white text-left font-sans text-black w-full">
              {filteredPayroll.map((user, index) => (
                <div key={user.uid} style={{ pageBreakAfter: index === filteredPayroll.length - 1 ? 'auto' : 'always' }}>
                  <div className="p-8 pb-[100px]">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                      <div className="w-1/3">
                        {companyLogo && <img src={companyLogo} crossOrigin="anonymous" alt={companyName} className="h-14 object-contain" />}
                      </div>
                      <div className="w-1/3 flex flex-col items-center justify-center text-center">
                        <h1 className="text-lg font-extrabold text-[#000080] whitespace-nowrap">{companyName || "ZUNA HRMS"}</h1>
                      </div>
                      <div className="w-1/3"></div>
                    </div>
                    <div className="text-center mb-4 -mt-4">
                      {companyAddress && <p className="text-[11px] font-bold text-black mt-1 whitespace-pre-wrap">{companyAddress}</p>}
                    </div>
                    
                    <div className="text-center mb-2 mt-4">
                      <h2 className="text-xl font-extrabold text-black tracking-wider uppercase">PAYSLIP</h2>
                    </div>
                    
                    <div className="border-t-[3px] border-black w-full my-2"></div>

                    <div className="text-center mb-2 mt-2">
                      <p className="text-sm font-extrabold text-black">Payslip for the month of {payrollMonth}, {payrollYear}</p>
                    </div>

                    <div className="border-t-[3px] border-black w-full mb-4"></div>
                    
                    {/* Employee Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-[10px] font-normal text-black mb-4">
                      {/* Left Column */}
                      <div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Emp Name</span><span>: {user.name || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Emp Code</span><span>: {user.employeeId || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Department</span><span>: {user.department || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Designation</span><span>: {user.designation || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Grade</span><span>: {user.grade || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>PF No.</span><span>: {user.pfNo || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>PF UAN</span><span>: {user.uan || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Bank Account No.</span><span>: {user.bankAcNo || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>IFSC</span><span>: {user.ifscCode || 'NaN'}</span></div>
                      </div>
                      {/* Right Column */}
                      <div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Office Address</span><span className="line-clamp-2" title={companyAddress}>: {companyAddress || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Joining Date</span><span>: {user.joiningDate || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Paid Days</span><span>: {Number(user.paidDays || companyPayrollSettings?.workingDays || 30).toFixed(2)}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Working Days</span><span>: {Number(user.workingDays || companyPayrollSettings?.workingDays || 30).toFixed(2)}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Cost Center</span><span>: {user.costCenter || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>PAN</span><span>: {user.pan || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Gender</span><span>: {user.gender || 'NaN'}</span></div>
                        <div className="grid grid-cols-[120px_1fr]"><span>Loss of Pay Days</span><span>: {Math.max(0, (user.lopsDays || 0)).toFixed(2)}</span></div>
                      </div>
                    </div>

                    <div className="border-t-[3px] border-black w-full my-2"></div>

                    {/* Financial Table Header */}
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1">
                      <div className="col-span-4">Earnings</div>
                      <div className="col-span-2 text-right">Earned Amt.</div>
                      <div className="col-span-2 text-right">Arrears</div>
                      <div className="col-span-3 pl-4">Deductions</div>
                      <div className="col-span-1 text-right">Amount</div>
                    </div>
                    
                    <div className="border-t-[3px] border-black w-full mb-3"></div>

                    <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-[10px] text-black pb-4 font-normal">
                      {/* Row 1 */}
                      <div className="col-span-4">Basic</div>
                      <div className="col-span-2 text-right">{(user.basic || 0).toFixed(2)}</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4">Provident Fund</div>
                      <div className="col-span-1 text-right">{(user.pf || 0).toFixed(2)}</div>

                      {/* Row 2 */}
                      <div className="col-span-4">House Rent Allowance</div>
                      <div className="col-span-2 text-right">{(user.hra || 0).toFixed(2)}</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4">Loss of Pay</div>
                      <div className="col-span-1 text-right">{(user.lopAmount || 0).toFixed(2)}</div>

                      {/* Row 3 */}
                      <div className="col-span-4">Conveyance</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4">Professional Tax</div>
                      <div className="col-span-1 text-right">{(user.pt || 0).toFixed(2)}</div>

                      {/* Row 4 */}
                      <div className="col-span-4">Special Allowance</div>
                      <div className="col-span-2 text-right">{(user.special || 0).toFixed(2)}</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4">{(user.esi || 0) > 0 ? 'ESI' : ''}</div>
                      <div className="col-span-1 text-right">{(user.esi || 0) > 0 ? user.esi.toFixed(2) : ''}</div>

                      {/* Row 5 */}
                      <div className="col-span-4">Basic (Prorated)</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4">{(user.tds || 0) > 0 ? 'TDS' : ''}</div>
                      <div className="col-span-1 text-right">{(user.tds || 0) > 0 ? user.tds.toFixed(2) : ''}</div>

                      {/* Row 6 */}
                      <div className="col-span-4">HRA (Prorated)</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4"></div>
                      <div className="col-span-1 text-right"></div>

                      {/* Row 7 */}
                      <div className="col-span-4">Other Allowance</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4"></div>
                      <div className="col-span-1 text-right"></div>
                    </div>
                    
                    <div className="border-t-[3px] border-black w-full my-1"></div>
                    
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1">
                      <div className="col-span-4">Gross Earning</div>
                      <div className="col-span-2 text-right">{(user.gross || 0).toFixed(2)}</div>
                      <div className="col-span-2 text-right">0.00</div>
                      <div className="col-span-3 pl-4">Gross Deduction</div>
                      <div className="col-span-1 text-right">{(user.pf + user.pt + user.esi + user.tds + (user.lopAmount || 0)).toFixed(2)}</div>
                    </div>

                    <div className="border-t-[3px] border-black w-full my-1"></div>

                    <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1 mb-4">
                      <div className="col-span-4">Net Amount</div>
                      <div className="col-span-2 text-right">{(user.net || 0).toFixed(2)}</div>
                    </div>
                    
                    <div className="text-[10px] text-black mb-4 font-normal">
                      Net Amount in words: ( {numberToWords(user.net || 0).toUpperCase()} ONLY )
                    </div>
                    
                    <div className="text-[10px] font-extrabold text-black mb-12">
                      Disclaimer: This is a system generated payslip, does not require any signature.
                    </div>
                    
                    {/* Footer Logo */}
                    <div className="mt-12 flex justify-center items-center gap-2 pb-2">
                      <span className="text-[11px] font-extrabold text-black">Powered by</span>
                      <img src={zunaLogo} alt="Zuna Logo" className="h-6 object-contain" />
                      <span className="text-[11px] font-extrabold text-black ml-1">Simplify payroll and compliance.</span>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </>
        );
      })()}
      {/* ------------------ VIEW: EXTERNAL LINKS ------------------ */}
      {(activeTab === "external-links" && (isAdminUser || can("read", "ExternalLinks"))) && (
        <div className="animate-fade-in">
          <ExternalLinksTab 
            currentUser={currentUser}
            users={users}
            showToast={showToast}
          />
        </div>
      )}

      {/* ------------------ MODALS ------------------ */}
      {showEditSalaryModal && selectedPayrollUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-card w-full max-w-md rounded-[24px] border border-border-card shadow-2xl overflow-hidden animate-slide-up flex flex-col relative my-auto">
            <div className="px-6 py-5 border-b border-border-card flex items-center justify-between sticky top-0 bg-bg-card z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Banknote className="text-brand-primary" size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-main">Update Salary</h3>
                  <p className="text-[10px] text-text-sec mt-0.5">{selectedPayrollUser.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditSalaryModal(false)} className="text-text-mut hover:text-text-main transition-colors p-1 rounded-lg hover:bg-bg-base"><X size={18} /></button>
            </div>
                        <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-sec block mb-2">Gross Salary (Monthly)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut" />
                  <input 
                    type="number"
                    value={editSalaryValue}
                    onChange={(e) => setEditSalaryValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-bg-base/50 border border-border-card rounded-[12px] text-sm text-text-main outline-none focus:border-brand-primary transition-colors font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-sec block mb-2">Number of Leave (LOP Days)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={editLeaveDaysValue}
                    onChange={(e) => setEditLeaveDaysValue(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base/50 border border-border-card rounded-[12px] text-sm text-text-main outline-none focus:border-brand-primary transition-colors font-bold"
                  />
                </div>
              </div>

              {(() => {
                const wDays = companyPayrollSettings?.workingDays || 30;
                const leaves = Number(editLeaveDaysValue) || 0;
                const paid = Math.max(0, wDays - leaves);
                const g = Number(editSalaryValue) || 0;
                const actualGross = (g / wDays) * paid;
                const lop = g - actualGross;

                // Full calculation for Net Salary
                const basic = actualGross * 0.5;
                const pf = companyPayrollSettings?.pf ? basic * 0.12 : 0;
                const esi = (companyPayrollSettings?.esi && actualGross <= 21000) ? actualGross * 0.0075 : 0;
                const getPTDeduction = (grossAmt) => {
                  if (companyPayrollSettings && !companyPayrollSettings.pt) return 0;
                  if (grossAmt <= 21000) return 0;
                  if (grossAmt <= 30000) return Math.round((180 / 6) * 100) / 100;
                  if (grossAmt <= 45000) return Math.round((425 / 6) * 100) / 100;
                  if (grossAmt <= 60000) return Math.round((930 / 6) * 100) / 100;
                  if (grossAmt <= 75000) return Math.round((1025 / 6) * 100) / 100;
                  return Math.round((1250 / 6) * 100) / 100;
                };
                const pt = getPTDeduction(actualGross);
                const insurance = companyPayrollSettings?.insurance ? Number(companyPayrollSettings.insuranceAmount || 0) : 0;
                const tds = actualGross > 50000 ? (actualGross - pf - pt - insurance) * 0.05 : 0;
                const net = actualGross - (pf + esi + pt + tds + insurance);

                return (
                  <div className="bg-bg-base border border-border-card rounded-[12px] p-4 flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-sec">Loss of Pay (LOP Amount):</span>
                      <span className="font-extrabold text-brand-danger">₹{lop.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-sec">Final Net Salary:</span>
                      <span className="font-extrabold text-emerald-500">₹{net.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-[12px]">
                <p className="text-[10px] text-amber-600 font-semibold leading-relaxed">
                  Saving this will recalculate EPF, ESI, HRA, and PT dynamically.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border-card flex justify-end gap-3 bg-bg-base/30 mt-auto flex-shrink-0">
              <button onClick={() => setShowEditSalaryModal(false)} className="px-5 py-2.5 rounded-[12px] text-xs font-bold text-text-sec hover:bg-bg-base transition-colors border border-transparent hover:border-border-card">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    const leaves = Number(editLeaveDaysValue) || 0;
                    const wDays = companyPayrollSettings?.workingDays || 30;
                    const paidDays = Math.max(0, wDays - leaves);
                    const gross = Number(editSalaryValue) || 0;
                    const calc = calculatePayroll(gross, paidDays, wDays);
                    await saveEmployeePayroll(currentUser.companyId, selectedPayrollUser.uid, {
                      month: payrollMonth,
                      year: payrollYear,
                      workingDays: wDays,
                      paidDays,
                      grossSalary: gross,
                      ...calc
                    });
                    showToast("Salary updated successfully", "success");
                    setShowEditSalaryModal(false);
                    loadDirectoryData();
                  } catch (e) {
                    showToast("Failed to update salary", "error");
                  }
                }} 
                disabled={!editSalaryValue || editSalaryValue <= 0 || editLeaveDaysValue === ""}
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-[12px] text-xs font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showPayslipModal && selectedPayrollUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-bg-card w-full max-w-2xl rounded-[24px] border border-border-card shadow-2xl overflow-hidden animate-slide-up flex flex-col relative my-auto">
            <div className="px-6 py-5 border-b border-border-card flex items-center justify-between sticky top-0 bg-bg-card z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="text-emerald-500" size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-main">Payslip Preview</h3>
                  <p className="text-[10px] text-text-sec mt-0.5">{selectedPayrollUser.name} - {payrollMonth} {payrollYear}</p>
                </div>
              </div>
              <button onClick={() => setShowPayslipModal(false)} className="text-text-mut hover:text-text-main transition-colors p-1 rounded-lg hover:bg-bg-base"><X size={18} /></button>
            </div>
            <div className="p-8 text-left bg-white font-sans" id="payslip-content">
              {/* Header */}
              <div className="flex items-center mb-6">
                <div className="w-1/3">
                  {companyLogo && <img src={companyLogo} crossOrigin="anonymous" alt={companyName} className="h-14 object-contain" />}
                </div>
                <div className="w-1/3 flex flex-col items-center justify-center text-center">
                  <h1 className="text-lg font-extrabold text-[#000080] whitespace-nowrap">{companyName || "ZUNA HRMS"}</h1>
                </div>
                <div className="w-1/3"></div>
              </div>
              <div className="text-center mb-4 -mt-4">
                {companyAddress && <p className="text-[11px] font-bold text-black mt-1 whitespace-pre-wrap">{companyAddress}</p>}
              </div>
              
              <div className="text-center mb-2 mt-4">
                <h2 className="text-xl font-extrabold text-black tracking-wider uppercase">PAYSLIP</h2>
              </div>
              
              <div className="border-t-[3px] border-black w-full my-2"></div>

              <div className="text-center mb-2 mt-2">
                <p className="text-sm font-extrabold text-black">Payslip for the month of {payrollMonth}, {payrollYear}</p>
              </div>

              <div className="border-t-[3px] border-black w-full mb-4"></div>
              
              {/* Employee Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-[10px] font-normal text-black mb-4">
                {/* Left Column */}
                <div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Emp Name</span><span>: {selectedPayrollUser.name || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Emp Code</span><span>: {selectedPayrollUser.employeeId || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Department</span><span>: {selectedPayrollUser.department || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Designation</span><span>: {selectedPayrollUser.designation || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Grade</span><span>: {selectedPayrollUser.grade || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>PF No.</span><span>: {selectedPayrollUser.pfNo || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>PF UAN</span><span>: {selectedPayrollUser.uan || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Bank Account No.</span><span>: {selectedPayrollUser.bankAcNo || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>IFSC</span><span>: {selectedPayrollUser.ifscCode || 'NaN'}</span></div>
                </div>
                {/* Right Column */}
                <div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Office Address</span><span className="line-clamp-2" title={companyAddress}>: {companyAddress || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Joining Date</span><span>: {selectedPayrollUser.joiningDate || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Paid Days</span><span>: {Number(selectedPayrollUser.paidDays || companyPayrollSettings?.workingDays || 30).toFixed(2)}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Working Days</span><span>: {Number(selectedPayrollUser.workingDays || companyPayrollSettings?.workingDays || 30).toFixed(2)}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Cost Center</span><span>: {selectedPayrollUser.costCenter || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>PAN</span><span>: {selectedPayrollUser.pan || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Gender</span><span>: {selectedPayrollUser.gender || 'NaN'}</span></div>
                  <div className="grid grid-cols-[120px_1fr]"><span>Loss of Pay Days</span><span>: {Math.max(0, (selectedPayrollUser.lopsDays || 0)).toFixed(2)}</span></div>
                </div>
              </div>

              <div className="border-t-[3px] border-black w-full my-2"></div>

              {/* Financial Table Header */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1">
                <div className="col-span-4">Earnings</div>
                <div className="col-span-2 text-right">Earned Amt.</div>
                <div className="col-span-2 text-right">Arrears</div>
                <div className="col-span-3 pl-4">Deductions</div>
                <div className="col-span-1 text-right">Amount</div>
              </div>
              
              <div className="border-t-[3px] border-black w-full mb-3"></div>

              <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-[10px] text-black pb-4 font-normal">
                {/* Row 1 */}
                <div className="col-span-4">Basic</div>
                <div className="col-span-2 text-right">{(selectedPayrollUser.basic || 0).toFixed(2)}</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4">Provident Fund</div>
                <div className="col-span-1 text-right">{(selectedPayrollUser.pf || 0).toFixed(2)}</div>

                {/* Row 2 */}
                <div className="col-span-4">House Rent Allowance</div>
                <div className="col-span-2 text-right">{(selectedPayrollUser.hra || 0).toFixed(2)}</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4">Loss of Pay</div>
                <div className="col-span-1 text-right">{(selectedPayrollUser.lopAmount || 0).toFixed(2)}</div>

                {/* Row 3 */}
                <div className="col-span-4">Conveyance</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4">Professional Tax</div>
                <div className="col-span-1 text-right">{(selectedPayrollUser.pt || 0).toFixed(2)}</div>

                {/* Row 4 */}
                <div className="col-span-4">Special Allowance</div>
                <div className="col-span-2 text-right">{(selectedPayrollUser.special || 0).toFixed(2)}</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4">{(selectedPayrollUser.esi || 0) > 0 ? 'ESI' : ''}</div>
                <div className="col-span-1 text-right">{(selectedPayrollUser.esi || 0) > 0 ? selectedPayrollUser.esi.toFixed(2) : ''}</div>

                {/* Row 5 */}
                <div className="col-span-4">Basic (Prorated)</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4">{(selectedPayrollUser.tds || 0) > 0 ? 'TDS' : ''}</div>
                <div className="col-span-1 text-right">{(selectedPayrollUser.tds || 0) > 0 ? selectedPayrollUser.tds.toFixed(2) : ''}</div>

                {/* Row 6 */}
                <div className="col-span-4">HRA (Prorated)</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4"></div>
                <div className="col-span-1 text-right"></div>

                {/* Row 7 */}
                <div className="col-span-4">Other Allowance</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4"></div>
                <div className="col-span-1 text-right"></div>
              </div>
              
              <div className="border-t-[3px] border-black w-full my-1"></div>
              
              <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1">
                <div className="col-span-4">Gross Earning</div>
                <div className="col-span-2 text-right">{(selectedPayrollUser.gross || 0).toFixed(2)}</div>
                <div className="col-span-2 text-right">0.00</div>
                <div className="col-span-3 pl-4">Gross Deduction</div>
                <div className="col-span-1 text-right">{(selectedPayrollUser.pf + selectedPayrollUser.pt + selectedPayrollUser.esi + selectedPayrollUser.tds + (selectedPayrollUser.lopAmount || 0)).toFixed(2)}</div>
              </div>

              <div className="border-t-[3px] border-black w-full my-1"></div>

              <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1 mb-4">
                <div className="col-span-4">Net Amount</div>
                <div className="col-span-2 text-right">{(selectedPayrollUser.net || 0).toFixed(2)}</div>
              </div>
              
              <div className="text-[10px] text-black mb-4 font-normal">
                Net Amount in words: ( {numberToWords(selectedPayrollUser.net || 0).toUpperCase()} ONLY )
              </div>
              
              <div className="text-[10px] font-extrabold text-black mb-12">
                Disclaimer: This is a system generated payslip, does not require any signature.
              </div>
              
              {/* Footer Logo */}
              <div className="mt-12 flex justify-center items-center gap-2 pb-2">
                <span className="text-[11px] font-extrabold text-black">Powered by</span>
                <img src={zunaLogo} alt="Zuna Logo" className="h-6 object-contain" />
                <span className="text-[11px] font-extrabold text-black ml-1">Simplify payroll and compliance.</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border-card flex flex-col sm:flex-row justify-end gap-3 bg-bg-base/30 mt-auto flex-shrink-0">
              <button onClick={() => setShowPayslipModal(false)} className="w-full sm:w-auto px-5 py-2.5 rounded-[12px] text-xs font-bold text-text-sec hover:bg-bg-base transition-colors border border-transparent hover:border-border-card">Close</button>
              {payrollData.some(p => p.employeeId === selectedPayrollUser.uid) && (
                <button 
                  onClick={() => setShowDeletePayslipConfirm(true)} 
                  className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 bg-brand-danger hover:bg-red-600 text-white rounded-[12px] text-xs font-bold shadow-lg shadow-brand-danger/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button 
                onClick={() => {
                  setShowPayslipModal(false);
                  saveEmployeePayroll(currentUser.companyId, selectedPayrollUser.uid, {
                    month: payrollMonth,
                    year: payrollYear,
                    grossSalary: selectedPayrollUser.gross,
                    basic: selectedPayrollUser.basic,
                    hra: selectedPayrollUser.hra,
                    special: selectedPayrollUser.special,
                    pf: selectedPayrollUser.pf,
                    esi: selectedPayrollUser.esi,
                    pt: selectedPayrollUser.pt,
                    tds: selectedPayrollUser.tds,
                    lopAmount: selectedPayrollUser.lopAmount || 0,
                    lopsDays: selectedPayrollUser.lopsDays || 0,
                    net: selectedPayrollUser.net,
                    paidDays: selectedPayrollUser.paidDays || 0,
                    workingDays: selectedPayrollUser.workingDays || 30
                  })
                  .then(() => showToast("Payslip published to employee portal", "success"))
                  .catch(() => showToast("Failed to publish payslip", "error"));
                }} 
                className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white rounded-[12px] text-xs font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95 cursor-pointer"
              >
                <Check size={14} /> {payrollData.some(p => p.employeeId === selectedPayrollUser.uid) ? 'Update Payslip' : 'Publish Payslip'}
              </button>
              <button 
                onClick={() => {
                                      const element = document.getElementById('payslip-content');
                    const opt = {
                      margin:       0,
                      filename:     `Payslip_${selectedPayrollUser.name}_${payrollMonth}_${payrollYear}.pdf`,
                      image:        { type: 'jpeg', quality: 0.98 },
                      html2canvas:  { scale: 2, useCORS: true },
                      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save(); 
                }} 
                className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[12px] text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>

            {/* Confirmation Overlay for Delete Payslip */}
            {showDeletePayslipConfirm && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-[24px]">
                <div className="bg-bg-card max-w-sm w-full p-6 rounded-[20px] shadow-2xl border border-border-card animate-scale-up text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-danger/10 text-brand-danger flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={24} />
                  </div>
                  <h3 className="text-lg font-extrabold text-text-main mb-2">Delete Payslip?</h3>
                  <p className="text-sm text-text-sec mb-6">Are you sure you want to delete this published payslip? It will be removed from the employee's portal immediately.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeletePayslipConfirm(false)} className="flex-1 py-2.5 rounded-[12px] font-bold text-xs bg-bg-base text-text-main hover:bg-border-card transition-colors">Cancel</button>
                    <button 
                      onClick={() => {
                        // Optimistic close
                        setShowDeletePayslipConfirm(false);
                        setShowPayslipModal(false);
                        deleteEmployeePayroll(currentUser.companyId, selectedPayrollUser.uid, payrollMonth, payrollYear)
                          .then(() => showToast("Payslip deleted successfully", "success"))
                          .catch(() => showToast("Failed to delete payslip", "error"));
                      }}
                      className="flex-1 py-2.5 rounded-[12px] font-bold text-xs bg-brand-danger text-white hover:bg-red-600 transition-colors shadow-lg shadow-brand-danger/20"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      
      {/* Payroll Settings Modal */}
      {showPayrollSettingsModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-card w-full max-w-md rounded-[24px] shadow-2xl border border-border-card overflow-hidden animate-scale-up flex flex-col">
            <div className="px-6 py-4 border-b border-border-card flex items-center justify-between bg-bg-base/50">
              <h2 className="text-lg font-extrabold text-text-main flex items-center gap-2">
                <Edit className="text-brand-primary" size={20} />
                Payroll Settings
              </h2>
              <button onClick={() => setShowPayrollSettingsModal(false)} className="text-text-mut hover:text-text-main transition-colors p-1.5 rounded-lg hover:bg-bg-base">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors block">Employee Provident Fund (EPF)</span>
                    <span className="text-xs text-text-sec">Enable 12% EPF deduction</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${companyPayrollSettings.pf ? 'bg-brand-primary' : 'bg-border-card'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${companyPayrollSettings.pf ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={companyPayrollSettings.pf} onChange={(e) => setCompanyPayrollSettings(prev => ({ ...prev, pf: e.target.checked }))} />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors block">Employee State Insurance (ESI)</span>
                    <span className="text-xs text-text-sec">Enable 0.75% ESI deduction</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${companyPayrollSettings.esi ? 'bg-brand-primary' : 'bg-border-card'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${companyPayrollSettings.esi ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={companyPayrollSettings.esi} onChange={(e) => setCompanyPayrollSettings(prev => ({ ...prev, esi: e.target.checked }))} />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors block">Professional Tax (PT)</span>
                    <span className="text-xs text-text-sec">Enable standard PT deduction</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${companyPayrollSettings.pt ? 'bg-brand-primary' : 'bg-border-card'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${companyPayrollSettings.pt ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={companyPayrollSettings.pt} onChange={(e) => setCompanyPayrollSettings(prev => ({ ...prev, pt: e.target.checked }))} />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors block">Health Insurance</span>
                    <span className="text-xs text-text-sec">Enable company insurance deduction</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${companyPayrollSettings.insurance ? 'bg-brand-primary' : 'bg-border-card'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${companyPayrollSettings.insurance ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={companyPayrollSettings.insurance} onChange={(e) => setCompanyPayrollSettings(prev => ({ ...prev, insurance: e.target.checked }))} />
                </label>
                
                <div className="pt-2 animate-fade-in border-t border-border-card/30 mt-4">
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2 mt-4">Standard Working Days (Per Month)</label>
                  <input 
                    type="number" 
                    value={companyPayrollSettings.workingDays || 30}
                    onChange={(e) => setCompanyPayrollSettings(prev => ({ ...prev, workingDays: Number(e.target.value) }))}
                    className="w-full bg-bg-base border border-border-card text-text-main text-sm rounded-[12px] px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    placeholder="e.g. 26 or 30"
                  />
                  <p className="text-[10px] text-text-mut mt-1">This will be used as the default working days for payslip generation.</p>
                </div>

                {companyPayrollSettings.insurance && (
                  <div className="pt-2 animate-fade-in">
                    <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Insurance Deduction Amount (₹)</label>
                    <input 
                      type="number" 
                      value={companyPayrollSettings.insuranceAmount || 0}
                      onChange={(e) => setCompanyPayrollSettings(prev => ({ ...prev, insuranceAmount: Number(e.target.value) }))}
                      className="w-full bg-bg-base border border-border-card text-text-main text-sm rounded-[12px] px-4 py-2.5 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                      placeholder="e.g. 500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-border-card flex gap-3">
              <button onClick={() => setShowPayrollSettingsModal(false)} className="flex-1 py-2.5 rounded-[12px] font-bold text-xs bg-bg-base text-text-main hover:bg-border-card transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    await updateCompanyDetails(currentUser.companyId, { payrollSettings: companyPayrollSettings });
                    setShowPayrollSettingsModal(false);
                    showToast("Payroll settings updated successfully", "success");
                  } catch (e) {
                    console.error('Update Settings Error:', e);
                    showToast("Failed to update settings", "error");
                  }
                }} 
                className="flex-1 py-2.5 rounded-[12px] font-bold text-xs bg-brand-primary text-white hover:bg-brand-hover transition-colors shadow-lg shadow-brand-primary/20"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      
      {/* Location Details Modal */}
      {locationModalData && locationModalData.isOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-card w-full max-w-lg rounded-[24px] shadow-2xl border border-border-card overflow-hidden animate-scale-up flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-card flex items-center justify-between bg-bg-base/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-text-main flex items-center gap-2">
                    {locationModalData.title || "Location Inspection"}
                  </h2>
                  <p className="text-xs text-text-sec">
                    {locationModalData.employeeName} • {locationModalData.type} ({locationModalData.time})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLocationModalData(null)} 
                className="text-text-mut hover:text-text-main transition-colors p-2 rounded-xl hover:bg-bg-base cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Resolved Location Highlight */}
              <div className="p-4 rounded-[18px] bg-brand-primary/5 border border-brand-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary">
                    Identified Location
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500">
                    GPS Geocoded
                  </span>
                </div>
                <div className="text-sm font-bold text-text-main leading-relaxed">
                  {getLocationDisplayName(locationModalData.location)}
                </div>
              </div>

              {/* GPS Coordinates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-[14px] bg-bg-base/50 border border-border-card">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Latitude</span>
                  <span className="text-xs font-mono font-bold text-text-main mt-0.5 block">
                    {locationModalData.location?.latitude?.toFixed(6) ?? locationModalData.location?.lat ?? "—"}
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-bg-base/50 border border-border-card">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Longitude</span>
                  <span className="text-xs font-mono font-bold text-text-main mt-0.5 block">
                    {locationModalData.location?.longitude?.toFixed(6) ?? locationModalData.location?.lng ?? locationModalData.location?.lon ?? "—"}
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-bg-base/50 border border-border-card">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Accuracy Radius</span>
                  <span className="text-xs font-mono font-bold text-emerald-500 mt-0.5 block">
                    {locationModalData.location?.accuracy ? `±${Math.round(locationModalData.location.accuracy)} meters` : "High Precision GPS"}
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-bg-base/50 border border-border-card">
                  <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">Logged Date</span>
                  <span className="text-xs font-bold text-text-sec mt-0.5 block">
                    {locationModalData.date || "Today"}
                  </span>
                </div>
              </div>

              {/* Embedded Interactive Map Preview */}
              {(() => {
                const lat = locationModalData.location?.latitude ?? locationModalData.location?.lat;
                const lon = locationModalData.location?.longitude ?? locationModalData.location?.lng ?? locationModalData.location?.lon;
                if (!lat || !lon) return null;

                const bboxDelta = 0.005;
                const bbox = `${lon - bboxDelta},${lat - bboxDelta},${lon + bboxDelta},${lat + bboxDelta}`;
                const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

                return (
                  <div className="rounded-[18px] overflow-hidden border border-border-card shadow-sm bg-bg-base/60">
                    <div className="relative w-full h-[200px]">
                      <iframe
                        title="Location Map"
                        src={osmEmbedUrl}
                        className="w-full h-full border-0 pointer-events-auto"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-border-card bg-bg-base/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const lat = locationModalData.location?.latitude ?? locationModalData.location?.lat;
                  const lon = locationModalData.location?.longitude ?? locationModalData.location?.lng ?? locationModalData.location?.lon;
                  if (lat && lon) {
                    navigator.clipboard.writeText(`${lat}, ${lon}`);
                    showToast("GPS coordinates copied to clipboard!", "success");
                  }
                }}
                className="px-4 py-2.5 rounded-[12px] text-xs font-bold bg-bg-card border border-border-card hover:bg-bg-base text-text-main transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Navigation size={14} className="text-brand-primary" />
                <span>Copy Coords</span>
              </button>

              <div className="flex items-center gap-2">
                {(() => {
                  const lat = locationModalData.location?.latitude ?? locationModalData.location?.lat;
                  const lon = locationModalData.location?.longitude ?? locationModalData.location?.lng ?? locationModalData.location?.lon;
                  const mapsUrl = (lat && lon) ? getGoogleMapsUrl(lat, lon) : "#";

                  return (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-[12px] text-xs font-bold bg-brand-primary hover:bg-brand-hover text-white transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                    >
                      <ExternalLink size={14} />
                      <span>Open in Google Maps</span>
                    </a>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setLocationModalData(null)}
                  className="px-4 py-2.5 rounded-[12px] text-xs font-bold bg-bg-base hover:bg-border-card text-text-sec transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {(activeTab === "domains" && (isAdminUser || can("read", "CustomDomains"))) && (
        <DomainManager companyId={currentUser.companyId} />
      )}
      
      {(activeTab === "roles" && (isAdminUser || can("read", "RolesPermissions"))) && (
        <RolesTab />
      )}

    </div>
  );
}


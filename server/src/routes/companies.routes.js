import express from "express";
import {
  getCompanies,
  getCompanyBySlug,
  createCompany,
  updateCompany,
  getCompanyDomains,
  addCompanyDomain,
  deleteCompanyDomain,
  verifyCompanyDomain,
  deleteCompany
} from "../controllers/companyController.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getCompanies);
router.get("/slug/:slug", getCompanyBySlug);
router.get("/domains", getCompanyDomains);
router.post("/domains", authenticateToken, requireAdmin, addCompanyDomain);
router.delete("/domains/:domain", authenticateToken, requireAdmin, deleteCompanyDomain);
router.delete("/domains", authenticateToken, requireAdmin, deleteCompanyDomain);
router.post("/domains/:domain/verify", authenticateToken, requireAdmin, verifyCompanyDomain);
router.post("/domains/verify", authenticateToken, requireAdmin, verifyCompanyDomain);
router.post("/", authenticateToken, requireAdmin, createCompany);
router.patch("/:id", authenticateToken, requireAdmin, updateCompany);
router.put("/:id", authenticateToken, requireAdmin, updateCompany);
router.delete("/:id", authenticateToken, requireAdmin, deleteCompany);

export default router;


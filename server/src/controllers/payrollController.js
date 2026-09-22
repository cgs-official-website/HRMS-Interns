import { query } from "../config/db.js";

export const getPayroll = async (req, res) => {
  try {
    const { companyId, month, year, userId, employeeId } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;
    const targetEmpId = userId || employeeId;

    let sql = `
      SELECT p.*,
             u.name as employee_name, u.name as "employeeName",
             u.email as employee_email, u.email as "employeeEmail",
             u.department, u.designation, u.employee_id as "employeeCode",
             u.phone as "employeePhone", u.avatar_url as "avatarUrl",
             u.metadata as "userMetadata"
      FROM payroll p
      LEFT JOIN users u ON p.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];


    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND p.company_id = $${params.length}`;
    }
    if (month) {
      params.push(month);
      sql += ` AND p.month = $${params.length}`;
    }
    if (year) {
      params.push(Number(year));
      sql += ` AND p.year = $${params.length}`;
    }
    if (req.user?.role === "employee") {
      params.push(req.user.id);
      sql += ` AND p.employee_id = $${params.length}`;
    } else if (targetEmpId) {
      params.push(targetEmpId);
      sql += ` AND p.employee_id = $${params.length}`;
    }

    sql += " ORDER BY COALESCE(u.name, p.employee_id) ASC";
    const result = await query(sql, params);

    const mappedRows = result.rows.map(row => {
      const meta = (typeof row.metadata === "object" && row.metadata !== null) ? row.metadata : {};
      const gross = Number(row.gross_salary || 0);
      const basic = Number(row.basic_salary || 0);
      const hra = Number(row.hra || 0);
      const allowances = Number(row.allowances || 0);
      const pf = Number(row.pf_deduction || 0);
      const esi = Number(row.esi_deduction || 0);
      const pt = Number(row.tax_deduction || 0);
      const totalDeductions = Number(row.total_deductions || 0);
      const net = Number(row.net_salary || 0);
      const paidDays = Number(row.paid_days !== null && row.paid_days !== undefined ? row.paid_days : 30);
      const presentDays = Number(row.present_days !== null && row.present_days !== undefined ? row.present_days : 30);
      const workingDays = Number(meta.workingDays !== undefined ? meta.workingDays : 30);
      const lopAmount = Number(meta.lopAmount || 0);
      const lopsDays = Number(meta.lopsDays || 0);
      const tds = Number(meta.tds || 0);
      const insurance = Number(meta.insurance || 0);
      const special = allowances || Number(meta.special || 0);
      const userMeta = (typeof row.userMetadata === "object" && row.userMetadata !== null) ? row.userMetadata : {};
      const bankAccountNumber = userMeta.bankAccountNumber || userMeta.bankAccount || "";
      const panNumber = userMeta.panNumber || userMeta.pan || "";
      const pfNumber = userMeta.pfNumber || userMeta.pfUan || "";
      const esiNumber = userMeta.esiNumber || "";
      const joiningDate = userMeta.joiningDate || userMeta.doj || "";

      return {
        ...meta,
        ...row,
        id: row.id,
        _id: row.id,
        companyId: row.company_id,
        company_id: row.company_id,
        employeeId: row.employee_id,
        employee_id: row.employee_id,
        userId: row.employee_id,
        month: row.month,
        year: Number(row.year),
        grossSalary: gross,
        gross: gross,
        basicSalary: basic,
        basic: basic,
        hra: hra,
        allowances: allowances,
        special: special,
        pf: pf,
        esi: esi,
        pt: pt,
        tds: tds,
        insurance: insurance,
        lopAmount: lopAmount,
        lopsDays: lopsDays,
        workingDays: workingDays,
        totalDeductions: totalDeductions,
        netSalary: net,
        net: net,
        paidDays: paidDays,
        presentDays: presentDays,
        status: row.status || "generated",
        bankAccountNumber,
        panNumber,
        pfNumber,
        esiNumber,
        joiningDate
      };
    });

    res.json(mappedRows);
  } catch (err) {
    console.error("getPayroll error:", err);
    res.status(500).json({ error: "Failed to fetch payroll records." });
  }
};

export const savePayroll = async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      month,
      year,
      grossSalary,
      gross,
      basicSalary,
      basic,
      hra = 0,
      allowances,
      special,
      pf = 0,
      esi = 0,
      pt = 0,
      tds = 0,
      insurance = 0,
      lopAmount = 0,
      lopsDays = 0,
      totalDeductions,
      netSalary,
      net,
      paidDays = 30,
      presentDays = 30,
      workingDays = 30,
      status = "generated",
      companyId
    } = req.body;

    const targetEmpId = userId || employeeId;
    const targetCompanyId = companyId || req.user?.companyId;

    if (!targetEmpId || !month || !year) {
      return res.status(400).json({ error: "Employee ID, month, and year are required." });
    }

    const id = `payroll_${targetEmpId}_${month}_${year}`;

    const numGross = Number(grossSalary !== undefined ? grossSalary : (gross !== undefined ? gross : 0));
    const numBasic = Number(basicSalary !== undefined ? basicSalary : (basic !== undefined ? basic : 0));
    const numHra = Number(hra || 0);
    const numAllowances = Number(allowances !== undefined ? allowances : (special !== undefined ? special : 0));
    const numPf = Number(pf || 0);
    const numEsi = Number(esi || 0);
    const numPt = Number(pt || 0);
    const numTds = Number(tds || 0);
    const numInsurance = Number(insurance || 0);
    const numLopAmount = Number(lopAmount || 0);
    const numLopsDays = Number(lopsDays || 0);
    const numPaidDays = Number(paidDays !== undefined ? paidDays : 30);
    const numPresentDays = Number(presentDays !== undefined ? presentDays : 30);
    const numWorkingDays = Number(workingDays !== undefined ? workingDays : 30);

    const calculatedDeductions = numPf + numEsi + numPt + numTds + numInsurance + numLopAmount;
    const numTotalDeductions = Number(totalDeductions !== undefined ? totalDeductions : calculatedDeductions);
    const numNet = Number(netSalary !== undefined ? netSalary : (net !== undefined ? net : (numGross - numTotalDeductions)));

    const metadata = {
      workingDays: numWorkingDays,
      lopAmount: numLopAmount,
      lopsDays: numLopsDays,
      tds: numTds,
      insurance: numInsurance,
      special: numAllowances
    };

    const result = await query(
      `INSERT INTO payroll (id, company_id, employee_id, month, year, basic_salary, hra, allowances, gross_salary, pf_deduction, esi_deduction, tax_deduction, total_deductions, net_salary, paid_days, present_days, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (id) DO UPDATE SET
         company_id = EXCLUDED.company_id,
         basic_salary = EXCLUDED.basic_salary,
         hra = EXCLUDED.hra,
         allowances = EXCLUDED.allowances,
         gross_salary = EXCLUDED.gross_salary,
         pf_deduction = EXCLUDED.pf_deduction,
         esi_deduction = EXCLUDED.esi_deduction,
         tax_deduction = EXCLUDED.tax_deduction,
         total_deductions = EXCLUDED.total_deductions,
         net_salary = EXCLUDED.net_salary,
         paid_days = EXCLUDED.paid_days,
         present_days = EXCLUDED.present_days,
         status = EXCLUDED.status,
         metadata = EXCLUDED.metadata,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        id, targetCompanyId, targetEmpId, month, Number(year), numBasic, numHra,
        numAllowances, numGross, numPf, numEsi, numPt,
        numTotalDeductions, numNet, numPaidDays, numPresentDays, status,
        JSON.stringify(metadata)
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      ...metadata,
      ...row,
      id: row.id,
      _id: row.id,
      companyId: row.company_id,
      employeeId: row.employee_id,
      userId: row.employee_id,
      grossSalary: Number(row.gross_salary),
      gross: Number(row.gross_salary),
      basicSalary: Number(row.basic_salary),
      basic: Number(row.basic_salary),
      netSalary: Number(row.net_salary),
      net: Number(row.net_salary),
      pf: Number(row.pf_deduction),
      esi: Number(row.esi_deduction),
      pt: Number(row.tax_deduction),
      totalDeductions: Number(row.total_deductions),
      paidDays: Number(row.paid_days),
      workingDays: numWorkingDays
    });
  } catch (err) {
    console.error("savePayroll error:", err);
    res.status(500).json({ error: "Failed to save payroll record." });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, employeeId, userId, month, year } = req.query;

    let result;
    if (id && id !== "undefined" && id !== "null") {
      result = await query("DELETE FROM payroll WHERE id = $1 RETURNING id", [id]);
    } else {
      const targetEmp = userId || employeeId;
      const targetComp = companyId || req.user?.companyId;
      let sql = "DELETE FROM payroll WHERE 1=1";
      const params = [];
      if (targetComp) {
        params.push(targetComp);
        sql += ` AND company_id = $${params.length}`;
      }
      if (targetEmp) {
        params.push(targetEmp);
        sql += ` AND employee_id = $${params.length}`;
      }
      if (month) {
        params.push(month);
        sql += ` AND month = $${params.length}`;
      }
      if (year) {
        params.push(Number(year));
        sql += ` AND year = $${params.length}`;
      }
      sql += " RETURNING id";
      result = await query(sql, params);
    }

    if (!result || result.rows.length === 0) {
      return res.status(404).json({ error: "Payroll record not found." });
    }
    res.json({ message: "Payroll record deleted successfully.", id: result.rows[0].id });
  } catch (err) {
    console.error("deletePayroll error:", err);
    res.status(500).json({ error: "Failed to delete payroll record." });
  }
};

export const wipeAllPayrolls = async (req, res) => {
  try {
    const { companyId, month, year } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const targetComp = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    if (!targetComp && !isSuperAdmin) {
      return res.status(400).json({ error: "Company ID is required to wipe payroll." });
    }

    let sql = "DELETE FROM payroll WHERE 1=1";
    const params = [];

    if (targetComp) {
      params.push(targetComp);
      sql += ` AND company_id = $${params.length}`;
    }
    if (month) {
      params.push(month);
      sql += ` AND month = $${params.length}`;
    }
    if (year) {
      params.push(Number(year));
      sql += ` AND year = $${params.length}`;
    }
    sql += " RETURNING id";

    const result = await query(sql, params);
    res.json({ message: `Wiped ${result.rows.length} payroll records.`, count: result.rows.length });
  } catch (err) {
    console.error("wipeAllPayrolls error:", err);
    res.status(500).json({ error: "Failed to wipe payroll records." });
  }
};


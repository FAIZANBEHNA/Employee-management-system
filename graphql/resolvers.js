const { pool } = require("../db/connection");

function cleanEmployeeInput(input) {
  const name = String(input.name || "").trim();
  const mobile = String(input.mobile || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const departmentId = Number(input.departmentId);
  const salary = Number(input.salary);

  if (!name || name.length < 3) throw new Error("Employee name must contain at least 3 characters.");
  if (!/^\d{10}$/.test(mobile)) throw new Error("Mobile number must contain exactly 10 digits.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email.");
  if (!Number.isInteger(departmentId) || departmentId < 1) throw new Error("Please select a department.");
  if (!Number.isFinite(salary) || salary < 0) throw new Error("Salary must be 0 or greater.");

  return { name, mobile, email, departmentId, salary };
}

function mapEmployee(row) {
  return {
    id: String(row.id),
    name: row.name,
    department: { id: String(row.department_id), name: row.department_name },
    mobile: row.mobile,
    email: row.email,
    salary: Number(row.salary),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function getEmployeeById(id) {
  const [rows] = await pool.query(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     INNER JOIN departments d ON d.id = e.department_id
     WHERE e.id = ?`,
    [id]
  );
  if (!rows[0]) throw new Error("Employee not found.");
  return mapEmployee(rows[0]);
}

const root = {
  dashboardStats: async () => {
    const [[employeeCount]] = await pool.query("SELECT COUNT(*) AS total FROM employees");
    const [[departmentCount]] = await pool.query("SELECT COUNT(*) AS total FROM departments");
    return {
      totalEmployees: Number(employeeCount.total),
      totalDepartments: Number(departmentCount.total)
    };
  },

  departments: async () => {
    const [rows] = await pool.query("SELECT id, name FROM departments ORDER BY name ASC");
    return rows.map((row) => ({ id: String(row.id), name: row.name }));
  },

  employeeEmailExists: async ({ email, excludeId }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return false;

    const params = [normalizedEmail];
    let sql = "SELECT id FROM employees WHERE LOWER(email) = ?";

    if (excludeId !== null && excludeId !== undefined && String(excludeId) !== "") {
      sql += " AND id <> ?";
      params.push(Number(excludeId));
    }

    sql += " LIMIT 1";
    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
  },

  employees: async ({ page = 1, limit = 10, search = "", departmentId }) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const offset = (safePage - 1) * safeLimit;
    const where = [];
    const params = [];

    if (String(search).trim()) {
      where.push("e.name LIKE ?");
      params.push(`%${String(search).trim()}%`);
    }

    if (departmentId !== null && departmentId !== undefined && String(departmentId) !== "") {
      where.push("e.department_id = ?");
      params.push(Number(departmentId));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM employees e ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT e.*, d.name AS department_name
       FROM employees e
       INNER JOIN departments d ON d.id = e.department_id
       ${whereSql}
       ORDER BY e.id ASC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const total = Number(countRow.total);

    return {
      items: rows.map(mapEmployee),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit))
    };
  },

  addEmployee: async ({ input }) => {
    const data = cleanEmployeeInput(input);

    const [department] = await pool.query(
      "SELECT id FROM departments WHERE id = ?",
      [data.departmentId]
    );
    if (!department[0]) throw new Error("Selected department does not exist.");

    try {
      const [result] = await pool.query(
        `INSERT INTO employees (name, department_id, mobile, email, salary)
         VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.departmentId, data.mobile, data.email, data.salary]
      );
      return getEmployeeById(result.insertId);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") throw new Error("An employee with this email already exists.");
      throw error;
    }
  },

  updateEmployee: async ({ id, input }) => {
    const employeeId = Number(id);
    if (!Number.isInteger(employeeId) || employeeId < 1) throw new Error("Invalid employee id.");

    const data = cleanEmployeeInput(input);

    const [department] = await pool.query(
      "SELECT id FROM departments WHERE id = ?",
      [data.departmentId]
    );
    if (!department[0]) throw new Error("Selected department does not exist.");

    try {
      const [result] = await pool.query(
        `UPDATE employees
         SET name = ?, department_id = ?, mobile = ?, email = ?, salary = ?
         WHERE id = ?`,
        [data.name, data.departmentId, data.mobile, data.email, data.salary, employeeId]
      );

      if (!result.affectedRows) throw new Error("Employee not found.");
      return getEmployeeById(employeeId);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") throw new Error("An employee with this email already exists.");
      throw error;
    }
  },

  deleteEmployee: async ({ id }) => {
    const employeeId = Number(id);
    if (!Number.isInteger(employeeId) || employeeId < 1) throw new Error("Invalid employee id.");

    const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [employeeId]);
    if (!result.affectedRows) throw new Error("Employee not found.");
    return true;
  }
};

module.exports = { root };

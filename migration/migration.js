require("dotenv").config();

const mysql = require("mysql2/promise");

async function runMigration() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mini_employee_management"
  };

  const connection = await mysql.createConnection(config);

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_departments_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        department_id INT UNSIGNED NOT NULL,
        mobile VARCHAR(30) NOT NULL,
        email VARCHAR(180) NOT NULL,
        salary DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_employees_email (email),
        KEY idx_employees_name (name),
        KEY idx_employees_department (department_id),
        CONSTRAINT fk_employees_department
          FOREIGN KEY (department_id) REFERENCES departments(id)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const departments = ["HR", "IT", "Sales", "Finance"];
    for (const name of departments) {
      await connection.query(
        "INSERT IGNORE INTO departments (name) VALUES (?)",
        [name]
      );
    }

    console.log("Migration completed successfully.");
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigration().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
  });
}

module.exports = { runMigration };

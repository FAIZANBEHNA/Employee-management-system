require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createHandler } = require("graphql-http/lib/use/express");
const { schema } = require("./graphql/schema");
const { root } = require("./graphql/resolvers");
const { testConnection } = require("./db/connection");
const { runMigration } = require("./migration/migration");

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((value) => value.trim())
      : true
  })
);

app.get("/health", async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true, service: "mini-employee-management-api" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed. Check the backend .env settings and make sure MySQL is running." });
  }
});

app.use(
  "/graphql",
  express.json(),
  createHandler({
    schema,
    rootValue: root,
    graphiql: process.env.NODE_ENV !== "production"
  })
);

app.get("/migration", (req, res) => {
  res.sendFile(require("path").join(__dirname, "public", "migration.html"));
});

app.post("/migration/run", async (req, res) => {
  try {
    await runMigration();
    res.json({ success: true, message: "Migration completed successfully. All required tables are ready." });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({
      success: false,
      message: `Migration failed: ${error.message}`
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    name: "Mini Employee Management API",
    graphql: "/graphql",
    migration: "/migration",
    health: "/health"
  });
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
  console.log(`GraphQL: http://localhost:${port}/graphql`);
  console.log(`Migration page: http://localhost:${port}/migration`);
});

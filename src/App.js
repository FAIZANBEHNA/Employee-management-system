import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import EmployeeForm from "./components/EmployeeForm";
import EmployeeList from "./components/EmployeeList";
import { graphqlRequest } from "./api/graphql";

export default function App() {
  const [active, setActive] = useState("view");
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ totalEmployees: 0, totalDepartments: 0 });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bootError, setBootError] = useState("");
  const [loadingBase, setLoadingBase] = useState(true);

  useEffect(() => {
    loadBaseData();
  }, []);

  async function loadBaseData() {
    setLoadingBase(true);
    setBootError("");
    try {
      const data = await graphqlRequest(`
        query Dashboard {
          dashboardStats { totalEmployees totalDepartments }
          departments { id name }
        }
      `);
      setStats(data.dashboardStats);
      setDepartments(data.departments);
    } catch (error) {
      setBootError(error.message);
    } finally {
      setLoadingBase(false);
    }
  }

  async function refresh() {
    await loadBaseData();
    setRefreshKey((value) => value + 1);
  }

  function editEmployee(employee) {
    setEditingEmployee(employee);
    setActive("add");
  }

  function goToAdd() {
    setEditingEmployee(null);
    setActive("add");
  }

  function goToView() {
    setEditingEmployee(null);
    setActive("view");
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={active === "add" ? (value) => {
        if (value === "add") goToAdd();
        else goToView();
      } : (value) => {
        if (value === "add") goToAdd();
        else goToView();
      }} />

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Employee Dashboard</h1>
            <p>Manage employees from one simple dashboard.</p>
          </div>
        </header>

        {bootError && (
          <div className="alert error">
            <div>{bootError}</div>
            <button className="retry-btn" onClick={loadBaseData} disabled={loadingBase}>
              {loadingBase ? "Retrying..." : "Retry Connection"}
            </button>
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <span>Total Employees</span>
            <strong>{stats.totalEmployees}</strong>
          </div>
          <div className="stat-card">
            <span>Departments</span>
            <strong>{stats.totalDepartments}</strong>
          </div>
        </div>

        {active === "add" ? (
          <EmployeeForm
            departments={departments}
            editingEmployee={editingEmployee}
            onSaved={async () => {
              await refresh();
              setEditingEmployee(null);
              setActive("view");
            }}
            onCancel={goToView}
          />
        ) : (
          <EmployeeList
            departments={departments}
            refreshKey={refreshKey}
            onEdit={editEmployee}
            onDeleted={refresh}
          />
        )}
      </main>
    </div>
  );
}

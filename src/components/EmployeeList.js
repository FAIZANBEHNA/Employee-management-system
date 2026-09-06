import { useEffect, useState } from "react";
import { graphqlRequest } from "../api/graphql";

const PAGE_SIZE = 10;

export default function EmployeeList({
  departments,
  refreshKey,
  onEdit,
  onDeleted
}) {
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1
  });
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEmployees();
  }, [page, search, departmentId, refreshKey]);

  async function loadEmployees() {
    setLoading(true);
    setError("");

    const query = `query Employees($page: Int, $limit: Int, $search: String, $departmentId: ID) {
      employees(page: $page, limit: $limit, search: $search, departmentId: $departmentId) {
        items {
          id name mobile email salary
          department { id name }
          createdAt updatedAt
        }
        total page limit totalPages
      }
    }`;

    try {
      const result = await graphqlRequest(query, {
        page,
        limit: PAGE_SIZE,
        search,
        departmentId: departmentId || null
      });
      setData(result.employees);
      if (result.employees.totalPages < page) setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmployee(id) {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await graphqlRequest(
        `mutation Delete($id: ID!) { deleteEmployee(id: $id) }`,
        { id }
      );
      if (data.items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadEmployees();
      }
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card list-card">
      <div className="section-heading list-heading">
        <div>
          <h2>Employees</h2>
          <p>{data.total} total employee{data.total === 1 ? "" : "s"}</p>
        </div>
        <div className="filters">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name..."
          />
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Salary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="empty">Loading employees...</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan="7" className="empty">No employees found.</td></tr>
            ) : (
              data.items.map((employee) => (
                <tr key={employee.id}>
                  <td>#{employee.id}</td>
                  <td><strong>{employee.name}</strong></td>
                  <td><span className="badge">{employee.department.name}</span></td>
                  <td>{employee.mobile}</td>
                  <td>{employee.email}</td>
                  <td>₹{Number(employee.salary).toLocaleString("en-IN")}</td>
                  <td>
                    <div className="row-actions">
                      <button className="edit-btn" onClick={() => onEdit(employee)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteEmployee(employee.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>Page {data.page} of {data.totalPages}</span>
        <div>
          <button
            className="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <button
            className="secondary"
            disabled={page >= data.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

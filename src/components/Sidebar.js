export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">EM</div>
        <div>
          <strong>Employee</strong>
          <span>Management</span>
        </div>
      </div>

      <nav className="nav">
        <button
          className={active === "add" ? "nav-item active" : "nav-item"}
          onClick={() => onChange("add")}
        >
          <span>＋</span>
          Add Employee
        </button>

        <button
          className={active === "view" ? "nav-item active" : "nav-item"}
          onClick={() => onChange("view")}
        >
          <span>☷</span>
          View Employee
        </button>
      </nav>
    </aside>
  );
}

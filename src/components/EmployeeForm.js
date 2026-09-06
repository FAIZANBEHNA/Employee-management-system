import { useEffect, useRef, useState } from "react";
import { graphqlRequest } from "../api/graphql";

const emptyForm = {
  name: "",
  departmentId: "",
  mobile: "",
  email: "",
  salary: ""
};

export default function EmployeeForm({
  departments,
  editingEmployee,
  onSaved,
  onCancel
}) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const emailCheckTimer = useRef(null);
  const emailCheckRequest = useRef(0);

  useEffect(() => {
    if (editingEmployee) {
      setForm({
        name: editingEmployee.name,
        departmentId: editingEmployee.department.id,
        mobile: editingEmployee.mobile,
        email: editingEmployee.email,
        salary: String(editingEmployee.salary)
      });
    } else {
      setForm(emptyForm);
    }
    setFieldErrors({});
    setError("");
  }, [editingEmployee]);

  useEffect(() => {
    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    };
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setError("");

    if (field === "email") {
      checkEmailAvailability(value);
    }
  }

  function validateField(field, value) {
    const trimmed = String(value || "").trim();

    if (field === "name") {
      if (!trimmed) return "Employee name is required.";
      if (trimmed.length < 3) return "Employee name must contain at least 3 characters.";
    }

    if (field === "mobile") {
      if (!trimmed) return "Mobile number is required.";
      if (!/^\d{10}$/.test(trimmed)) return "Mobile number must contain exactly 10 digits.";
    }

    if (field === "email") {
      if (!trimmed) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return "Please enter a valid email address.";
      }
    }

    if (field === "departmentId" && !trimmed) return "Please select a department.";
    if (field === "salary" && (value === "" || Number(value) < 0)) return "Please enter a valid salary.";

    return "";
  }

  function validateForm() {
    const nextErrors = {
      name: validateField("name", form.name),
      mobile: validateField("mobile", form.mobile),
      email: validateField("email", form.email),
      departmentId: validateField("departmentId", form.departmentId),
      salary: validateField("salary", form.salary)
    };

    if (
      !nextErrors.email &&
      fieldErrors.email === "This email address is already registered."
    ) {
      nextErrors.email = fieldErrors.email;
    }

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) delete nextErrors[key];
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function checkEmailAvailability(value) {
    const email = String(value || "").trim().toLowerCase();
    const currentRequest = ++emailCheckRequest.current;

    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    emailCheckTimer.current = setTimeout(async () => {
      try {
        const data = await graphqlRequest(
          `query CheckEmail($email: String!, $excludeId: ID) {
            employeeEmailExists(email: $email, excludeId: $excludeId)
          }`,
          {
            email,
            excludeId: editingEmployee?.id || null
          }
        );

        if (currentRequest !== emailCheckRequest.current) return;

        setFieldErrors((current) => ({
          ...current,
          email: data.employeeEmailExists ? "This email address is already registered." : ""
        }));
      } catch (requestError) {
        // The normal save request will still enforce email uniqueness on the backend.
      }
    }, 450);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSaving(true);

    const input = {
      name: form.name.trim(),
      departmentId: form.departmentId,
      mobile: form.mobile.trim(),
      email: form.email.trim().toLowerCase(),
      salary: Number(form.salary)
    };

    const mutation = editingEmployee
      ? `mutation Update($id: ID!, $input: EmployeeInput!) {
          updateEmployee(id: $id, input: $input) {
            id name mobile email salary
            department { id name }
            createdAt updatedAt
          }
        }`
      : `mutation Add($input: EmployeeInput!) {
          addEmployee(input: $input) {
            id name mobile email salary
            department { id name }
            createdAt updatedAt
          }
        }`;

    try {
      await graphqlRequest(
        mutation,
        editingEmployee
          ? { id: editingEmployee.id, input }
          : { input }
      );
      setForm(emptyForm);
      setFieldErrors({});
      onSaved();
    } catch (err) {
      const message = err.message || "Unable to save employee.";
      if (message.toLowerCase().includes("email") && message.toLowerCase().includes("already")) {
        setFieldErrors((current) => ({
          ...current,
          email: "This email address is already registered."
        }));
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card form-card">
      <div className="section-heading">
        <div>
          <h2>{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
          <p>{editingEmployee ? "Update employee details." : "Create a new employee record."}</p>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={submit} className="form-grid">
        <label>
          Employee Name
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            onBlur={(e) => setFieldErrors((current) => ({ ...current, name: validateField("name", e.target.value) }))}
            placeholder="Enter employee name"
            maxLength="150"
          />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </label>

        <label>
          Department
          <select
            value={form.departmentId}
            onChange={(e) => update("departmentId", e.target.value)}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {fieldErrors.departmentId && <span className="field-error">{fieldErrors.departmentId}</span>}
        </label>

        <label>
          Mobile
          <input
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={(e) => setFieldErrors((current) => ({ ...current, mobile: validateField("mobile", e.target.value) }))}
            placeholder="Enter 10-digit mobile number"
            maxLength="10"
            inputMode="numeric"
          />
          {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            onBlur={(e) => {
              const validation = validateField("email", e.target.value);
              if (validation) {
                setFieldErrors((current) => ({ ...current, email: validation }));
              } else {
                checkEmailAvailability(e.target.value);
              }
            }}
            placeholder="Enter email address"
            maxLength="180"
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>

        <label>
          Salary
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.salary}
            onChange={(e) => update("salary", e.target.value)}
            placeholder="Enter salary"
          />
          {fieldErrors.salary && <span className="field-error">{fieldErrors.salary}</span>}
        </label>

        <div className="form-actions">
          <button className="primary" disabled={saving}>
            {saving ? "Saving..." : editingEmployee ? "Update Employee" : "Add Employee"}
          </button>
          {editingEmployee && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

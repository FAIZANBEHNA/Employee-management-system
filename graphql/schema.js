const { buildSchema } = require("graphql");

const schema = buildSchema(`
  type Department {
    id: ID!
    name: String!
  }

  type Employee {
    id: ID!
    name: String!
    department: Department!
    mobile: String!
    email: String!
    salary: Float!
    createdAt: String!
    updatedAt: String!
  }

  type EmployeePage {
    items: [Employee!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type DashboardStats {
    totalEmployees: Int!
    totalDepartments: Int!
  }

  input EmployeeInput {
    name: String!
    departmentId: ID!
    mobile: String!
    email: String!
    salary: Float!
  }

  type Query {
    dashboardStats: DashboardStats!
    departments: [Department!]!
    employees(
      page: Int = 1
      limit: Int = 10
      search: String = ""
      departmentId: ID
    ): EmployeePage!
    employeeEmailExists(email: String!, excludeId: ID): Boolean!
  }

  type Mutation {
    addEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
  }
`);

module.exports = { schema };

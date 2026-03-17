import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(),
  departmentId: integer("department_id"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: text("date_of_birth"),
  hireDate: text("hire_date"),
  userId: integer("user_id").unique(),
  fingerprintId: text("fingerprint_id").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;

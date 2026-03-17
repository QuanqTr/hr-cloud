import { Router } from "express";
import { db, employeesTable, usersTable, departmentsTable } from "@workspace/db";
import { eq, ilike, and, or } from "drizzle-orm";
import { requireAuth, requireRole, hashPassword } from "../lib/auth.js";

const router = Router();

async function formatEmployee(emp: any) {
  let departmentName: string | null = null;
  let username: string | null = null;
  let role = "employee";

  if (emp.departmentId) {
    const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId));
    if (depts.length > 0) departmentName = depts[0].name;
  }
  if (emp.userId) {
    const users = await db.select({ username: usersTable.username, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, emp.userId));
    if (users.length > 0) {
      username = users[0].username;
      role = users[0].role;
    }
  }

  return {
    id: emp.id,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    position: emp.position,
    departmentId: emp.departmentId ?? null,
    departmentName,
    email: emp.email ?? null,
    phone: emp.phone ?? null,
    address: emp.address ?? null,
    dateOfBirth: emp.dateOfBirth ?? null,
    hireDate: emp.hireDate ?? null,
    userId: emp.userId ?? null,
    username,
    role,
    fingerprintId: emp.fingerprintId ?? null,
    isActive: emp.isActive,
    createdAt: emp.createdAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { departmentId, search } = req.query;
    let emps = await db.select().from(employeesTable);

    if (departmentId) {
      emps = emps.filter((e) => e.departmentId === parseInt(departmentId as string));
    }
    if (search) {
      const s = (search as string).toLowerCase();
      emps = emps.filter(
        (e) =>
          e.fullName.toLowerCase().includes(s) ||
          e.employeeCode.toLowerCase().includes(s) ||
          e.position.toLowerCase().includes(s)
      );
    }

    const result = await Promise.all(emps.map(formatEmployee));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { employeeCode, fullName, position, departmentId, email, phone, address, dateOfBirth, hireDate, username, password, role, fingerprintId } = req.body;

    const userInserted = await db.insert(usersTable).values({
      username,
      passwordHash: hashPassword(password),
      role: role ?? "employee",
    }).returning();
    const user = userInserted[0];

    const empInserted = await db.insert(employeesTable).values({
      employeeCode,
      fullName,
      position,
      departmentId: departmentId ?? null,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      dateOfBirth: dateOfBirth ?? null,
      hireDate: hireDate ?? null,
      userId: user.id,
      fingerprintId: fingerprintId ?? null,
    }).returning();

    const emp = empInserted[0];
    res.status(201).json(await formatEmployee(emp));
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      res.status(409).json({ error: "Conflict", message: "Employee code or username already exists" });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const emps = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
    if (emps.length === 0) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json(await formatEmployee(emps[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const requesterId = (req as any).userId;
    const requesterRole = (req as any).userRole;

    const emps = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
    if (emps.length === 0) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    // Employees can only update themselves
    if (requesterRole === "employee" && emps[0].userId !== requesterId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { fullName, position, departmentId, email, phone, address, dateOfBirth, hireDate, role, fingerprintId, isActive } = req.body;
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (position !== undefined && requesterRole !== "employee") updateData.position = position;
    if (departmentId !== undefined && requesterRole !== "employee") updateData.departmentId = departmentId;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (hireDate !== undefined && requesterRole !== "employee") updateData.hireDate = hireDate;
    if (fingerprintId !== undefined && requesterRole !== "employee") updateData.fingerprintId = fingerprintId;
    if (isActive !== undefined && requesterRole === "admin") updateData.isActive = isActive;

    const updated = await db.update(employeesTable).set(updateData).where(eq(employeesTable.id, id)).returning();

    if (role !== undefined && requesterRole === "admin" && emps[0].userId) {
      await db.update(usersTable).set({ role }).where(eq(usersTable.id, emps[0].userId));
    }

    res.json(await formatEmployee(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const emps = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
    if (emps.length > 0 && emps[0].userId) {
      await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, emps[0].userId));
    }
    await db.update(employeesTable).set({ isActive: false }).where(eq(employeesTable.id, id));
    res.json({ success: true, message: "Employee deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

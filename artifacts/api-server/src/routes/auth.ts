import { Router } from "express";
import { db, usersTable, employeesTable, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, createSession, deleteSession, requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Bad Request", message: "Username and password required" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (users.length === 0) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const user = users[0];
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Unauthorized", message: "Account is deactivated" });
      return;
    }

    const token = createSession(user.id, user.role);

    const employees = await db
      .select({ id: employeesTable.id, fullName: employeesTable.fullName, departmentId: employeesTable.departmentId })
      .from(employeesTable)
      .where(eq(employeesTable.userId, user.id));

    let departmentName: string | null = null;
    let employeeId: number | null = null;
    let fullName = username;

    if (employees.length > 0) {
      employeeId = employees[0].id;
      fullName = employees[0].fullName;
      if (employees[0].departmentId) {
        const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, employees[0].departmentId));
        if (depts.length > 0) departmentName = depts[0].name;
      }
    }

    res.cookie("session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId,
        fullName,
        departmentId: employees[0]?.departmentId ?? null,
        departmentName,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/logout", (req, res) => {
  const token = req.cookies?.session_token;
  if (token) deleteSession(token);
  res.clearCookie("session_token");
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (users.length === 0) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = users[0];

    const employees = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.userId, userId));

    let departmentName: string | null = null;
    let employeeId: number | null = null;
    let fullName = user.username;

    if (employees.length > 0) {
      employeeId = employees[0].id;
      fullName = employees[0].fullName;
      if (employees[0].departmentId) {
        const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, employees[0].departmentId));
        if (depts.length > 0) departmentName = depts[0].name;
      }
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId,
      fullName,
      departmentId: employees[0]?.departmentId ?? null,
      departmentName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

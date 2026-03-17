import { Router } from "express";
import { db, departmentsTable, employeesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const depts = await db.select().from(departmentsTable);
    const result = await Promise.all(
      depts.map(async (dept) => {
        const countRows = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(employeesTable)
          .where(eq(employeesTable.departmentId, dept.id));
        const count = countRows[0]?.count ?? 0;

        let managerName: string | null = null;
        if (dept.managerId) {
          const mgr = await db.select({ fullName: employeesTable.fullName }).from(employeesTable).where(eq(employeesTable.id, dept.managerId));
          if (mgr.length > 0) managerName = mgr[0].fullName;
        }

        return {
          id: dept.id,
          name: dept.name,
          description: dept.description ?? null,
          managerId: dept.managerId ?? null,
          managerName,
          employeeCount: count,
          createdAt: dept.createdAt.toISOString(),
        };
      })
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "Name is required" });
      return;
    }
    const inserted = await db.insert(departmentsTable).values({ name, description: description ?? null, managerId: managerId ?? null }).returning();
    const dept = inserted[0];
    res.status(201).json({
      id: dept.id,
      name: dept.name,
      description: dept.description ?? null,
      managerId: dept.managerId ?? null,
      managerName: null,
      employeeCount: 0,
      createdAt: dept.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const depts = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
    if (depts.length === 0) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const dept = depts[0];
    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(eq(employeesTable.departmentId, id));
    let managerName: string | null = null;
    if (dept.managerId) {
      const mgr = await db.select({ fullName: employeesTable.fullName }).from(employeesTable).where(eq(employeesTable.id, dept.managerId));
      if (mgr.length > 0) managerName = mgr[0].fullName;
    }
    res.json({
      id: dept.id,
      name: dept.name,
      description: dept.description ?? null,
      managerId: dept.managerId ?? null,
      managerName,
      employeeCount: countRows[0]?.count ?? 0,
      createdAt: dept.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, managerId } = req.body;
    const updated = await db.update(departmentsTable).set({ name, description: description ?? null, managerId: managerId ?? null }).where(eq(departmentsTable.id, id)).returning();
    if (updated.length === 0) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const dept = updated[0];
    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(eq(employeesTable.departmentId, id));
    let managerName: string | null = null;
    if (dept.managerId) {
      const mgr = await db.select({ fullName: employeesTable.fullName }).from(employeesTable).where(eq(employeesTable.id, dept.managerId));
      if (mgr.length > 0) managerName = mgr[0].fullName;
    }
    res.json({
      id: dept.id,
      name: dept.name,
      description: dept.description ?? null,
      managerId: dept.managerId ?? null,
      managerName,
      employeeCount: countRows[0]?.count ?? 0,
      createdAt: dept.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

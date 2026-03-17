import { Router } from "express";
import { db, leavesTable, employeesTable, departmentsTable, usersTable, attendanceTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

async function formatLeave(leave: any) {
  const emps = await db.select({ fullName: employeesTable.fullName, employeeCode: employeesTable.employeeCode, departmentId: employeesTable.departmentId })
    .from(employeesTable).where(eq(employeesTable.id, leave.employeeId));
  const emp = emps[0];

  let departmentName: string | null = null;
  if (emp?.departmentId) {
    const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId));
    if (depts.length > 0) departmentName = depts[0].name;
  }

  let approverName: string | null = null;
  if (leave.approvedBy) {
    const approverEmps = await db.select({ fullName: employeesTable.fullName }).from(employeesTable).where(eq(employeesTable.userId, leave.approvedBy));
    if (approverEmps.length > 0) approverName = approverEmps[0].fullName;
  }

  return {
    id: leave.id,
    employeeId: leave.employeeId,
    employeeCode: emp?.employeeCode ?? "",
    fullName: emp?.fullName ?? "",
    departmentName,
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    totalDays: leave.totalDays,
    reason: leave.reason,
    status: leave.status,
    approvedBy: leave.approvedBy ?? null,
    approverName,
    approvedAt: leave.approvedAt?.toISOString() ?? null,
    createdAt: leave.createdAt.toISOString(),
  };
}

function calcWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, count);
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { employeeId, status, month } = req.query;
    const userRole = (req as any).userRole;
    const userId = (req as any).userId;

    let allLeaves = await db.select().from(leavesTable);

    if (userRole === "employee") {
      const emps = await db.select({ id: employeesTable.id }).from(employeesTable).where(eq(employeesTable.userId, userId));
      if (emps.length > 0) {
        allLeaves = allLeaves.filter((l) => l.employeeId === emps[0].id);
      }
    } else if (employeeId) {
      allLeaves = allLeaves.filter((l) => l.employeeId === parseInt(employeeId as string));
    }

    if (status) {
      allLeaves = allLeaves.filter((l) => l.status === status);
    }
    if (month) {
      allLeaves = allLeaves.filter((l) => l.startDate.startsWith(month as string));
    }

    allLeaves.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const result = await Promise.all(allLeaves.map(formatLeave));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { leaveType, startDate, endDate, reason } = req.body;

    const emps = await db.select().from(employeesTable).where(eq(employeesTable.userId, userId));
    if (emps.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "No employee profile found" });
      return;
    }
    const emp = emps[0];
    const totalDays = calcWorkingDays(startDate, endDate);

    const inserted = await db.insert(leavesTable).values({
      employeeId: emp.id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: "pending",
    }).returning();

    res.status(201).json(await formatLeave(inserted[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const leaves = await db.select().from(leavesTable).where(eq(leavesTable.id, id));
    if (leaves.length === 0) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json(await formatLeave(leaves[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const approverId = (req as any).userId;
    const { status, note } = req.body;

    const updated = await db.update(leavesTable).set({
      status,
      approvedBy: approverId,
      approvedAt: new Date(),
      note: note ?? null,
    }).where(eq(leavesTable.id, id)).returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    // If approved, mark attendance as on_leave for those days
    if (status === "approved") {
      const leave = updated[0];
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
          const dateStr = cur.toISOString().split("T")[0];
          const existing = await db.select().from(attendanceTable)
            .where(and(eq(attendanceTable.employeeId, leave.employeeId), eq(attendanceTable.date, dateStr)));
          if (existing.length === 0) {
            await db.insert(attendanceTable).values({
              employeeId: leave.employeeId,
              date: dateStr,
              status: "on_leave",
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
            });
          } else {
            await db.update(attendanceTable).set({ status: "on_leave" }).where(eq(attendanceTable.id, existing[0].id));
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    res.json(await formatLeave(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

import { Router } from "express";
import { db, employeesTable, departmentsTable, attendanceTable, leavesTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAllSettings } from "../lib/settings.js";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const totalEmployees = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(eq(employeesTable.isActive, true));
    const totalDepartments = await db.select({ count: sql<number>`count(*)::int` }).from(departmentsTable);

    const todayAtts = await db.select().from(attendanceTable).where(eq(attendanceTable.date, today));
    const todayPresent = todayAtts.filter((a) => ["on_time", "late", "early_leave"].includes(a.status)).length;
    const todayLate = todayAtts.filter((a) => a.status === "late").length;
    const todayOnLeave = todayAtts.filter((a) => a.status === "on_leave").length;

    const totalActive = totalEmployees[0]?.count ?? 0;
    const todayAbsent = Math.max(0, totalActive - todayPresent - todayOnLeave);

    const pendingLeaves = await db.select({ count: sql<number>`count(*)::int` }).from(leavesTable).where(eq(leavesTable.status, "pending"));

    // Recent attendance (last 10 records)
    const recentAtts = await db.select().from(attendanceTable);
    recentAtts.sort((a, b) => b.date.localeCompare(a.date));
    const recentSlice = recentAtts.slice(0, 10);

    const recentAttendance = await Promise.all(
      recentSlice.map(async (att) => {
        const emps = await db.select().from(employeesTable).where(eq(employeesTable.id, att.employeeId));
        const emp = emps[0];
        let departmentName: string | null = null;
        if (emp?.departmentId) {
          const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId));
          if (depts.length > 0) departmentName = depts[0].name;
        }
        return {
          id: att.id,
          employeeId: att.employeeId,
          employeeCode: emp?.employeeCode ?? "",
          fullName: emp?.fullName ?? "",
          departmentName,
          date: att.date,
          checkIn: att.checkIn ?? null,
          checkOut: att.checkOut ?? null,
          status: att.status,
          lateMinutes: att.lateMinutes,
          earlyLeaveMinutes: att.earlyLeaveMinutes,
          workHours: att.workHours ?? null,
          note: att.note ?? null,
        };
      })
    );

    res.json({
      totalEmployees: totalActive,
      totalDepartments: totalDepartments[0]?.count ?? 0,
      todayPresent,
      todayAbsent,
      todayLate,
      todayOnLeave,
      pendingLeaves: pendingLeaves[0]?.count ?? 0,
      recentAttendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/monthly", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const { month, departmentId } = req.query;
    if (!month) {
      res.status(400).json({ error: "Bad Request", message: "month parameter required" });
      return;
    }

    const settings = await getAllSettings();
    let emps = await db.select().from(employeesTable).where(eq(employeesTable.isActive, true));

    if (departmentId) {
      emps = emps.filter((e) => e.departmentId === parseInt(departmentId as string));
    }

    // Count working days in the month
    const [year, mon] = (month as string).split("-").map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, mon - 1, d).getDay();
      if (!settings.weeklyOffDays.includes(String(dayOfWeek))) workingDays++;
    }

    const stats = await Promise.all(
      emps.map(async (emp) => {
        const atts = await db.select().from(attendanceTable).where(
          and(eq(attendanceTable.employeeId, emp.id))
        );
        const monthAtts = atts.filter((a) => a.date.startsWith(month as string));

        const presentDays = monthAtts.filter((a) => ["on_time", "late", "early_leave"].includes(a.status)).length;
        const lateDays = monthAtts.filter((a) => a.status === "late").length;
        const earlyLeaveDays = monthAtts.filter((a) => a.status === "early_leave").length;
        const leaveDays = monthAtts.filter((a) => a.status === "on_leave").length;
        const absentDays = Math.max(0, workingDays - presentDays - leaveDays);
        const totalWorkHours = monthAtts.reduce((sum, a) => sum + (a.workHours ?? 0), 0);
        const overtimeHours = Math.max(0, totalWorkHours - workingDays * settings.standardWorkHours);

        let departmentName: string | null = null;
        if (emp.departmentId) {
          const depts = await db.select({ name: departmentsTable.name }).from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId));
          if (depts.length > 0) departmentName = depts[0].name;
        }

        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          departmentName,
          position: emp.position,
          totalWorkDays: workingDays,
          presentDays,
          absentDays,
          lateDays,
          earlyLeaveDays,
          leaveDays,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          overtimeHours: Math.round(overtimeHours * 10) / 10,
        };
      })
    );

    res.json({
      month,
      totalEmployees: emps.length,
      stats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

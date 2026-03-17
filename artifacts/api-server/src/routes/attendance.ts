import { Router } from "express";
import { db, attendanceTable, employeesTable, departmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getAllSettings } from "../lib/settings.js";

const router = Router();

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function formatAttendanceRecord(att: any) {
  const emps = await db.select({ fullName: employeesTable.fullName, employeeCode: employeesTable.employeeCode, departmentId: employeesTable.departmentId })
    .from(employeesTable).where(eq(employeesTable.id, att.employeeId));
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
}

router.get("/today", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const emps = await db.select().from(employeesTable).where(eq(employeesTable.userId, userId));
    if (emps.length === 0) {
      res.json(null);
      return;
    }
    const emp = emps[0];
    const today = getTodayDateString();
    const atts = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, emp.id), eq(attendanceTable.date, today)));
    if (atts.length === 0) {
      res.json(null);
      return;
    }
    res.json(await formatAttendanceRecord(atts[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { employeeId, date, month } = req.query;
    const userRole = (req as any).userRole;
    const userId = (req as any).userId;

    let allAtts = await db.select().from(attendanceTable);

    // Employees can only see their own records
    if (userRole === "employee") {
      const emps = await db.select({ id: employeesTable.id }).from(employeesTable).where(eq(employeesTable.userId, userId));
      if (emps.length > 0) {
        allAtts = allAtts.filter((a) => a.employeeId === emps[0].id);
      }
    } else if (employeeId) {
      allAtts = allAtts.filter((a) => a.employeeId === parseInt(employeeId as string));
    }

    if (date) {
      allAtts = allAtts.filter((a) => a.date === date);
    }
    if (month) {
      allAtts = allAtts.filter((a) => a.date.startsWith(month as string));
    }

    allAtts.sort((a, b) => b.date.localeCompare(a.date));

    const result = await Promise.all(allAtts.map(formatAttendanceRecord));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/checkin", requireAuth, async (req, res) => {
  try {
    const { fingerprintId, note } = req.body;
    const settings = await getAllSettings();
    const today = getTodayDateString();
    const nowTime = new Date().toTimeString().slice(0, 5);

    // Find employee by fingerprint ID
    const emps = await db.select().from(employeesTable).where(eq(employeesTable.fingerprintId, fingerprintId));
    if (emps.length === 0) {
      res.status(404).json({ error: "Not Found", message: "Fingerprint not registered" });
      return;
    }
    const emp = emps[0];

    // Check if already checked in today
    const existing = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, emp.id), eq(attendanceTable.date, today)));
    if (existing.length > 0 && existing[0].checkIn) {
      res.status(409).json({ error: "Conflict", message: "Already checked in today" });
      return;
    }

    // Calculate late minutes
    const workStartMinutes = timeToMinutes(settings.workStartTime);
    const checkInMinutes = timeToMinutes(nowTime);
    const lateMinutes = Math.max(0, checkInMinutes - workStartMinutes - settings.lateThresholdMinutes);
    const status = lateMinutes > 0 ? "late" : "on_time";

    let att;
    if (existing.length > 0) {
      const updated = await db.update(attendanceTable)
        .set({ checkIn: nowTime, status, lateMinutes, note: note ?? null })
        .where(eq(attendanceTable.id, existing[0].id))
        .returning();
      att = updated[0];
    } else {
      const inserted = await db.insert(attendanceTable).values({
        employeeId: emp.id,
        date: today,
        checkIn: nowTime,
        status,
        lateMinutes,
        earlyLeaveMinutes: 0,
        note: note ?? null,
      }).returning();
      att = inserted[0];
    }

    res.status(201).json(await formatAttendanceRecord(att));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/checkout", requireAuth, async (req, res) => {
  try {
    const { fingerprintId, note } = req.body;
    const settings = await getAllSettings();
    const today = getTodayDateString();
    const nowTime = new Date().toTimeString().slice(0, 5);

    // Find employee by fingerprint ID
    const emps = await db.select().from(employeesTable).where(eq(employeesTable.fingerprintId, fingerprintId));
    if (emps.length === 0) {
      res.status(404).json({ error: "Not Found", message: "Fingerprint not registered" });
      return;
    }
    const emp = emps[0];

    const existing = await db.select().from(attendanceTable)
      .where(and(eq(attendanceTable.employeeId, emp.id), eq(attendanceTable.date, today)));
    if (existing.length === 0 || !existing[0].checkIn) {
      res.status(400).json({ error: "Bad Request", message: "Must check in first" });
      return;
    }
    if (existing[0].checkOut) {
      res.status(409).json({ error: "Conflict", message: "Already checked out today" });
      return;
    }

    const att = existing[0];
    const workEndMinutes = timeToMinutes(settings.workEndTime);
    const checkOutMinutes = timeToMinutes(nowTime);
    const earlyLeaveMinutes = Math.max(0, workEndMinutes - checkOutMinutes - settings.earlyLeaveThresholdMinutes);

    const checkInMinutes = timeToMinutes(att.checkIn!);
    const workHours = (checkOutMinutes - checkInMinutes) / 60;

    let status = att.status;
    if (earlyLeaveMinutes > 0) {
      status = att.lateMinutes > 0 ? "late" : "early_leave";
    }

    const updated = await db.update(attendanceTable)
      .set({ checkOut: nowTime, earlyLeaveMinutes, workHours, status, note: note ?? att.note })
      .where(eq(attendanceTable.id, att.id))
      .returning();

    res.json(await formatAttendanceRecord(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

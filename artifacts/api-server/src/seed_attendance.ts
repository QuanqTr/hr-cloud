import { db, attendanceTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function seedAttendance() {
  console.log("Seeding attendance data for display (from API server)...");
  
  const emps = await db.select().from(employeesTable).where(eq(employeesTable.isActive, true));
  console.log(`Found ${emps.length} active employees.`);
  
  const today = new Date();
  for (let d_offset = 0; d_offset < 10; d_offset++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - d_offset);
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateStr = targetDate.toISOString().split("T")[0];
    for (const emp of emps) {
      const existing = await db.select().from(attendanceTable)
        .where(and(eq(attendanceTable.employeeId, emp.id), eq(attendanceTable.date, dateStr)));
      if (existing.length > 0) continue;
      
      const rand = Math.random();
      const lateMin = rand < 0.15 ? Math.floor(Math.random() * 45) + 16 : Math.floor(Math.random() * 10);
      const checkInTime = `08:${String(lateMin).padStart(2, "0")}`;
      const earlyMin = rand > 0.9 ? Math.floor(Math.random() * 60) + 16 : Math.floor(Math.random() * 30);
      const checkOutMinutes = 17 * 60 + 30 - earlyMin + Math.floor(Math.random() * 60);
      const checkOutTime = `${String(Math.floor(checkOutMinutes / 60)).padStart(2, "0")}:${String(checkOutMinutes % 60).padStart(2, "0")}`;
      
      let status = "on_time";
      if (lateMin > 15) status = "late";
      else if (earlyMin > 15) status = "early_leave";
      
      await db.insert(attendanceTable).values({
        employeeId: emp.id,
        date: dateStr,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        lateMinutes: Math.max(0, lateMin - 15),
        earlyLeaveMinutes: Math.max(0, earlyMin - 15),
        workHours: Math.round(((checkOutMinutes - (8 * 60 + lateMin)) / 60) * 10) / 10,
        note: status === "on_time" ? "Đúng giờ" : "Có việc cá nhân",
      });
    }
  }
  console.log("Seeding complete!");
}

seedAttendance().then(() => process.exit(0)).catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

import { db, attendanceTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function seedAttendance() {
  console.log("Seeding attendance data for display...");
  
  const emps = await db.select().from(employeesTable).where(eq(employeesTable.isActive, true));
  console.log(`Found ${emps.length} active employees.`);
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDate = today.getDate();
  
  // Seed for the last 10 days
  for (let d_offset = 0; d_offset < 10; d_offset++) {
    const targetDate = new Date(year, month, currentDate - d_offset);
    const dayOfWeek = targetDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const dateStr = targetDate.toISOString().split("T")[0];
    console.log(`Processing date: ${dateStr}`);
    
    for (const emp of emps) {
      // Check if attendance already exists for this day
      const existing = await db.select().from(attendanceTable)
        .where(and(eq(attendanceTable.employeeId, emp.id), eq(attendanceTable.date, dateStr)));
      
      if (existing.length > 0) {
        console.log(`  Skipping ${emp.fullName} - already has records for ${dateStr}`);
        continue;
      }
      
      const rand = Math.random();
      if (rand < 0.05) continue; // 5% chance of being absent (no record)
      
      // Determine late status (15% chance of being late)
      const isLate = rand < 0.15;
      const lateMin = isLate ? Math.floor(Math.random() * 45) + 16 : Math.floor(Math.random() * 10); // 0-10m or 16-60m
      
      const checkInHour = 8;
      const checkInMin = lateMin;
      const checkInTime = `${String(checkInHour).padStart(2, "0")}:${String(checkInMin).padStart(2, "0")}`;
      
      // Determine early leave (10% chance)
      const isEarly = rand > 0.9;
      const earlyMin = isEarly ? Math.floor(Math.random() * 60) + 16 : Math.floor(Math.random() * 30);
      
      // Target end time is 17:30 (17*60 + 30 = 1050 minutes)
      const targetEndMinutes = 17 * 60 + 30;
      const checkOutMinutes = targetEndMinutes - earlyMin + Math.floor(Math.random() * 60); // Randomly stay longer too
      
      const checkOutHour = Math.floor(checkOutMinutes / 60);
      const checkOutMin = checkOutMinutes % 60;
      const checkOutTime = `${String(checkOutHour).padStart(2, "0")}:${String(checkOutMin).padStart(2, "0")}`;
      
      // Calculate final status
      let status = "on_time";
      if (lateMin > 15) status = "late";
      else if (earlyMin > 15) status = "early_leave";
      
      const workHours = (checkOutMinutes - (checkInHour * 60 + checkInMin)) / 60;
      
      await db.insert(attendanceTable).values({
        employeeId: emp.id,
        date: dateStr,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        lateMinutes: Math.max(0, lateMin - 15),
        earlyLeaveMinutes: Math.max(0, earlyMin - 15),
        workHours: Math.round(workHours * 10) / 10,
        note: isLate ? "Đi muộn do kẹt xe" : isEarly ? "Về sớm có việc gia đình" : "Đúng giờ",
      });
      
      console.log(`  Added attendance for ${emp.fullName} on ${dateStr} - Status: ${status}`);
    }
  }
  
  console.log("Seeding complete!");
}

seedAttendance().then(() => process.exit(0)).catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

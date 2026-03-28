import { db, employeesTable, attendanceTable } from "@workspace/db";

async function investigate() {
  try {
    const emps = await db.select().from(employeesTable);
    console.log(`Employees in DB: ${emps.length}`);
    if (emps.length > 0) {
      console.log(`First employee ID: ${emps[0].id}, Name: ${emps[0].fullName}`);
    }
    
    const atts = await db.select().from(attendanceTable).limit(5);
    console.log(`Recent attendance records: ${atts.length}`);
  } catch (err) {
    console.error("Investigation failed:", err);
  }
}

investigate().then(() => process.exit(0));

import { db, usersTable, employeesTable, departmentsTable, attendanceTable, leavesTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "hr_salt_2024").digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  // Create departments
  const depts = await db.insert(departmentsTable).values([
    { name: "Ban Giám Đốc", description: "Ban lãnh đạo công ty" },
    { name: "Phòng Công Nghệ Thông Tin", description: "Phòng phát triển phần mềm và hạ tầng IT" },
    { name: "Phòng Nhân Sự", description: "Quản lý nhân sự và tuyển dụng" },
    { name: "Phòng Kế Toán", description: "Quản lý tài chính và kế toán" },
    { name: "Phòng Kinh Doanh", description: "Phát triển kinh doanh và bán hàng" },
  ]).returning();
  console.log("Departments created:", depts.length);

  // Create users and employees
  const userData = [
    { username: "admin", password: "admin123", role: "admin", employeeCode: "NV001", fullName: "Nguyễn Văn Admin", position: "Giám Đốc", deptIdx: 0, fp: "FP001" },
    { username: "manager1", password: "manager123", role: "manager", employeeCode: "NV002", fullName: "Trần Thị Lan", position: "Trưởng Phòng IT", deptIdx: 1, fp: "FP002" },
    { username: "manager2", password: "manager123", role: "manager", employeeCode: "NV003", fullName: "Lê Văn Nam", position: "Trưởng Phòng Nhân Sự", deptIdx: 2, fp: "FP003" },
    { username: "emp001", password: "emp123", role: "employee", employeeCode: "NV004", fullName: "Phạm Thị Hoa", position: "Lập Trình Viên", deptIdx: 1, fp: "FP004" },
    { username: "emp002", password: "emp123", role: "employee", employeeCode: "NV005", fullName: "Hoàng Văn Tú", position: "Lập Trình Viên Senior", deptIdx: 1, fp: "FP005" },
    { username: "emp003", password: "emp123", role: "employee", employeeCode: "NV006", fullName: "Ngô Thị Mai", position: "Chuyên Viên Nhân Sự", deptIdx: 2, fp: "FP006" },
    { username: "emp004", password: "emp123", role: "employee", employeeCode: "NV007", fullName: "Đỗ Văn Hùng", position: "Kế Toán Viên", deptIdx: 3, fp: "FP007" },
    { username: "emp005", password: "emp123", role: "employee", employeeCode: "NV008", fullName: "Vũ Thị Thu", position: "Chuyên Viên Kinh Doanh", deptIdx: 4, fp: "FP008" },
  ];

  const createdUsers = [];
  const createdEmps = [];

  for (const u of userData) {
    const user = await db.insert(usersTable).values({
      username: u.username,
      passwordHash: hashPassword(u.password),
      role: u.role,
    }).returning();
    createdUsers.push(user[0]);

    const emp = await db.insert(employeesTable).values({
      employeeCode: u.employeeCode,
      fullName: u.fullName,
      position: u.position,
      departmentId: depts[u.deptIdx].id,
      email: `${u.username}@company.vn`,
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      hireDate: "2022-01-01",
      userId: user[0].id,
      fingerprintId: u.fp,
      isActive: true,
    }).returning();
    createdEmps.push(emp[0]);
  }

  // Update department managers
  await db.update(departmentsTable).set({ managerId: createdEmps[0].id }).where(departmentsTable.id.equals ? undefined : undefined);
  await db.update(departmentsTable).set({ managerId: createdEmps[1].id }).where(departmentsTable.name.equals ? undefined : undefined);

  console.log("Users and employees created:", createdUsers.length);

  // Create sample attendance for this month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  for (const emp of createdEmps) {
    for (let day = 1; day <= today.getDate() - 1; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = d.toISOString().split("T")[0];
      const rand = Math.random();
      if (rand < 0.05) continue; // 5% absent

      const lateMin = rand < 0.15 ? Math.floor(Math.random() * 45) + 16 : 0;
      const checkInHour = 8;
      const checkInMin = lateMin + Math.floor(Math.random() * 10);
      const checkInTime = `${String(checkInHour).padStart(2, "0")}:${String(checkInMin).padStart(2, "0")}`;

      const earlyMin = rand < 0.1 ? Math.floor(Math.random() * 30) + 16 : 0;
      const checkOutMinTotal = 17 * 60 + 30 - earlyMin + Math.floor(Math.random() * 30);
      const checkOutTime = `${String(Math.floor(checkOutMinTotal / 60)).padStart(2, "0")}:${String(checkOutMinTotal % 60).padStart(2, "0")}`;

      const status = lateMin > 15 ? "late" : earlyMin > 15 ? "early_leave" : "on_time";
      const workHours = (checkOutMinTotal - (checkInHour * 60 + checkInMin)) / 60;

      await db.insert(attendanceTable).values({
        employeeId: emp.id,
        date: dateStr,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        lateMinutes: Math.max(0, lateMin - 15),
        earlyLeaveMinutes: Math.max(0, earlyMin - 15),
        workHours: Math.round(workHours * 10) / 10,
      });
    }
  }
  console.log("Attendance records created");

  // Create sample leave requests
  await db.insert(leavesTable).values([
    {
      employeeId: createdEmps[3].id,
      leaveType: "annual",
      startDate: `${year}-${String(month + 1).padStart(2, "0")}-20`,
      endDate: `${year}-${String(month + 1).padStart(2, "0")}-22`,
      totalDays: 3,
      reason: "Nghỉ phép gia đình",
      status: "pending",
    },
    {
      employeeId: createdEmps[4].id,
      leaveType: "sick",
      startDate: `${year}-${String(month + 1).padStart(2, "0")}-05`,
      endDate: `${year}-${String(month + 1).padStart(2, "0")}-05`,
      totalDays: 1,
      reason: "Ốm",
      status: "approved",
      approvedBy: createdUsers[1].id,
      approvedAt: new Date(),
    },
  ]);
  console.log("Leave requests created");

  console.log("\n=== SEED COMPLETE ===");
  console.log("Login accounts:");
  for (const u of userData) {
    console.log(`  ${u.role.padEnd(10)} | ${u.username.padEnd(12)} | ${u.password} | Fingerprint: ${u.fp}`);
  }
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

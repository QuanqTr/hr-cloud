import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_SETTINGS = {
  workStartTime: "08:00",
  workEndTime: "17:30",
  lateThresholdMinutes: "15",
  earlyLeaveThresholdMinutes: "15",
  standardWorkHours: "8",
  weeklyOffDays: JSON.stringify(["0", "6"]),
  annualLeaveEntitlement: "12",
};

export async function getSettingValue(key: string): Promise<string> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (rows.length > 0) return rows[0].value;
  return (DEFAULT_SETTINGS as any)[key] ?? "";
}

export async function getAllSettings() {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    workStartTime: map.workStartTime,
    workEndTime: map.workEndTime,
    lateThresholdMinutes: parseInt(map.lateThresholdMinutes),
    earlyLeaveThresholdMinutes: parseInt(map.earlyLeaveThresholdMinutes),
    standardWorkHours: parseFloat(map.standardWorkHours),
    weeklyOffDays: JSON.parse(map.weeklyOffDays),
    annualLeaveEntitlement: parseInt(map.annualLeaveEntitlement),
  };
}

export async function upsertSetting(key: string, value: string) {
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value });
  }
}

import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import { getAllSettings, upsertSetting } from "../lib/settings.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const settings = await getAllSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { workStartTime, workEndTime, lateThresholdMinutes, earlyLeaveThresholdMinutes, standardWorkHours, weeklyOffDays, annualLeaveEntitlement } = req.body;

    await Promise.all([
      upsertSetting("workStartTime", workStartTime),
      upsertSetting("workEndTime", workEndTime),
      upsertSetting("lateThresholdMinutes", String(lateThresholdMinutes)),
      upsertSetting("earlyLeaveThresholdMinutes", String(earlyLeaveThresholdMinutes)),
      upsertSetting("standardWorkHours", String(standardWorkHours)),
      upsertSetting("weeklyOffDays", JSON.stringify(weeklyOffDays)),
      upsertSetting("annualLeaveEntitlement", String(annualLeaveEntitlement)),
    ]);

    const settings = await getAllSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

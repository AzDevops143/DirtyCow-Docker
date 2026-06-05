import { Router } from "express";
import { authRouter } from "./routes/auth";
import { dataRouter } from "./routes/data";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

apiRouter.get("/logs/dirty-cow", (req, res) => {
    const exploitLogPath = path.join(process.cwd(), "dirty_cow_exploit.log");
    const mitigationLogPath = path.join(process.cwd(), "dirty_cow_mitigation.log");

    try {
        if (!fs.existsSync(exploitLogPath) || !fs.existsSync(mitigationLogPath)) {
            // Run the script to generate the logs live
            execSync("bash scripts/test_dirty_cow.sh", { cwd: process.cwd() });
        }
        const exploitLog = fs.readFileSync(exploitLogPath, "utf-8");
        const mitigationLog = fs.readFileSync(mitigationLogPath, "utf-8");
        res.json({ exploit: exploitLog, mitigation: mitigationLog });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/data", dataRouter);


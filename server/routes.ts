import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertMeasurementSchema } from "@shared/schema";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "112211";

// 관리자 인증 미들웨어: x-admin-password 헤더 확인
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const pw = req.headers["x-admin-password"];
  if (pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "관리자 인증이 필요합니다." });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 관리자 비밀번호 확인
  app.post("/api/auth/verify", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
    }
  });

  // 관리자 비밀번호 변경
  // (실제 운영시 더 안전하게 구현 필요)

  // 회원 목록 (관리자만)
  app.get("/api/members", requireAdmin, async (_req, res) => {
    const memberList = await storage.getAllMembers();
    res.json(memberList);
  });

  // 회원 등록 (관리자만)
  app.post("/api/members", requireAdmin, async (req, res) => {
    const result = insertMemberSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "입력값이 올바르지 않습니다.", errors: result.error.errors });
    }
    try {
      const member = await storage.createMember(result.data);
      res.json(member);
    } catch (e: any) {
      if (e.message?.includes("UNIQUE")) {
        return res.status(409).json({ message: "이미 등록된 회원번호입니다." });
      }
      res.status(500).json({ message: "회원 등록에 실패했습니다." });
    }
  });

  // 회원 삭제 (관리자만)
  app.delete("/api/members/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMember(id);
    res.json({ success: true });
  });

  // 특정 회원 측정 기록 (관리자만)
  app.get("/api/members/:id/measurements", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const measurementList = await storage.getMeasurementsByMember(id);
    res.json(measurementList);
  });

  // 측정 기록 추가 (관리자만)
  app.post("/api/measurements", requireAdmin, async (req, res) => {
    const result = insertMeasurementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "입력값이 올바르지 않습니다.", errors: result.error.errors });
    }

    // 90일 제한: 첫 측정일 기준 90일 이후 데이터 등록 차단
    const existing = await storage.getMeasurementsByMember(result.data.memberId);
    if (existing.length > 0) {
      const firstDate = new Date(existing[0].date);
      const inputDate = new Date(result.data.date);
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.floor((inputDate.getTime() - firstDate.getTime()) / msPerDay);
      if (diffDays >= 90) {
        return res.status(400).json({
          message: `쳈 측정일(${existing[0].date})으로부터 90일이 경과하여 데이터를 등록할 수 없습니다. (${diffDays + 1}일차)`,
        });
      }
    }

    const measurement = await storage.createMeasurement(result.data);
    res.json(measurement);
  });

  // 측정 기록 삭제 (관리자만)
  app.delete("/api/measurements/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMeasurement(id);
    res.json({ success: true });
  });

  // 특정 회원 측정 기록 — 그래프용 공개 API (회원번호 미포함)
  app.get("/api/chart/:id/measurements", async (req, res) => {
    const id = parseInt(req.params.id);
    const measurementList = await storage.getMeasurementsByMember(id);
    res.json(measurementList);
  });

  // 랭킹 데이터 (공개 — 회원번호 제외)
  app.get("/api/rankings", async (_req, res) => {
    const rankings = await storage.getRankings();
    const safeRankings = rankings.map(({ memberNumber, ...rest }) => rest);
    res.json(safeRankings);
  });

  // 전체 측정 기록 — 그래프용 (공개, 회원번호 미포함)
  app.get("/api/measurements", async (_req, res) => {
    const allMeasurements = await storage.getAllMeasurements();
    res.json(allMeasurements);
  });

  return httpServer;
}

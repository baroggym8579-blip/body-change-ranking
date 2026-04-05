import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertMeasurementSchema } from "@shared/schema";

const ADMIN_PASSWORD = "bodychange2026";

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

  // 회원 목록
  app.get("/api/members", async (_req, res) => {
    const memberList = await storage.getAllMembers();
    res.json(memberList);
  });

  // 회원 등록
  app.post("/api/members", async (req, res) => {
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

  // 회원 삭제
  app.delete("/api/members/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMember(id);
    res.json({ success: true });
  });

  // 특정 회원 측정 기록
  app.get("/api/members/:id/measurements", async (req, res) => {
    const id = parseInt(req.params.id);
    const measurementList = await storage.getMeasurementsByMember(id);
    res.json(measurementList);
  });

  // 측정 기록 추가
  app.post("/api/measurements", async (req, res) => {
    const result = insertMeasurementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "입력값이 올바르지 않습니다.", errors: result.error.errors });
    }
    const measurement = await storage.createMeasurement(result.data);
    res.json(measurement);
  });

  // 측정 기록 삭제
  app.delete("/api/measurements/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMeasurement(id);
    res.json({ success: true });
  });

  // 랭킹 데이터
  app.get("/api/rankings", async (_req, res) => {
    const rankings = await storage.getRankings();
    res.json(rankings);
  });

  // 전체 측정 기록 (그래프용)
  app.get("/api/measurements", async (_req, res) => {
    const allMeasurements = await storage.getAllMeasurements();
    res.json(allMeasurements);
  });

  return httpServer;
}

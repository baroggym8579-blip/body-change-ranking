import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 회원 테이블
export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  memberNumber: text("member_number").notNull().unique(),
});

// 측정 기록 테이블
export const measurements = sqliteTable("measurements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  weight: real("weight").notNull(),
  muscleMass: real("muscle_mass").notNull(),
  bodyFat: real("body_fat").notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export const insertMeasurementSchema = createInsertSchema(measurements).omit({ id: true });

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type Measurement = typeof measurements.$inferSelect;

// 랭킹 타입 (프론트엔드용)
export type RankingEntry = {
  rank: number;
  memberId: number;
  name: string;
  memberNumber: string;
  score: number;
  weight: number;
  muscleMass: number;
  bodyFat: number;
  muscleChange: number;
  fatChange: number;
  startDate: string;   // 첫 측정일 (YYYY-MM-DD)
  dayCount: number;    // 오늘 기준 N일차
};

export type MemberWithMeasurements = Member & {
  measurements: Measurement[];
};

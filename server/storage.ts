import {
  type Member,
  type InsertMember,
  type Measurement,
  type InsertMeasurement,
  type RankingEntry,
  members,
  measurements,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, asc } from "drizzle-orm";

// Turso 또는 로컬 SQLite 지원
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);

// 테이블 자동 생성
async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      member_number TEXT NOT NULL UNIQUE
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      muscle_mass REAL NOT NULL,
      body_fat REAL NOT NULL
    )
  `);
}

initDb().catch(console.error);

export interface IStorage {
  getAllMembers(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  getMeasurementsByMember(memberId: number): Promise<Measurement[]>;
  getAllMeasurements(): Promise<Measurement[]>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  deleteMeasurement(id: number): Promise<void>;
  getRankings(): Promise<RankingEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async getAllMembers(): Promise<Member[]> {
    return db.select().from(members).all();
  }

  async getMember(id: number): Promise<Member | undefined> {
    const results = await db.select().from(members).where(eq(members.id, id));
    return results[0];
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const results = await db.insert(members).values(insertMember).returning();
    return results[0];
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(measurements).where(eq(measurements.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

  async getMeasurementsByMember(memberId: number): Promise<Measurement[]> {
    return db
      .select()
      .from(measurements)
      .where(eq(measurements.memberId, memberId))
      .orderBy(asc(measurements.date))
      .all();
  }

  async getAllMeasurements(): Promise<Measurement[]> {
    return db.select().from(measurements).orderBy(asc(measurements.date)).all();
  }

  async createMeasurement(
    insertMeasurement: InsertMeasurement
  ): Promise<Measurement> {
    const results = await db
      .insert(measurements)
      .values(insertMeasurement)
      .returning();
    return results[0];
  }

  async deleteMeasurement(id: number): Promise<void> {
    await db.delete(measurements).where(eq(measurements.id, id));
  }

  async getRankings(): Promise<RankingEntry[]> {
    const allMembers = await this.getAllMembers();
    const allMeasurements = await this.getAllMeasurements();

    const rankings: RankingEntry[] = [];

    for (const member of allMembers) {
      const memberMeasurements = allMeasurements
        .filter((m) => m.memberId === member.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (memberMeasurements.length === 0) continue;

      const first = memberMeasurements[0];
      const latest = memberMeasurements[memberMeasurements.length - 1];

      const muscleChange = latest.muscleMass - first.muscleMass;
      const muscleScore = Math.round(muscleChange * 10) * 4; // 0.1kg당 4점

      const fatChange = first.bodyFat - latest.bodyFat;
      const fatScore = Math.round(fatChange * 10);

      const score = muscleScore + fatScore;

      // N일차 계산 (첫 측정일 = 1일차)
      const startDate = first.date;
      const today = new Date().toISOString().slice(0, 10);
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.floor(
        (new Date(today).getTime() - new Date(startDate).getTime()) / msPerDay
      );
      const dayCount = diffDays + 1; // 첫날 = 1일차

      rankings.push({
        rank: 0,
        memberId: member.id,
        name: member.name,
        memberNumber: member.memberNumber,
        score,
        weight: latest.weight,
        muscleMass: latest.muscleMass,
        bodyFat: latest.bodyFat,
        muscleChange: Math.round(muscleChange * 10) / 10,
        fatChange: Math.round(fatChange * 10) / 10,
        startDate,
        dayCount,
      });
    }

    rankings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.weight - b.weight;
    });

    rankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return rankings;
  }
}

export const storage = new DatabaseStorage();

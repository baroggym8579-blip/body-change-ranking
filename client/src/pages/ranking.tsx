import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RankingEntry, Measurement, Member } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Trophy, TrendingUp, TrendingDown, Activity, Users, Flame, ChevronDown, ChevronUp, Gift, Medal } from "lucide-react";
import { useState } from "react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-black font-bold text-lg shadow-lg">
        1
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-black font-bold text-lg shadow-lg">
        2
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 text-black font-bold text-lg shadow-lg">
        3
      </div>
    );
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] font-semibold text-base">
      {rank}
    </div>
  );
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.max(0, (score / maxScore) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
      <div
        className="h-full rounded-full animate-grow-bar"
        style={{
          width: `${pct}%`,
          background: score > 0
            ? "linear-gradient(90deg, hsl(0, 72%, 51%), hsl(30, 90%, 55%))"
            : "hsl(var(--muted-foreground))",
        }}
      />
    </div>
  );
}

function MemberChart({ memberId, name }: { memberId: number; name: string }) {
  const { data: measurementData } = useQuery<Measurement[]>({
    queryKey: ["/api/members", memberId, "measurements"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/members/${memberId}/measurements`);
      return res.json();
    },
  });

  if (!measurementData || measurementData.length < 2) {
    return (
      <div className="text-center text-sm text-[hsl(var(--muted-foreground))] py-4">
        그래프를 표시하려면 2회 이상 측정이 필요합니다.
      </div>
    );
  }

  const chartData = measurementData.map((m) => ({
    date: m.date.slice(5), // MM-DD
    근골격량: m.muscleMass,
    체지방량: m.bodyFat,
  }));

  // 점수 누적 계산
  const first = measurementData[0];
  const scoreData = measurementData.map((m) => {
    const muscleScore = Math.round((m.muscleMass - first.muscleMass) * 10);
    const fatScore = Math.round((first.bodyFat - m.bodyFat) * 10);
    return {
      date: m.date.slice(5),
      점수: muscleScore + fatScore,
    };
  });

  return (
    <div className="mt-3 space-y-4">
      <div className="rounded-lg bg-[hsl(var(--background))] p-3">
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 font-medium">근골격량 / 체지방량 추이</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
            <XAxis
              dataKey="date"
              stroke="hsl(0, 0%, 45%)"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="hsl(0, 0%, 45%)" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 12%)",
                border: "1px solid hsl(0, 0%, 20%)",
                borderRadius: "8px",
                color: "hsl(0, 0%, 90%)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="근골격량"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="체지방량"
              stroke="#facc15"
              strokeWidth={2}
              dot={{ r: 3, fill: "#facc15" }}
              activeDot={{ r: 5 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg bg-[hsl(var(--background))] p-3">
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 font-medium">점수 추이</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
            <XAxis
              dataKey="date"
              stroke="hsl(0, 0%, 45%)"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="hsl(0, 0%, 45%)" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 12%)",
                border: "1px solid hsl(0, 0%, 20%)",
                borderRadius: "8px",
                color: "hsl(0, 0%, 90%)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="점수"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: rankings, isLoading } = useQuery<RankingEntry[]>({
    queryKey: ["/api/rankings"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-3">
          <Flame className="w-8 h-8 text-[hsl(var(--primary))] animate-pulse" />
          <span className="text-sm text-[hsl(var(--muted-foreground))]">로딩 중...</span>
        </div>
      </div>
    );
  }

  const maxScore = rankings && rankings.length > 0 ? Math.max(...rankings.map((r) => r.score), 1) : 1;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6 relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-7 h-7 text-[hsl(var(--primary))]" />
            <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              2026 BAROG RANKING
            </h1>
            <Flame className="w-7 h-7 text-[hsl(var(--primary))]" />
          </div>
          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            D-90 (써머) 바디체인지 랭킹전
          </p>

          {/* Summary Stats */}
          {rankings && rankings.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="text-center p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                <Users className="w-4 h-4 mx-auto mb-1 text-[hsl(var(--muted-foreground))]" />
                <div className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">{rankings.length}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">참가자</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                <TrendingUp className="w-4 h-4 mx-auto mb-1 text-[hsl(var(--primary))]" />
                <div className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">{rankings[0]?.score || 0}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">최고점수</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                <Activity className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                <div className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">
                  {Math.round(rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length)}
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">평균점수</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ranking List */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        {!rankings || rankings.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-40" />
            <p className="text-[hsl(var(--muted-foreground))]">아직 등록된 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((entry, idx) => {
              const isExpanded = expandedId === entry.memberId;
              return (
                <div
                  key={entry.memberId}
                  className={`rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden transition-all duration-300 ${
                    entry.rank <= 3 ? `rank-glow-${entry.rank}` : ""
                  }`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <button
                    className="w-full p-4 flex items-center gap-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : entry.memberId)}
                    data-testid={`ranking-row-${entry.memberId}`}
                  >
                    <RankBadge rank={entry.rank} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[hsl(var(--foreground))] truncate">
                          {entry.name}
                        </span>
                        <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-900/40">
                          {entry.dayCount}일차
                        </span>
                      </div>
                      <ScoreBar score={entry.score} maxScore={maxScore} />
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-[hsl(var(--primary))]" />
                          근골격 {entry.muscleChange > 0 ? "+" : ""}{entry.muscleChange}kg
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-yellow-500" />
                          체지방 {entry.fatChange > 0 ? "-" : "+"}{Math.abs(entry.fatChange)}kg
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-[hsl(var(--primary))] tabular-nums">
                        {entry.score}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">점</div>
                    </div>
                    <div className="shrink-0 text-[hsl(var(--muted-foreground))]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                      <MemberChart memberId={entry.memberId} name={entry.name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom info blocks */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* 채점 기준 */}
          <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">채점 기준</h3>
            <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <li>• 근골격량 0.1kg 증가 = 4점</li>
              <li>• 체지방량 0.1kg 감소 = 1점</li>
              <li>• 동일 점수 시 체중이 낮은 사람이 상위</li>
            </ul>
          </div>

          {/* 시상 안내 */}
          <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              시상 안내
            </h3>
            <ul className="space-y-2">
              {/* 1~3등 */}
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-black text-xs font-bold shrink-0">1</span>
                <span className="text-xs text-[hsl(var(--foreground))] font-medium">상금 100만원</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-black text-xs font-bold shrink-0">2</span>
                <span className="text-xs text-[hsl(var(--foreground))] font-medium">상금 50만원</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 text-black text-xs font-bold shrink-0">3</span>
                <span className="text-xs text-[hsl(var(--foreground))] font-medium">회원권 3개월</span>
              </li>
              {/* 구분선 */}
              <li className="border-t border-[hsl(var(--border))] pt-2 mt-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5 flex items-center gap-1">
                  <Medal className="w-3 h-3" /> 참가상
                </p>
                <ul className="space-y-1 pl-1">
                  <li className="text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="text-[hsl(var(--foreground))]">짝수 등수</span> — 일일무료입장권 3매 <span className="text-red-400">(양도 가능)</span>
                  </li>
                  <li className="text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="text-[hsl(var(--foreground))]">홀수 등수</span> — 추후 공지
                  </li>
                </ul>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

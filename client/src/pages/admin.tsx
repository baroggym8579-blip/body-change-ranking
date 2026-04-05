import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member, Measurement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  ClipboardPlus,
  Trash2,
  Lock,
  Users,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", "/api/auth/verify", { password });
      const data = await res.json();
      if (data.success) {
        onLogin();
      }
    } catch {
      setError("비밀번호가 틀렸습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="w-10 h-10 mx-auto mb-2 text-[hsl(var(--primary))]" />
          <CardTitle className="text-lg">관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
              autoFocus
            />
            {error && <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
              {loading ? "확인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberForm() {
  const [name, setName] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const { toast } = useToast();

  const createMember = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/members", {
        name,
        memberNumber,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setName("");
      setMemberNumber("");
      toast({ title: "회원이 등록되었습니다." });
    },
    onError: (err: Error) => {
      toast({
        title: "등록 실패",
        description: err.message.includes("409")
          ? "이미 등록된 회원번호입니다."
          : "회원 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !memberNumber.trim()) {
      toast({ title: "이름과 회원번호를 모두 입력해주세요.", variant: "destructive" });
      return;
    }
    createMember.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="w-4 h-4" />
          회원 등록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
          <Input
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[120px]"
            data-testid="input-member-name"
          />
          <Input
            placeholder="회원번호"
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
            className="flex-1 min-w-[120px]"
            data-testid="input-member-number"
          />
          <Button type="submit" disabled={createMember.isPending} data-testid="button-add-member">
            {createMember.isPending ? "등록 중..." : "등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MeasurementForm() {
  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const { toast } = useToast();

  const { data: memberList } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const createMeasurement = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/measurements", {
        memberId: parseInt(memberId),
        date,
        weight: parseFloat(weight),
        muscleMass: parseFloat(muscleMass),
        bodyFat: parseFloat(bodyFat),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members", parseInt(memberId), "measurements"] });
      setWeight("");
      setMuscleMass("");
      setBodyFat("");
      toast({ title: "측정 데이터가 등록되었습니다." });
    },
    onError: (err: any) => {
      let description = "측정 데이터 등록에 실패했습니다.";
      try {
        // apiRequest는 "400: {json}" 형식으로 throw함
        const jsonPart = err.message?.replace(/^\d+:\s*/, "");
        const data = JSON.parse(jsonPart);
        if (data?.message) description = data.message;
      } catch {
        if (err?.message) description = err.message;
      }
      toast({ title: "등록 실패", description, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !date || !weight || !muscleMass || !bodyFat) {
      toast({ title: "모든 항목을 입력해주세요.", variant: "destructive" });
      return;
    }
    createMeasurement.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardPlus className="w-4 h-4" />
          측정 데이터 입력
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="col-span-2 h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 text-sm text-[hsl(var(--foreground))]"
              data-testid="select-member"
            >
              <option value="">회원 선택</option>
              {memberList?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberNumber})
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="input-date"
            />
            <Input
              type="number"
              step="0.1"
              placeholder="체중 (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              data-testid="input-weight"
            />
            <Input
              type="number"
              step="0.1"
              placeholder="근골격량 (kg)"
              value={muscleMass}
              onChange={(e) => setMuscleMass(e.target.value)}
              data-testid="input-muscle-mass"
            />
            <Input
              type="number"
              step="0.1"
              placeholder="체지방량 (kg)"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              data-testid="input-body-fat"
            />
          </div>
          <Button type="submit" className="w-full" disabled={createMeasurement.isPending} data-testid="button-add-measurement">
            {createMeasurement.isPending ? "등록 중..." : "측정 데이터 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MemberList() {
  const { data: memberList, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });
  const { toast } = useToast();

  const deleteMember = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      toast({ title: "회원이 삭제되었습니다." });
    },
  });

  if (isLoading) return <div className="text-sm text-[hsl(var(--muted-foreground))]">로딩 중...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          등록된 회원 ({memberList?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!memberList || memberList.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
            등록된 회원이 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>회원번호</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberList.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.memberNumber}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`${m.name} 회원을 삭제하시겠습니까? 모든 측정 데이터도 함께 삭제됩니다.`)) {
                          deleteMember.mutate(m.id);
                        }
                      }}
                      data-testid={`button-delete-member-${m.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-[hsl(var(--destructive))]" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MeasurementHistory() {
  const { data: memberList } = useQuery<Member[]>({ queryKey: ["/api/members"] });
  const { data: allMeasurements, isLoading } = useQuery<Measurement[]>({
    queryKey: ["/api/measurements"],
  });
  const { toast } = useToast();

  const deleteMeasurement = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      toast({ title: "측정 기록이 삭제되었습니다." });
    },
  });

  const getMemberName = (memberId: number) => {
    return memberList?.find((m) => m.id === memberId)?.name || "알 수 없음";
  };

  if (isLoading) return null;

  // 최근 기록부터 보여주기
  const sorted = allMeasurements ? [...allMeasurements].reverse() : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4" />
          측정 기록 ({sorted.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
            측정 기록이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>체중</TableHead>
                  <TableHead>근골격량</TableHead>
                  <TableHead>체지방량</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{getMemberName(m.memberId)}</TableCell>
                    <TableCell className="tabular-nums">{m.date}</TableCell>
                    <TableCell className="tabular-nums">{m.weight}</TableCell>
                    <TableCell className="tabular-nums">{m.muscleMass}</TableCell>
                    <TableCell className="tabular-nums">{m.bodyFat}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("이 측정 기록을 삭제하시겠습니까?")) {
                            deleteMeasurement.mutate(m.id);
                          }
                        }}
                        data-testid={`button-delete-measurement-${m.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-[hsl(var(--destructive))]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">관리자 페이지</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">바디체인지 랭킹전</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-view-ranking">
              <ArrowLeft className="w-4 h-4 mr-1" />
              랭킹 보기
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <MemberForm />
          <MeasurementForm />
          <MemberList />
          <MeasurementHistory />
        </div>
      </div>
    </div>
  );
}

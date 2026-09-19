import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentConductScore, type ConductScore } from "@/services/conductService";
import { Loader2, AlertCircle, Award, Trophy, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function ConductScorePage() {
	const [conductScores, setConductScores] = useState<ConductScore[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchConductScores = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getStudentConductScore();
			setConductScores(data);
		} catch (err) {
			console.error("Error:", err);
			setError("Không thể tải điểm rèn luyện. Vui lòng thử lại sau.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchConductScores();
	}, [fetchConductScores]);

	const getRankConfig = (rank: string | null | undefined) => {
		switch (rank?.toLowerCase()) {
			case "xuất sắc":
				return {
					color: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
					bgColor: "bg-yellow-500/10 border-yellow-500/30",
					icon: Trophy,
					textColor: "text-yellow-600 dark:text-yellow-400",
				};
			case "tốt":
				return {
					color: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
					bgColor: "bg-green-500/10 border-green-500/30",
					icon: Star,
					textColor: "text-green-600 dark:text-green-400",
				};
			case "khá":
				return {
					color: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
					bgColor: "bg-blue-500/10 border-blue-500/30",
					icon: TrendingUp,
					textColor: "text-blue-600 dark:text-blue-400",
				};
			case "trung bình":
				return {
					color: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
					bgColor: "bg-orange-500/10 border-orange-500/30",
					icon: Award,
					textColor: "text-orange-600 dark:text-orange-400",
				};
			case "yếu":
				return {
					color: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
					bgColor: "bg-red-500/10 border-red-500/30",
					icon: AlertCircle,
					textColor: "text-red-600 dark:text-red-400",
				};
			case "kém":
				return {
					color: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
					bgColor: "bg-red-500/10 border-red-500/30",
					icon: AlertCircle,
					textColor: "text-red-600 dark:text-red-400",
				};
			default:
				return {
					color: "bg-gradient-to-r from-gray-500 to-slate-500 text-white",
					bgColor: "bg-gray-500/10 border-gray-500/30",
					icon: Award,
					textColor: "text-gray-600 dark:text-gray-400",
				};
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center space-y-4">
					<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
					<p className="text-muted-foreground">Đang tải điểm rèn luyện...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Card className="max-w-md w-full border-destructive/50">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<AlertCircle className="w-12 h-12 text-destructive mx-auto" />
							<p className="text-destructive">{error}</p>
							<Button
								onClick={() => fetchConductScores()}
								variant="outline"
							>
								Thử lại
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Calculate summary stats
	const latestScore = conductScores[conductScores.length - 1];
	const averageScore =
		conductScores.length > 0
			? Math.round(
					conductScores.reduce((sum, s) => sum + (s.TongDiem || 0), 0) / conductScores.length,
				)
			: 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">Điểm rèn luyện</h1>
				<p className="text-sm text-muted-foreground">Theo dõi kết quả rèn luyện qua các học kỳ</p>
			</div>

			{/* Summary Cards */}
			{conductScores.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Latest Score */}
					<Card className="border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-primary-foreground/70 text-sm">Điểm gần nhất</p>
									<p className="text-4xl font-bold mt-1">{latestScore?.TongDiem || "—"}</p>
									<p className="text-primary-foreground/80 text-sm mt-1">
										{latestScore?.YearStudy} - HK{latestScore?.TermID}
									</p>
								</div>
								<div className="p-4 bg-white/20 rounded-full">
									<Award className="w-8 h-8" />
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Latest Rank */}
					<Card className={cn("border shadow-lg", getRankConfig(latestScore?.XepLoai).bgColor)}>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">Xếp loại gần nhất</p>
									<p
										className={cn(
											"text-2xl font-bold mt-1",
											getRankConfig(latestScore?.XepLoai).textColor,
										)}
									>
										{latestScore?.XepLoai || "—"}
									</p>
									<p className="text-muted-foreground text-sm mt-1">
										{latestScore?.ClassStudentName}
									</p>
								</div>
								<div className={cn("p-4 rounded-full", getRankConfig(latestScore?.XepLoai).color)}>
									{(() => {
										const Icon = getRankConfig(latestScore?.XepLoai).icon;
										return <Icon className="w-8 h-8" />;
									})()}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Average Score */}
					<Card className="border shadow-lg">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">Điểm trung bình</p>
									<p className="text-4xl font-bold mt-1 text-foreground">{averageScore}</p>
									<p className="text-muted-foreground text-sm mt-1">
										{conductScores.length} học kỳ
									</p>
								</div>
								<div className="p-4 bg-muted rounded-full">
									<TrendingUp className="w-8 h-8 text-muted-foreground" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Score History */}
			<div>
				<h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
					<Award className="h-5 w-5 text-primary" />
					Lịch sử điểm rèn luyện
				</h2>
				{conductScores.length === 0 ? (
					<div className="text-center py-12">
						<Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
						<p className="text-muted-foreground">Chưa có dữ liệu điểm rèn luyện</p>
					</div>
				) : (
					<>
						{/* Desktop Table */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-border">
										<th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
											Năm học
										</th>
										<th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
											Học kỳ
										</th>
										<th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
											Lớp
										</th>
										<th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
											Điểm rèn luyện
										</th>
										<th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
											Xếp loại
										</th>
									</tr>
								</thead>
								<tbody>
									{conductScores.map((score, index) => {
										const rankConfig = getRankConfig(score.XepLoai);
										return (
											<tr
												key={`${score.YearStudy}-${score.TermID}`}
												className={cn(
													"border-b border-border/50 transition-colors hover:bg-muted/50",
													index === conductScores.length - 1 && "bg-primary/5",
												)}
											>
												<td className="py-4 px-4 text-sm font-medium text-foreground">
													{score.YearStudy}
												</td>
												<td className="py-4 px-4 text-sm text-foreground">Học kỳ {score.TermID}</td>
												<td className="py-4 px-4 text-sm text-muted-foreground">
													{score.ClassStudentName}
												</td>
												<td className="py-4 px-4 text-center">
													<span className="text-lg font-bold text-foreground">
														{score.TongDiem || "—"}
													</span>
												</td>
												<td className="py-4 px-4 text-center">
													{score.XepLoai ? (
														<span
															className={cn(
																"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
																rankConfig.color,
															)}
														>
															{(() => {
																const Icon = rankConfig.icon;
																return <Icon className="w-4 h-4" />;
															})()}
															{score.XepLoai}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{/* Mobile Cards */}
						<div className="md:hidden space-y-3">
							{conductScores.map((score, index) => {
								const rankConfig = getRankConfig(score.XepLoai);
								const Icon = rankConfig.icon;
								return (
									<div
										key={`${score.YearStudy}-${score.TermID}`}
										className={cn(
											"p-4 rounded-xl border transition-all",
											index === conductScores.length - 1
												? "border-primary/30 bg-primary/5"
												: "border-border bg-card",
										)}
									>
										<div className="flex items-start justify-between mb-3">
											<div>
												<p className="font-semibold text-foreground">{score.YearStudy}</p>
												<p className="text-sm text-muted-foreground">Học kỳ {score.TermID}</p>
											</div>
											<div className="text-right">
												<p className="text-2xl font-bold text-foreground">
													{score.TongDiem || "—"}
												</p>
												<p className="text-xs text-muted-foreground">điểm</p>
											</div>
										</div>
										<div className="flex items-center justify-between pt-3 border-t border-border/50">
											<span className="text-sm text-muted-foreground">
												{score.ClassStudentName}
											</span>
											{score.XepLoai ? (
												<span
													className={cn(
														"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
														rankConfig.color,
													)}
												>
													<Icon className="w-4 h-4" />
													{score.XepLoai}
												</span>
											) : (
												<span className="text-muted-foreground text-sm">—</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export default ConductScorePage;

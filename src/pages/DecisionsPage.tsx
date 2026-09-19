import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	getStudentDecisions,
	type DecisionItem,
} from "@/services/decisionService";
import {
	Loader2,
	AlertCircle,
	FileText,
	Calendar,
	User,
	Hash,
	ScrollText,
} from "lucide-react";

function DecisionsPage() {
	const [decisions, setDecisions] = useState<DecisionItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchDecisions = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await getStudentDecisions();
			setDecisions(data || []);
		} catch (err) {
			console.error("Error:", err);
			setError("Không thể tải quyết định sinh viên");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDecisions();
	}, [fetchDecisions]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<div className='text-center space-y-4'>
					<Loader2 className='w-12 h-12 animate-spin text-primary mx-auto' />
					<p className='text-muted-foreground'>
						Đang tải quyết định...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-[60vh]'>
				<Card className='max-w-md w-full'>
					<CardContent className='pt-6'>
						<div className='text-center space-y-4'>
							<AlertCircle className='w-12 h-12 text-destructive mx-auto' />
							<p className='text-destructive'>{error}</p>
							<Button
								onClick={() => fetchDecisions()}
								variant='outline'
							>
								Thử lại
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Page Header */}
			<div>
				<h1 className='text-2xl md:text-3xl font-bold text-foreground'>
					Quyết định sinh viên
				</h1>
				<p className='text-sm text-muted-foreground'>
					Danh sách các quyết định liên quan đến sinh viên
				</p>
			</div>

			{/* Decisions List */}
			<div>
				<h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
					<ScrollText className="h-5 w-5 text-primary" />
					Danh sách quyết định ({decisions.length})
				</h2>
				{decisions.length > 0 ?
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
						{decisions.map((decision, index) => (
							<div
								key={index}
								className='border rounded-lg p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors hover:shadow-md'
							>
<div className='flex items-center justify-between flex-wrap gap-2'>
								<div className='flex items-center gap-2'>
									<Badge variant='outline'>
										{decision.YearStudy}
									</Badge>
									<Badge variant='outline'>
										HK{decision.TermID}
									</Badge>
									<Badge variant='outline'>
										{decision.StudentID}
									</Badge>
								</div>
								<Badge variant='secondary'>
									{decision.DecisionName}
								</Badge>
							</div>

							<div className='space-y-3'>
								<div className='flex items-center gap-2'>
									<Hash className='w-4 h-4 text-primary flex-shrink-0' />
									<span className='font-mono font-medium'>
										{decision.DecisionNumber}
									</span>
								</div>

								<div className='rounded-md bg-muted/50 p-3'>
									<div className='flex items-center gap-2 mb-2'>
										<FileText className='w-4 h-4 text-primary flex-shrink-0' />
										<span className='text-sm font-semibold'>
											Nội dung quyết định
										</span>
									</div>
									<p className='text-sm text-foreground whitespace-pre-wrap'>
										{decision.InfringeContentName || "—"}
									</p>
								</div>
							</div>

								<div className='flex items-center justify-between pt-3 border-t text-sm'>
									<div className='flex items-center gap-1.5 text-muted-foreground'>
										<User className='w-4 h-4' />
										<span>
											{decision.SignStaff || "—"}
										</span>
									</div>
									<div className='flex items-center gap-1.5 text-muted-foreground'>
										<Calendar className='w-4 h-4' />
										<span>
											{decision.SignDate || "—"}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
					: <div className='text-center py-8 text-muted-foreground'>
						<ScrollText className='w-12 h-12 mx-auto mb-4 opacity-50' />
						<p>Không có quyết định nào</p>
					</div>
				}
			</div>
		</div>
	);
}

export default DecisionsPage;

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getYearAndTerm } from '@/services/scheduleService';
import {
	getComments,
	getDiscussions,
	insertComment,
	type CourseForComment,
	type Discussion
} from '@/services/discussionService';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { useYearAndTerm } from '@/hooks/useYearAndTerm';
import { getCourseTypeInfo } from '@/lib/courseType';
import { Loader2, MessageSquare, ChevronDown, ChevronUp, Send, BookOpen, Calendar } from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { PageLoader } from '@/components/common/PageLoader';
import { PageError } from '@/components/common/PageError';
import { InlineLoader } from '@/components/common/InlineLoader';
import { EmptyState } from '@/components/common/EmptyState';
import YearTermFilter from '@/components/common/YearTermFilter';

function DiscussionPage() {
	const [courses, setCourses] = useState<CourseForComment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const {
		yearTermData: yearAndTerm,
		selectedYear,
		setSelectedYear,
		selectedTerm,
		setSelectedTerm,
		termsForSelectedYear,
		error,
		retry
	} = useYearAndTerm(getYearAndTerm);
	const { showSuccess, showError } = useGlobalNotification();

	useEffect(() => {
		const fetchCourses = async () => {
			if (!selectedYear || !selectedTerm) return;

			setIsLoading(true);
			try {
				const coursesData = await getComments(selectedYear, selectedTerm);

				const groupedCourses = coursesData.reduce(
					(acc, course) => {
						const key = course.StudyUnitAlias;
						if (!acc[key]) {
							acc[key] = [];
						}
						acc[key].push(course);
						return acc;
					},
					{} as Record<string, CourseForComment[]>
				);

				const mergedCourses = Object.values(groupedCourses).map((courseGroup) => {
					if (courseGroup.length > 1) {
						return {
							...courseGroup[0],
							CreditInfos: courseGroup.map((c) => c.CreditInfos).join(' & '),
							ListOfWeekSchedules: courseGroup.map((c) => c.ListOfWeekSchedules).join('<br/>'),
							StudyUnitTypeID: 3
						};
					}
					return courseGroup[0];
				});

				setCourses(mergedCourses);
			} catch (err) {
				console.error('Error:', err);
				showError('Không thể tải danh sách môn học');
			} finally {
				setIsLoading(false);
			}
		};

		fetchCourses();
	}, [selectedYear, selectedTerm, showError]);

	if (error && !yearAndTerm) {
		return <PageError message={error} onRetry={retry} />;
	}

	if (!yearAndTerm) {
		return <PageLoader />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">Thảo luận & Ý kiến</h1>
				<p className="text-sm text-muted-foreground">Xem và gửi ý kiến thảo luận cho các môn học</p>
			</div>

			{/* Filters */}
			<YearTermFilter
				selectedYear={selectedYear}
				onYearChange={setSelectedYear}
				selectedTerm={selectedTerm}
				onTermChange={setSelectedTerm}
				years={yearAndTerm.YearStudy}
				terms={termsForSelectedYear}
				showLabels
				yearTriggerClassName="w-[180px]"
				termTriggerClassName="w-[180px]"
			/>

			{/* Courses List */}
			<div className="space-y-4">
				{isLoading ? (
					<InlineLoader />
				) : courses.length === 0 ? (
					<Card className="border-0 shadow-lg">
						<CardContent className="p-0">
							<EmptyState icon={MessageSquare} title="Không có môn học nào trong học kỳ này" />
						</CardContent>
					</Card>
				) : (
					courses.map((course) => (
						<CourseDiscussionItem
							key={course.ScheduleStudyUnitID}
							course={course}
							onSuccess={(msg) => showSuccess(msg)}
							onError={(msg) => showError(msg)}
						/>
					))
				)}
			</div>
		</div>
	);
}

// Course Discussion Item Component
function CourseDiscussionItem({
	course,
	onSuccess,
	onError
}: {
	course: CourseForComment;
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [discussions, setDiscussions] = useState<Discussion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [commentContent, setCommentContent] = useState('');

	const formatSchedule = (schedule: string) => {
		return schedule.split('<br/>').join('\n');
	};

	const handleExpand = async () => {
		if (!isExpanded && discussions.length === 0) {
			setIsLoading(true);
			try {
				const data = await getDiscussions(course.StudyUnitAlias);
				setDiscussions(data);
			} catch (err) {
				console.error('Error:', err);
				onError('Không thể tải thảo luận');
			} finally {
				setIsLoading(false);
			}
		}
		setIsExpanded(!isExpanded);
	};

	const handleSubmitComment = async () => {
		if (!commentContent.trim()) {
			onError('Vui lòng nhập nội dung bình luận');
			return;
		}

		setIsSubmitting(true);
		try {
			await insertComment(course.StudyUnitAlias, commentContent);
			const newDiscussions = await getDiscussions(course.StudyUnitAlias);
			setDiscussions(newDiscussions);
			setCommentContent('');
			onSuccess('Gửi bình luận thành công!');
		} catch (err) {
			console.error('Error:', err);
			onError('Không thể gửi bình luận');
		} finally {
			setIsSubmitting(false);
		}
	};

	const typeInfo = getCourseTypeInfo(course.StudyUnitTypeID);

	return (
		<Card className="border-0 shadow-lg overflow-hidden">
			{/* Course Header - Clickable */}
			<div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleExpand}>
				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
					<div className="flex-1">
						<div className="flex items-start gap-3 mb-2">
							<div className="p-2 rounded-lg bg-primary/10 shrink-0">
								<BookOpen className="w-5 h-5 text-primary" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-foreground">{course.CurriculumName}</h3>
								<p className="text-sm text-muted-foreground">GV: {course.ProfessorName}</p>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2 ml-11">
							<Badge variant="outline" className="text-xs">
								{course.Credits} tín chỉ
							</Badge>
							<Badge className={cn('text-xs', typeInfo.className)}>{typeInfo.label}</Badge>
							<span className="text-xs text-muted-foreground">{course.CreditInfos}</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="gap-1">
							<MessageSquare className="w-3 h-3" />
							{discussions.length > 0 ? discussions.length : ''}
						</Badge>
						{isExpanded ? (
							<ChevronUp className="w-5 h-5 text-muted-foreground" />
						) : (
							<ChevronDown className="w-5 h-5 text-muted-foreground" />
						)}
					</div>
				</div>
				{course.ListOfWeekSchedules && (
					<div className="mt-3 ml-11 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground whitespace-pre-line">
						<Calendar className="w-3 h-3 inline-block mr-1" />
						{formatSchedule(course.ListOfWeekSchedules)}
					</div>
				)}
			</div>

			{/* Expanded Section */}
			{isExpanded && (
				<div className="border-t border-border">
					{/* Comment Input */}
					<div className="p-4 bg-muted/30">
						<Textarea
							placeholder="Viết ý kiến của bạn..."
							value={commentContent}
							onChange={(e) => setCommentContent(e.target.value)}
							className="min-h-[80px] mb-3"
						/>
						<Button
							onClick={handleSubmitComment}
							disabled={isSubmitting || !commentContent.trim()}
							className="gap-2"
						>
							{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
							Gửi ý kiến
						</Button>
					</div>

					{/* Discussions List */}
					<div className="divide-y divide-border">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="w-6 h-6 animate-spin text-primary" />
							</div>
						) : discussions.length === 0 ? (
							<div className="py-8 text-center">
								<MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Chưa có ý kiến thảo luận nào</p>
							</div>
						) : (
							discussions
								.sort(
									(a, b) =>
										new Date(b.DiscussionDate).getTime() - new Date(a.DiscussionDate).getTime()
								)
								.map((discussion) => (
									<div key={discussion.DiscussionID} className="p-4">
										<div className="flex items-start gap-3">
											<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
												{getInitials(discussion.SenderName)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium text-foreground">
														{discussion.SenderName}
													</span>
													{discussion.SenderID && (
														<span className="text-xs text-muted-foreground">
															({discussion.SenderID})
														</span>
													)}
												</div>
												<p className="text-xs text-muted-foreground mb-2">
													{formatDate(discussion.DiscussionDate, {
														includeTime: true
													})}
												</p>
												<div
													className="text-sm text-foreground prose prose-sm max-w-none"
													dangerouslySetInnerHTML={{
														__html: discussion.DiscussionContent
													}}
												/>
											</div>
										</div>
									</div>
								))
						)}
					</div>
				</div>
			)}
		</Card>
	);
}

export default DiscussionPage;

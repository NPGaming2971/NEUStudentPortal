import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStudentCertificates, type Certificate } from '@/services/certificateService';
import CertificateSubmitForm from '@/components/common/CertificateSubmitForm';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import {
	Loader2,
	Award,
	FileCheck,
	FileX,
	Calendar,
	MapPin,
	Hash,
	FileText,
	ChevronDown,
	ChevronUp,
	Plus
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

function CertificatesPage() {
	const [certificates, setCertificates] = useState<Certificate[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
	const [isSubmitMode, setIsSubmitMode] = useState(false);
	const { showError } = useGlobalNotification();

	// Fetch certificates
	const fetchCertificates = async () => {
		setIsLoading(true);
		try {
			const data = await getStudentCertificates();
			setCertificates(data?.resultChungChi || []);
		} catch (err) {
			console.error('Error:', err);
			showError('Không thể tải dữ liệu chứng chỉ');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCertificates();
	}, [showError]);

	// Handle back from submit form
	const handleBackFromSubmit = () => {
		setIsSubmitMode(false);
		fetchCertificates();
	};

	// Toggle card expansion
	const toggleExpand = (index: number) => {
		const newExpanded = new Set(expandedCards);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedCards(newExpanded);
	};

	// Check if certificate has details
	const hasDetails = (cert: Certificate) => {
		return cert.CertificateNumber1 || cert.DateOfIssue1 || cert.PlaceOfIssue1 || cert.RecordNumber1;
	};

	// Count statistics
	const submittedCount = certificates.filter((c) => c.Nop).length;
	const pendingCount = certificates.filter((c) => !c.Nop).length;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center space-y-4">
					<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
					<p className="text-muted-foreground">Đang tải dữ liệu...</p>
				</div>
			</div>
		);
	}

	// Show submit form
	if (isSubmitMode) {
		return <CertificateSubmitForm onBack={handleBackFromSubmit} />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-foreground">Thông tin chứng chỉ</h1>
					<p className="text-sm text-muted-foreground">Quản lý chứng chỉ ngoại ngữ và tin học</p>
				</div>
				<Button className="gap-2 self-start" onClick={() => setIsSubmitMode(true)}>
					<Plus size={16} />
					Thêm chứng chỉ
				</Button>
			</div>

			{/* Summary Stats */}
			{certificates.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/20">
									<Award className="w-5 h-5 text-primary" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Tổng số</p>
									<p className="text-xl font-bold text-foreground">{certificates.length}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/5 to-green-500/10">
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-green-500/20">
									<FileCheck className="w-5 h-5 text-green-600" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Đã nộp</p>
									<p className="text-xl font-bold text-green-600">{submittedCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500/5 to-orange-500/10">
						<CardContent className="py-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-orange-500/20">
									<FileX className="w-5 h-5 text-orange-600" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Chưa nộp</p>
									<p className="text-xl font-bold text-orange-600">{pendingCount}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Certificates List */}
			{certificates.length === 0 ? (
				<Card className="border-0 shadow-lg">
					<CardContent className="py-12">
						<div className="text-center">
							<Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
							<p className="text-muted-foreground">Chưa có thông tin chứng chỉ</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{certificates.map((cert, index) => (
						<Card key={index} className="border-0 shadow-lg overflow-hidden">
							<CardHeader className="pb-2">
								<div className="flex items-start justify-between gap-4">
									<div className="flex items-start gap-3">
										<div
											className={cn(
												'p-2 rounded-lg shrink-0',
												cert.Nop ? 'bg-green-500/20' : 'bg-orange-500/20'
											)}
										>
											{cert.Nop ? (
												<FileCheck className="w-5 h-5 text-green-600" />
											) : (
												<FileX className="w-5 h-5 text-orange-600" />
											)}
										</div>
										<div>
											<CardTitle className="text-lg">{cert.CertificateType}</CardTitle>
											<Badge
												variant="outline"
												className={cn(
													'mt-1',
													cert.Nop
														? 'bg-green-500/10 text-green-600 border-green-500/30'
														: 'bg-orange-500/10 text-orange-600 border-orange-500/30'
												)}
											>
												{cert.Nop ? 'Đã nộp' : 'Chưa nộp'}
											</Badge>
										</div>
									</div>
									{hasDetails(cert) && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => toggleExpand(index)}
											className="shrink-0"
										>
											{expandedCards.has(index) ? (
												<ChevronUp className="w-4 h-4" />
											) : (
												<ChevronDown className="w-4 h-4" />
											)}
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{/* Main Info Grid */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-xs text-muted-foreground mb-1">Mã chứng chỉ</p>
										<p className={cn('text-sm font-medium', !cert.ID && 'text-muted-foreground')}>
											{cert.ID || 'Chưa cập nhật'}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground mb-1">Điểm số</p>
										<p
											className={cn(
												'text-sm font-medium',
												cert.Mark ? 'text-primary' : 'text-muted-foreground'
											)}
										>
											{cert.Mark || 'Chưa cập nhật'}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground mb-1">Số quyết định</p>
										<p
											className={cn(
												'text-sm font-medium',
												!cert.SoQuyetDinh && 'text-muted-foreground'
											)}
										>
											{cert.SoQuyetDinh || 'Chưa cập nhật'}
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground mb-1">Yêu cầu</p>
										<p className="text-sm font-medium">{cert.Request}</p>
									</div>
								</div>

								{/* Expanded Details */}
								{hasDetails(cert) && expandedCards.has(index) && (
									<div className="mt-4 pt-4 border-t border-border">
										<h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
											<FileText className="w-4 h-4 text-primary" />
											Chi tiết chứng chỉ
										</h4>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
											<div className="flex items-start gap-2">
												<Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
												<div>
													<p className="text-xs text-muted-foreground">Số hiệu</p>
													<p
														className={cn(
															'text-sm font-medium',
															!cert.CertificateNumber1 && 'text-muted-foreground'
														)}
													>
														{cert.CertificateNumber1 || 'Chưa cập nhật'}
													</p>
												</div>
											</div>
											<div className="flex items-start gap-2">
												<FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
												<div>
													<p className="text-xs text-muted-foreground">Số vào sổ</p>
													<p
														className={cn(
															'text-sm font-medium',
															!cert.RecordNumber1 && 'text-muted-foreground'
														)}
													>
														{cert.RecordNumber1 || 'Chưa cập nhật'}
													</p>
												</div>
											</div>
											<div className="flex items-start gap-2">
												<Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
												<div>
													<p className="text-xs text-muted-foreground">Ngày cấp</p>
													<p
														className={cn(
															'text-sm font-medium',
															!cert.DateOfIssue1 && 'text-muted-foreground'
														)}
													>
														{formatDate(cert.DateOfIssue1, {
															fallback: 'Chưa cập nhật'
														})}
													</p>
												</div>
											</div>
											<div className="flex items-start gap-2">
												<MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
												<div>
													<p className="text-xs text-muted-foreground">Nơi cấp</p>
													<p
														className={cn(
															'text-sm font-medium',
															!cert.PlaceOfIssue1 && 'text-muted-foreground'
														)}
													>
														{cert.PlaceOfIssue1 || 'Chưa cập nhật'}
													</p>
												</div>
											</div>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

export default CertificatesPage;

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCertificateTypes, submitCertificate, type CertificateType } from '@/services/certificateService';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { Loader2, Upload, X, ArrowLeft, FileText, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificateSubmitFormProps {
	onBack: () => void;
}

interface FormData {
	certificateType: string;
	certificateNumber: string;
	listening: string;
	speaking: string;
	reading: string;
	writing: string;
	averageScore: string;
	recordNumber: string;
	mark: string;
}

const initialFormData: FormData = {
	certificateType: '',
	certificateNumber: '',
	listening: '',
	speaking: '',
	reading: '',
	writing: '',
	averageScore: '',
	recordNumber: '',
	mark: ''
};

function CertificateSubmitForm({ onBack }: CertificateSubmitFormProps) {
	const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
	const [formData, setFormData] = useState<FormData>(initialFormData);
	const [examDate, setExamDate] = useState<Date | undefined>(undefined);
	const [dateOfIssue, setDateOfIssue] = useState<Date | undefined>(undefined);
	const [file, setFile] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingTypes, setIsLoadingTypes] = useState(true);
	const [isDragActive, setIsDragActive] = useState(false);
	const { showSuccess, showError } = useGlobalNotification();

	// Load certificate types
	useEffect(() => {
		const loadTypes = async () => {
			try {
				const types = await getCertificateTypes();
				setCertificateTypes(types);
			} catch (err) {
				console.error('Error:', err);
				showError('Không thể tải danh sách loại chứng chỉ');
			} finally {
				setIsLoadingTypes(false);
			}
		};
		loadTypes();
	}, [showError]);

	// Handle form field changes
	const handleChange = (name: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[name]: value
		}));
	};

	// Handle file drop
	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragActive(false);

			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile && droppedFile.type.startsWith('image/')) {
				if (droppedFile.size <= 5 * 1024 * 1024) {
					setFile(droppedFile);
				} else {
					showError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
				}
			} else {
				showError('Chỉ chấp nhận file hình ảnh (JPG, PNG)');
			}
		},
		[showError]
	);

	// Handle file input change
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			if (selectedFile.size <= 5 * 1024 * 1024) {
				setFile(selectedFile);
			} else {
				showError('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
			}
		}
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.certificateType) {
			showError('Vui lòng chọn loại chứng chỉ');
			return;
		}

		setIsLoading(true);
		try {
			const submitData = new window.FormData();

			if (file) {
				submitData.append('formFile', file);
				submitData.append('fileName', file.name);
			}

			const certificateData = {
				LoaiChungChi: formData.certificateType,
				IdChungChi: formData.certificateNumber,
				NgayThi: examDate ? format(examDate, 'yyyy-MM-dd') : '',
				Nghe: formData.listening,
				Noi: formData.speaking,
				Doc: formData.reading,
				Viet: formData.writing,
				TongDiem: formData.averageScore || formData.mark,
				Type: '',
				Hinh: file?.name || '',
				SoVaoSo: formData.recordNumber,
				NgayCapChungChi: dateOfIssue ? format(dateOfIssue, 'yyyy-MM-dd') : ''
			};

			submitData.append('ChungChiSinhVien', JSON.stringify(certificateData));

			await submitCertificate(submitData);
			showSuccess('Nộp chứng chỉ thành công!');
			onBack();
		} catch (err) {
			console.error('Error:', err);
			showError('Không thể nộp chứng chỉ. Vui lòng thử lại.');
		} finally {
			setIsLoading(false);
		}
	};

	// Check if the selected type is language certificate
	const isLanguageCertificate = formData.certificateType === 'CCNN';

	if (isLoadingTypes) {
		return (
			<div className="flex items-center justify-center min-h-[40vh]">
				<div className="text-center space-y-4">
					<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
					<p className="text-muted-foreground">Đang tải...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back Button */}
			<Button variant="ghost" onClick={onBack} className="gap-2">
				<ArrowLeft className="w-4 h-4" />
				Quay lại
			</Button>

			<Card className="border-0 shadow-lg">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="w-5 h-5 text-primary" />
						Thêm chứng chỉ mới
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Certificate Type */}
						<div className="space-y-2">
							<Label>
								Loại chứng chỉ <span className="text-red-500">*</span>
							</Label>
							<Select
								value={formData.certificateType}
								onValueChange={(value) => handleChange('certificateType', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Chọn loại chứng chỉ" />
								</SelectTrigger>
								<SelectContent>
									{certificateTypes.map((type) => (
										<SelectItem key={type.MaLoaiChungChi} value={type.MaLoaiChungChi}>
											{type.TenLoaiChungChi}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Language Certificate Fields */}
						{isLanguageCertificate && (
							<>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Số hiệu chứng chỉ</Label>
										<Input
											value={formData.certificateNumber}
											onChange={(e) => handleChange('certificateNumber', e.target.value)}
											placeholder="Nhập số hiệu chứng chỉ"
										/>
									</div>
									<div className="space-y-2">
										<Label>Ngày thi</Label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className={cn(
														'w-full justify-start text-left font-normal',
														!examDate && 'text-muted-foreground'
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{examDate
														? format(examDate, 'dd/MM/yyyy', {
																locale: vi
															})
														: 'Chọn ngày'}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={examDate}
													onSelect={setExamDate}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="space-y-2">
										<Label>Nghe</Label>
										<Input
											type="number"
											value={formData.listening}
											onChange={(e) => handleChange('listening', e.target.value)}
											step="0.1"
											min="0"
											max="10"
											placeholder="0.0"
										/>
									</div>
									<div className="space-y-2">
										<Label>Nói</Label>
										<Input
											type="number"
											value={formData.speaking}
											onChange={(e) => handleChange('speaking', e.target.value)}
											step="0.1"
											min="0"
											max="10"
											placeholder="0.0"
										/>
									</div>
									<div className="space-y-2">
										<Label>Đọc</Label>
										<Input
											type="number"
											value={formData.reading}
											onChange={(e) => handleChange('reading', e.target.value)}
											step="0.1"
											min="0"
											max="10"
											placeholder="0.0"
										/>
									</div>
									<div className="space-y-2">
										<Label>Viết</Label>
										<Input
											type="number"
											value={formData.writing}
											onChange={(e) => handleChange('writing', e.target.value)}
											step="0.1"
											min="0"
											max="10"
											placeholder="0.0"
										/>
									</div>
								</div>
							</>
						)}

						{/* Common Fields */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Số vào sổ</Label>
								<Input
									value={formData.recordNumber}
									onChange={(e) => handleChange('recordNumber', e.target.value)}
									placeholder="Nhập số vào sổ"
								/>
							</div>
							<div className="space-y-2">
								<Label>Ngày cấp</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												'w-full justify-start text-left font-normal',
												!dateOfIssue && 'text-muted-foreground'
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dateOfIssue
												? format(dateOfIssue, 'dd/MM/yyyy', { locale: vi })
												: 'Chọn ngày'}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={dateOfIssue}
											onSelect={setDateOfIssue}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Điểm số</Label>
							<Input
								type="number"
								value={formData.mark}
								onChange={(e) => handleChange('mark', e.target.value)}
								placeholder="Nhập điểm số"
								step="0.1"
								min="0"
								max="10"
							/>
						</div>

						{/* File Upload */}
						<div className="space-y-2">
							<Label>Hình ảnh chứng chỉ</Label>
							<div
								className={cn(
									'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
									isDragActive
										? 'border-primary bg-primary/5'
										: 'border-muted-foreground/25 hover:border-primary/50'
								)}
								onDragOver={(e) => {
									e.preventDefault();
									setIsDragActive(true);
								}}
								onDragLeave={() => setIsDragActive(false)}
								onDrop={handleDrop}
								onClick={() => document.getElementById('file-input')?.click()}
							>
								<input
									id="file-input"
									type="file"
									accept="image/*"
									onChange={handleFileChange}
									className="hidden"
								/>
								<Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
								<p className="text-sm text-muted-foreground">Kéo và thả file hoặc click để chọn</p>
								<p className="text-xs text-muted-foreground mt-1">Chấp nhận JPG, PNG (tối đa 5MB)</p>
								{file && (
									<div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary">
										<FileText className="w-4 h-4" />
										<span>{file.name}</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={(e) => {
												e.stopPropagation();
												setFile(null);
											}}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								)}
							</div>
						</div>

						{/* Submit Buttons */}
						<div className="flex gap-4 pt-4">
							<Button type="submit" disabled={isLoading} className="gap-2">
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Đang xử lý...
									</>
								) : (
									'Lưu chứng chỉ'
								)}
							</Button>
							<Button type="button" variant="outline" onClick={onBack}>
								Hủy
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default CertificateSubmitForm;

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { changePassword } from '@/services/authService';

interface ChangePasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const { showSuccess, showError } = useGlobalNotification();

	const resetForm = () => {
		setOldPassword('');
		setNewPassword('');
		setConfirmPassword('');
		setShowOldPassword(false);
		setShowNewPassword(false);
		setShowConfirmPassword(false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!oldPassword || !newPassword || !confirmPassword) {
			showError('Vui lòng điền đầy đủ thông tin');
			return;
		}

		if (newPassword !== confirmPassword) {
			showError('Mật khẩu mới và xác nhận mật khẩu không khớp');
			return;
		}

		if (newPassword.length < 8) {
			showError('Mật khẩu mới phải có ít nhất 8 ký tự');
			return;
		}

		setLoading(true);
		try {
			const response = await changePassword(oldPassword, newPassword);

			const message = response.Message || '';

			if (message.toLowerCase().includes('thành công')) {
				showSuccess(message);
				resetForm();
				onOpenChange(false);
			} else {
				showError(message || 'Đổi mật khẩu thất bại');
			}
		} catch (error: unknown) {
			const err = error as { response?: { data?: { Message?: string } } };
			showError(err.response?.data?.Message || 'Có lỗi xảy ra khi đổi mật khẩu');
		} finally {
			setLoading(false);
		}
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			resetForm();
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Lock className="h-5 w-5 text-primary" />
						Đổi mật khẩu
					</DialogTitle>
					<DialogDescription>Nhập mật khẩu cũ và mật khẩu mới để thay đổi</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					{/* Old Password */}
					<div className="space-y-2">
						<Label htmlFor="oldPassword">Mật khẩu cũ</Label>
						<div className="relative">
							<Input
								id="oldPassword"
								type={showOldPassword ? 'text' : 'password'}
								value={oldPassword}
								onChange={(e) => setOldPassword(e.target.value)}
								placeholder="Nhập mật khẩu cũ"
								className="pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
								onClick={() => setShowOldPassword(!showOldPassword)}
							>
								{showOldPassword ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</Button>
						</div>
					</div>

					{/* New Password */}
					<div className="space-y-2">
						<Label htmlFor="newPassword">Mật khẩu mới</Label>
						<div className="relative">
							<Input
								id="newPassword"
								type={showNewPassword ? 'text' : 'password'}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Nhập mật khẩu mới"
								className="pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
								onClick={() => setShowNewPassword(!showNewPassword)}
							>
								{showNewPassword ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</Button>
						</div>
					</div>

					{/* Confirm Password */}
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
						<div className="relative">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Nhập lại mật khẩu mới"
								className="pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</Button>
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex justify-end gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={loading}
						>
							Hủy
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Đang xử lý...
								</>
							) : (
								'Đổi mật khẩu'
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default ChangePasswordDialog;

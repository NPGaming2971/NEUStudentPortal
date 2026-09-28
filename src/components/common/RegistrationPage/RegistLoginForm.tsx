import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { loginRegist } from '@/services/registrationAuthService';

interface RegistLoginFormProps {
	onSuccess: () => void;
}

function RegistLoginForm({ onSuccess }: RegistLoginFormProps) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		try {
			await loginRegist(username.trim(), password);
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center py-8">
			<Card className="w-full max-w-md border-0 shadow-lg">
				<CardHeader className="space-y-2 text-center">
					<div className="flex justify-center">
						<div className="p-3 rounded-full bg-primary/10">
							<Lock className="h-8 w-8 text-primary" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold">Đăng nhập hệ thống đăng ký</CardTitle>
					<CardDescription>
						Nhập mã số sinh viên và mật khẩu tài khoản đăng ký học phần để tiếp tục
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="regist-username">Mã số sinh viên</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="regist-username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Nhập mã số sinh viên"
									className="pl-9"
									autoComplete="username"
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="regist-password">Mật khẩu</Label>
							<div className="relative">
								<Input
									id="regist-password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Nhập mật khẩu"
									className="pr-10"
									autoComplete="current-password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Đang xử lý...
								</>
							) : (
								'Đăng nhập'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default RegistLoginForm;

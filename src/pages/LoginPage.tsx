import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '@/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login as loginService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalNotification } from '@/hooks/useGlobalNotification';

function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();
    const { showError } = useGlobalNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/student/info', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await loginService(username, password);

            if (response.success && response.data?.Token) {
                login(response.data.Token, response.data);
                navigate('/student/info');
            } else {
                showError(response.message || 'Đăng nhập thất bại');
            }
        } catch {
            showError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 z-0">
                <img
                    src={assets.loginBackground}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] mix-blend-overlay" />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <Card className="w-full max-w-md z-10 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-white/10 rounded-full ring-1 ring-white/20 shadow-lg backdrop-blur-md">
                            <img
                                src={assets.imageLogo}
                                alt="NEU Logo"
                                className="w-16 h-16 object-contain drop-shadow-md"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                        Đăng Nhập
                    </CardTitle>
                    <CardDescription className="text-white/70 text-base">
                        Cổng thông tin sinh viên NEU
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-white/90 font-medium">
                                Mã số sinh viên
                            </Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập mã số sinh viên"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/50 transition-all h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white/90 font-medium">
                                Mật khẩu
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:border-white/50 transition-all pr-10 h-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-white hover:bg-white/90 text-primary dark:text-black font-bold h-11 text-base shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                "Đăng nhập"
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 items-center justify-center pt-2 pb-6">
                    <div className="text-xs text-white/50 text-center px-4">
                        Bằng việc đăng nhập, bạn đồng ý với các quy định và điều khoản sử dụng của nhà trường.
                    </div>
                </CardFooter>
            </Card>

            {/* Floating particles/decorations if desired */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
        </div>
    );
}

export default LoginPage;

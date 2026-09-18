import { Button } from '@/components/ui/button';
import { Home, MoveLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
            <div className="text-center space-y-6 max-w-md">
                <h1 className="text-9xl font-bold text-primary/20 select-none">404</h1>

                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                        Không tìm thấy đường dẫn
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Đường dẫn này không tồn tại hoặc đã được chuyển đi đâu đó.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <MoveLeft size={16} />
                        Quay lại
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => navigate('/')}
                        className="gap-2"
                    >
                        <Home size={16} />
                        Về trang chủ
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;

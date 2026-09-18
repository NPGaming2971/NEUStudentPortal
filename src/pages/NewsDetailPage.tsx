import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNewsById } from '@/services/newsService';
import type { NewsItem } from '@/services/newsService';
import { formatDate, formatTitle } from '@/lib/utils';

function NewsDetailPage() {
    const { newsId } = useParams<{ newsId: string }>();
    const navigate = useNavigate();
    const [news, setNews] = useState<NewsItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            if (!newsId) return;
            setIsLoading(true);
            setError(false);
            try {
                const data = await getNewsById(Number(newsId));
                setNews(data);
            } catch (error) {
                console.error('Error fetching news detail:', error);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, [newsId]);

    return (
        <div className="min-h-screen w-full bg-background">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={16} />
                        Quay lại
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="size-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Đang tải bài viết...</p>
                    </div>
                ) : error || !news ? (
                    <div className="bg-card border border-border rounded-2xl p-12 text-center">
                        <Newspaper className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Không thể tải bài viết
                        </h2>
                        <p className="text-muted-foreground">
                            Bài viết không tồn tại hoặc đã bị xóa.
                        </p>
                    </div>
                ) : (
                    <article className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 md:p-10">
                            <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                                {formatTitle(news.TieuDe)}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
                                {news.TenNhomTin && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                        {news.TenNhomTin}
                                    </span>
                                )}
                                <span>{formatDate(news.CreateDate)}</span>
                                {news.CreateStaff && (
                                    <>
                                        <span className="text-muted-foreground/50">•</span>
                                        <span>{news.CreateStaff}</span>
                                    </>
                                )}
                            </div>

                            {news.NoiDung ? (
                                <div
                                    className="prose prose-sm md:prose-lg dark:prose-invert max-w-none
                                                prose-headings:text-foreground prose-p:text-foreground/80
                                                prose-a:text-primary prose-strong:text-foreground
                                                prose-table:border-collapse prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border
                                                [&_table]:w-full [&_table]:text-sm [&_table]:border [&_table]:rounded-lg [&_table]:overflow-hidden
                                                [&_th]:text-left [&_th]:font-semibold [&_th]:border-border
                                                [&_td]:border-border [&_td]:bg-background
                                                [&_a]:underline-offset-2 [&_a]:hover:underline
                                                [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto"
                                    dangerouslySetInnerHTML={{ __html: news.NoiDung }}
                                />
                            ) : (
                                <p className="text-muted-foreground">
                                    Bài viết không có nội dung.
                                </p>
                            )}
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
}

export default NewsDetailPage;
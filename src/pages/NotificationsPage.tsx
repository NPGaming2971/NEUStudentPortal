import { useEffect, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, Mail, MailOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStudentNotifications, updateMessageStatus } from "@/services/notificationService";
import { cn, formatNotificationBody, formatDate, formatTitle } from "@/lib/utils";

interface Notification {
    MessageID: number;
    MessageSubject: string;
    MessageBody: string;
    SenderID: string;
    SenderName: string;
    CreationDate: string;
    IsRead: boolean;
}

interface Sender {
    id: string;
    name: string;
}


export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 7;
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSender, setSelectedSender] = useState("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [readUpdating, setReadUpdating] = useState<Record<number, boolean>>({});

    const getSenders = (notifications: Notification[]): Sender[] => {
        const senders = new Set(
            notifications.map((notification) => notification.SenderID)
        );
        return [
            { id: "all", name: "Tất cả người gửi" },
            ...Array.from(senders).map((senderId) => {
                const sender = notifications.find((n) => n.SenderID === senderId);
                return {
                    id: senderId,
                    name: `${sender?.SenderName} (${senderId})`,
                };
            }),
        ];
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getStudentNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const filterNotifications = (notifications: Notification[]): Notification[] => {
        return notifications.filter((notification) => {
            const matchesSearch =
                notification.MessageSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notification.SenderName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSender =
                selectedSender === "all" || notification.SenderID === selectedSender;
            return matchesSearch && matchesSender;
        });
    };

    const filteredNotifications = filterNotifications(notifications);
    const indexOfLastNotification = currentPage * notificationsPerPage;
    const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
    const currentNotifications = filteredNotifications.slice(
        indexOfFirstNotification,
        indexOfLastNotification
    );
    const totalPages = Math.ceil(
        filteredNotifications.length / notificationsPerPage
    );

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        setExpandedId(null);
    };

    const handleNotificationClick = async (messageId: number) => {
        if (expandedId === messageId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(messageId);
        const notification = notifications.find((n) => n.MessageID === messageId);
        if (notification && !notification.IsRead) {
            try {
                setReadUpdating((prev) => ({ ...prev, [messageId]: true }));
                await updateMessageStatus(messageId);
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.MessageID === messageId ? { ...n, IsRead: true } : n
                    )
                );
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            } finally {
                setReadUpdating((prev) => ({ ...prev, [messageId]: false }));
            }
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSender]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Thông báo sinh viên
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Quản lý và xem tất cả thông báo từ nhà trường
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Đang tải thông báo...</p>
                </div>
            ) : (
                <>
                    {/* Controls */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm theo tiêu đề hoặc người gửi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-muted/50 border-border/50 focus:bg-background transition-colors"
                                />
                            </div>

                            {/* Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-muted-foreground hidden sm:block" />
                                <Select value={selectedSender} onValueChange={setSelectedSender}>
                                    <SelectTrigger className="w-full sm:w-[220px] bg-muted/50 border-border/50">
                                        <SelectValue placeholder="Chọn người gửi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getSenders(notifications).map((sender) => (
                                            <SelectItem key={sender.id} value={sender.id}>
                                                {sender.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Pagination Info */}
                        <div className="flex items-center justify-between lg:justify-end gap-4">
                            <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                                {filteredNotifications.length} thông báo
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="size-8"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="size-8"
                                    >
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="space-y-3">
                        {currentNotifications.length === 0 ? (
                            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Mail className="size-16 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-muted-foreground">
                                        Không tìm thấy thông báo
                                    </p>
                                    <p className="text-sm text-muted-foreground/70">
                                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            currentNotifications.map((notification, index) => (
                                <Card
                                    key={notification.MessageID}
                                    className={cn(
                                        "border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group",
                                        "bg-card/80 backdrop-blur-sm hover:bg-card",
                                        !notification.IsRead && "ring-1 ring-primary/30 bg-primary/5",
                                        expandedId === notification.MessageID && "ring-2 ring-primary/50"
                                    )}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                    }}
                                    onClick={() => handleNotificationClick(notification.MessageID)}
                                >
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={cn(
                                                "p-2.5 rounded-xl shrink-0 transition-colors",
                                                notification.IsRead
                                                    ? "bg-muted text-muted-foreground"
                                                    : "bg-primary/10 text-primary"
                                            )}>
                                                {notification.IsRead ? (
                                                    <MailOpen className="size-5" />
                                                ) : (
                                                    <Mail className="size-5" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <h3 className={cn(
                                                        "text-base md:text-lg font-semibold line-clamp-2 transition-colors group-hover:text-primary",
                                                        !notification.IsRead && "text-foreground"
                                                    )}>
                                                        {formatTitle(notification.MessageSubject)}
                                                    </h3>
                                                    {!notification.IsRead && (
                                                        <span className="shrink-0 size-2 rounded-full bg-primary animate-pulse" />
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="font-medium">
                                                        {notification.SenderName}
                                                    </span>
                                                    <span className="hidden sm:inline text-muted-foreground/50">•</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                                        {notification.SenderID}
                                                    </span>
                                                    <span className="ml-auto text-xs font-medium text-muted-foreground/70">
                                                        {formatDate(notification.CreationDate)}
                                                    </span>
                                                </div>

                                                {/* Expanded Content */}
                                                {expandedId === notification.MessageID && (
                                                    <div className="mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                                                        {readUpdating[notification.MessageID] && (
                                                            <div className="flex items-center justify-center py-8">
                                                                <Loader2 className="size-6 animate-spin text-primary" />
                                                            </div>
                                                        )}
                                                        {notification.MessageBody ? (
                                                            <div
                                                                className="prose prose-sm dark:prose-invert max-w-none 
                                                                        prose-headings:text-foreground prose-p:text-muted-foreground 
                                                                        prose-a:text-primary prose-strong:text-foreground
                                                                        prose-table:border-collapse prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border
                                                                        [&_table]:w-full [&_table]:text-sm [&_table]:border [&_table]:rounded-lg [&_table]:overflow-hidden
                                                                        [&_th]:text-left [&_th]:font-semibold [&_th]:border-border
                                                                        [&_td]:border-border [&_td]:bg-background
                                                                        [&_a]:underline-offset-2 [&_a]:hover:underline
                                                                        [&_img]:rounded-lg [&_img]:max-w-full"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: formatNotificationBody(notification.MessageBody),
                                                                }}
                                                            />
                                                        ) : (
                                                            <p className="text-muted-foreground text-sm">
                                                                Không thể tải nội dung thông báo
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Bottom Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center pt-4">
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-card/80 backdrop-blur-sm shadow-lg">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="size-9"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "ghost"}
                                            size="icon"
                                            onClick={() => handlePageChange(pageNum)}
                                            className={cn(
                                                "size-9",
                                                currentPage === pageNum && "shadow-md"
                                            )}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="size-9"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

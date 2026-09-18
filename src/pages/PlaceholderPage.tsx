import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";

function PlaceholderPage() {
	const location = useLocation();
	const title = location.pathname
		.split("/")
		.filter(Boolean)
		.pop()
		?.replace(/-/g, " ");

	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-bold text-foreground'>
				{title?.length ? title : "Trang chức năng"}
			</h1>
			<Card>
				<CardContent className='flex flex-col items-center justify-center py-20 text-center'>
					<Wrench size={40} className='text-muted-foreground mb-4' />
					<p className='font-semibold text-foreground'>
						Chức năng đang được phát triển
					</p>
					<p className='text-sm text-muted-foreground mt-1'>
						Tính năng này sẽ sớm được cập nhật.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

export default PlaceholderPage;
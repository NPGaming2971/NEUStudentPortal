import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Tabs({ className, orientation = 'horizontal', ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			data-orientation={orientation}
			orientation={orientation}
			className={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
			{...props}
		/>
	);
}

const tabsListVariants = cva(
	'rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-9 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
	{
		variants: {
			variant: {
				default: 'bg-muted',
				line: 'gap-1 bg-transparent'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	}
);

interface TabsListProps
	extends React.ComponentProps<typeof TabsPrimitive.List>, VariantProps<typeof tabsListVariants> {}

function TabsList({ className, variant = 'default', ...props }: TabsListProps) {
	const listRef = React.useRef<HTMLDivElement>(null);
	const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});
	const [hoverStyle, setHoverStyle] = React.useState<React.CSSProperties>({});
	const [isHovering, setIsHovering] = React.useState(false);

	const updateIndicator = React.useCallback(() => {
		if (!listRef.current) return;

		const activeTab = listRef.current.querySelector<HTMLButtonElement>('[data-state="active"]');

		if (activeTab) {
			const listRect = listRef.current.getBoundingClientRect();
			const tabRect = activeTab.getBoundingClientRect();

			setIndicatorStyle({
				width: tabRect.width,
				height: tabRect.height,
				transform: `translateX(${tabRect.left - listRect.left}px)`
			});
		}
	}, []);

	const handleMouseEnter = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;
		const trigger = target.closest('[data-slot="tabs-trigger"]') as HTMLButtonElement;

		if (trigger && listRef.current) {
			const listRect = listRef.current.getBoundingClientRect();
			const triggerRect = trigger.getBoundingClientRect();

			setHoverStyle({
				width: triggerRect.width,
				height: triggerRect.height,
				transform: `translateX(${triggerRect.left - listRect.left}px)`,
				opacity: 1
			});
			setIsHovering(true);
		}
	}, []);

	const handleMouseLeave = React.useCallback(() => {
		setIsHovering(false);
		setHoverStyle((prev) => ({ ...prev, opacity: 0 }));
	}, []);

	React.useEffect(() => {
		updateIndicator();

		const observer = new MutationObserver(updateIndicator);
		if (listRef.current) {
			observer.observe(listRef.current, {
				attributes: true,
				subtree: true,
				attributeFilter: ['data-state']
			});
		}

		window.addEventListener('resize', updateIndicator);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', updateIndicator);
		};
	}, [updateIndicator]);

	return (
		<TabsPrimitive.List
			ref={listRef}
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), 'relative', className)}
			onMouseMove={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			{...props}
		>
			{/* Hover indicator */}
			<div
				className={cn(
					'absolute top-[3px] left-[3px] rounded-md pointer-events-none transition-all duration-200 ease-out',
					variant === 'default' ? 'bg-foreground/5' : 'bg-foreground/5',
					isHovering ? 'opacity-100' : 'opacity-0'
				)}
				style={hoverStyle}
			/>
			{/* Active indicator */}
			<div
				className={cn(
					'absolute top-[3px] left-[3px] rounded-md pointer-events-none transition-all duration-300 ease-out',
					variant === 'default'
						? 'bg-background shadow-sm dark:bg-input/30 dark:border dark:border-input'
						: 'bg-transparent'
				)}
				style={indicatorStyle}
			/>
			{props.children}
		</TabsPrimitive.List>
	);
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				'data-[state=active]:text-foreground dark:data-[state=active]:text-foreground',
				'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
				className
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

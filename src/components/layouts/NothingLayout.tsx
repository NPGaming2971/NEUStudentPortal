import type { ReactNode } from 'react';

interface NothingLayoutProps {
	children: ReactNode;
}

/**
 * NothingLayout - A minimal layout without sidebar or header.
 * Used for public pages like Home, Login, and landing pages.
 */
function NothingLayout({ children }: NothingLayoutProps) {
	return <div className="min-h-screen w-full">{children}</div>;
}

export default NothingLayout;

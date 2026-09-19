import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthRedirectProps {
	to: string;
}

export function AuthRedirect({ to }: AuthRedirectProps) {
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return <Navigate to={to} replace />;
}

export function RedirectToStudent() {
	return <AuthRedirect to="/student" />;
}

export function RedirectToStudentInfo() {
	return <AuthRedirect to="/student/info" />;
}
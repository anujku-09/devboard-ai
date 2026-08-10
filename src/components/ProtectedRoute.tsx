import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

function ProtectedRoute({
    children,
}: ProtectedRouteProps) {

    const {
        loading,
        isAuthenticated,
    } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink">
                <div className="h-8 w-8 rounded-full border-2 border-ember border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;
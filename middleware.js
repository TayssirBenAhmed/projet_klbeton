import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const { token } = req.nextauth;
        const role = token?.role;

        // 1. Pages publiques (Login) - Redirection intelligente par portail
        if (pathname === "/login-admin") {
            if (token && role === "ADMIN") {
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
            return NextResponse.next();
        }

        if (pathname === "/employee-login") {
            if (token) {
                if (role === "CHEF") return NextResponse.redirect(new URL("/chef/pointage", req.url));
                if (role === "EMPLOYE") return NextResponse.redirect(new URL("/user/profile", req.url));
                // Si ADMIN sur portail employé, on le laisse voir la page ou on le redirige vers son dashboard ?
                // On le laisse pour permettre la déconnexion/reconnexion si besoin, ou on le redirige :
                if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
            return NextResponse.next();
        }

        // 2. Vérification de la session
        if (!token || !role) {
            const loginUrl = pathname.startsWith("/admin") ? "/login-admin" : "/employee-login";
            return NextResponse.redirect(new URL(loginUrl, req.url));
        }

        // 3. Restriction par rôle STRICTE
        // ADMIN -> Uniquement /admin/...
        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/employee-login", req.url));
        }

        // CHEF -> Uniquement /chef/...
        if (pathname.startsWith("/chef") && role !== "CHEF") {
            // Un admin PEUT accéder au portail chef pour supervision
            if (role !== "ADMIN") {
                return NextResponse.redirect(new URL("/user/profile", req.url));
            }
        }

        // EMPLOYE -> Uniquement /user/...
        if (pathname.startsWith("/user")) {
            // Tous les connectés peuvent voir /user/profile
            return NextResponse.next();
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;
                // Pages publiques qui ne passent pas par authorized: true
                if (pathname === "/login-admin" || pathname === "/employee-login") {
                    return true;
                }
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/chef/:path*",
        "/user/:path*",
        "/login-admin",
        "/employee-login",
        "/api/avances/:path*",
        "/api/employes/:path*",
    ],
};


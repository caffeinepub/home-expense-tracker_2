import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import AuthGuard from "./components/AuthGuard";
import Layout from "./components/Layout";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster richColors theme={theme} position="top-right" />;
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ThemedToaster />
    </>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => (
    <AuthGuard>
      <Layout>
        <Outlet />
      </Layout>
    </AuthGuard>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayoutRoute.addChildren([homeRoute]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Solicitacoes from "./pages/Solicitacoes";
import Colaboradores from "./pages/Colaboradores";
import Unidades from "./pages/Unidades";
import Usuarios from "./pages/Usuarios";

import Configuracoes from "./pages/Configuracoes";
import Auditoria from "./pages/Auditoria";
import Auth from "./pages/Auth";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache retention
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/acesso-negado" element={<AccessDenied />} />
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['admin', 'gestor', 'agente_dp']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/solicitacoes" element={
                <ProtectedRoute allowedRoles={['admin', 'gestor', 'agente_dp']}>
                  <Solicitacoes />
                </ProtectedRoute>
              } />
              <Route path="/colaboradores" element={
                <ProtectedRoute allowedRoles={['admin', 'gestor', 'agente_dp']}>
                  <Colaboradores />
                </ProtectedRoute>
              } />
              <Route path="/unidades" element={
                <ProtectedRoute allowedRoles={['admin', 'gestor']}>
                  <Unidades />
                </ProtectedRoute>
              } />
              <Route path="/usuarios" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Usuarios />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Configuracoes />
                </ProtectedRoute>
              } />
              <Route path="/auditoria" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Auditoria />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;

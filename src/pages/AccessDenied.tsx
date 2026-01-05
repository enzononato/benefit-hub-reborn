import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default function AccessDenied() {
  const { user, userRole, userName, logout } = useAuth();
  const navigate = useNavigate();

  const subtitle = useMemo(() => {
    const email = user?.email ?? "";
    const name = userName ?? "";
    const role = userRole ?? "(não definido)";

    const parts = [name && name.trim(), email && email.trim()].filter(Boolean).join(" • ");
    return parts ? `${parts} • Perfil: ${role}` : `Perfil: ${role}`;
  }, [user?.email, userName, userRole]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <Card className="w-full border-border/60 shadow-xl">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-none tracking-tight">Acesso não autorizado</h1>
                <CardDescription>
                  Seu usuário está autenticado, mas não possui permissão para acessar esta área.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {subtitle}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Voltar
              </Button>
              <Button onClick={handleLogout}>Sair e entrar com outra conta</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import { MainLayout } from '@/components/layout/MainLayout';

export default function Auditoria() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
          <p className="mt-1 text-muted-foreground">
            Logs e auditoria do sistema
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Página em desenvolvimento
        </div>
      </div>
    </MainLayout>
  );
}

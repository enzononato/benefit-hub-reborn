import { MainLayout } from '@/components/layout/MainLayout';

export default function WhatsApp() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="mt-1 text-muted-foreground">
            Integração com WhatsApp
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Página em desenvolvimento
        </div>
      </div>
    </MainLayout>
  );
}

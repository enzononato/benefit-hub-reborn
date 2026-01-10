import { MainLayout } from '@/components/layout/MainLayout';

export default function WhatsApp() {
  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="mt-1 text-muted-foreground">
            Central de atendimento via WhatsApp
          </p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
          <iframe
            src="https://atendimento.revalle.com.br/"
            className="w-full h-full border-0"
            title="Chatwoot - Central de Atendimento"
            allow="camera; microphone; clipboard-write"
          />
        </div>
      </div>
    </MainLayout>
  );
}

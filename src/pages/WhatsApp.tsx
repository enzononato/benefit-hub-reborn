import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, MessageCircle } from 'lucide-react';

const CHATWOOT_URL = 'https://atendimento.revalle.com.br/';

export default function WhatsApp() {
  const handleOpenChatwoot = () => {
    window.open(CHATWOOT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="mt-1 text-muted-foreground">
            Central de atendimento via WhatsApp
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Central de Atendimento</CardTitle>
            <CardDescription>
              Acesse o painel do Chatwoot para gerenciar suas conversas do WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={handleOpenChatwoot} className="gap-2">
              <ExternalLink className="h-5 w-5" />
              Abrir Central de Atendimento
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              O painel será aberto em uma nova aba
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

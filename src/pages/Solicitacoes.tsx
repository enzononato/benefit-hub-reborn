import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockSolicitacoes, mockColaboradores } from '@/lib/mockData';
import { getBenefitLabel, statusColors, statusLabels } from '@/lib/benefits';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Search, Check, X } from 'lucide-react';

const Solicitacoes: React.FC = () => {
  const [search, setSearch] = useState('');
  const solicitacoes = mockSolicitacoes;

  const getColaboradorNome = (id: string) => {
    const colaborador = mockColaboradores.find(c => c.id === id);
    return colaborador?.nome || 'N/A';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Solicitações</h1>
            <p className="text-muted-foreground">Gerencie as solicitações de benefícios</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" />Nova Solicitação</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar solicitações..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Benefício</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id}>
                    <TableCell className="font-medium">{getColaboradorNome(solicitacao.colaborador_id)}</TableCell>
                    <TableCell>{getBenefitLabel(solicitacao.tipo_beneficio)}</TableCell>
                    <TableCell>{formatCurrency(solicitacao.valor)}</TableCell>
                    <TableCell>{formatDate(solicitacao.data_solicitacao)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[solicitacao.status]}>{statusLabels[solicitacao.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {solicitacao.status === 'pendente' && (
                        <>
                          <Button variant="ghost" size="icon" className="text-green-600"><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-600"><X className="h-4 w-4" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Solicitacoes;

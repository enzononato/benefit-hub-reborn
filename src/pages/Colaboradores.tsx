import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockColaboradores } from '@/lib/mockData';
import { formatCPF, formatPhone, formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

const Colaboradores: React.FC = () => {
  const [search, setSearch] = useState('');
  const colaboradores = mockColaboradores.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Colaboradores</h1>
            <p className="text-muted-foreground">Gerencie os colaboradores da empresa</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" />Novo Colaborador</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar colaboradores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((colaborador) => (
                  <TableRow key={colaborador.id}>
                    <TableCell className="font-medium">{colaborador.nome}</TableCell>
                    <TableCell>{formatCPF(colaborador.cpf)}</TableCell>
                    <TableCell>{colaborador.email}</TableCell>
                    <TableCell>{colaborador.departamento}</TableCell>
                    <TableCell>{colaborador.cargo}</TableCell>
                    <TableCell>
                      <Badge variant={colaborador.status === 'ativo' ? 'default' : 'secondary'}>
                        {colaborador.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
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

export default Colaboradores;

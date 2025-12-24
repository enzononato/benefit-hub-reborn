import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSlaConfigs, SlaConfig } from '@/hooks/useSlaConfigs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, RefreshCw, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const benefitTypeLabels: Record<string, string> = {
  autoescola: 'Autoescola',
  farmacia: 'Farmácia',
  oficina: 'Oficina',
  vale_gas: 'Vale Gás',
  papelaria: 'Papelaria',
  otica: 'Ótica',
  outros: 'Outros',
};

export default function Configuracoes() {
  const { configs, loading, fetchConfigs, createConfig, updateConfig, deleteConfig } = useSlaConfigs();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SlaConfig | null>(null);
  const [configToDelete, setConfigToDelete] = useState<SlaConfig | null>(null);
  const [formData, setFormData] = useState({
    benefit_type: '',
    green_hours: 2,
    yellow_hours: 6,
  });
  const [saving, setSaving] = useState(false);

  const existingTypes = configs.map((c) => c.benefit_type);
  const availableTypes = Object.keys(benefitTypeLabels).filter((t) => !existingTypes.includes(t));

  const handleOpenCreate = () => {
    setEditingConfig(null);
    setFormData({ benefit_type: availableTypes[0] || '', green_hours: 2, yellow_hours: 6 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (config: SlaConfig) => {
    setEditingConfig(config);
    setFormData({
      benefit_type: config.benefit_type,
      green_hours: config.green_hours,
      yellow_hours: config.yellow_hours,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (config: SlaConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.benefit_type) return;

    setSaving(true);
    if (editingConfig) {
      await updateConfig(editingConfig.id, {
        green_hours: formData.green_hours,
        yellow_hours: formData.yellow_hours,
      });
    } else {
      await createConfig(formData);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!configToDelete) return;
    await deleteConfig(configToDelete.id);
    setDeleteDialogOpen(false);
    setConfigToDelete(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="mt-1 text-muted-foreground">Configure o sistema</p>
        </div>

        <Tabs defaultValue="sla" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sla">
              <Clock className="h-4 w-4 mr-2" />
              SLA
            </TabsTrigger>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sla" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configurações de SLA</CardTitle>
                    <CardDescription>
                      Define os limites de tempo para cada tipo de benefício. Verde indica atendimento
                      rápido, amarelo indica alerta, e vermelho indica atraso.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchConfigs} disabled={loading}>
                      <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                      Atualizar
                    </Button>
                    <Button size="sm" onClick={handleOpenCreate} disabled={availableTypes.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Configuração
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Benefício</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-green-500" />
                            Verde (até)
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-yellow-500" />
                            Amarelo (até)
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-500" />
                            Vermelho (após)
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex items-center justify-center">
                              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : configs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            Nenhuma configuração de SLA cadastrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        configs.map((config) => (
                          <TableRow key={config.id}>
                            <TableCell className="font-medium">
                              {benefitTypeLabels[config.benefit_type] || config.benefit_type}
                            </TableCell>
                            <TableCell>{config.green_hours}h</TableCell>
                            <TableCell>{config.yellow_hours}h</TableCell>
                            <TableCell>&gt; {config.yellow_hours}h</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(config)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(config)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>Configurações gerais do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma configuração geral disponível no momento.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Editar Configuração de SLA' : 'Nova Configuração de SLA'}</DialogTitle>
            <DialogDescription>
              {editingConfig
                ? 'Atualize os limites de tempo para este tipo de benefício.'
                : 'Defina os limites de tempo para um novo tipo de benefício.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingConfig && (
              <div className="space-y-2">
                <Label htmlFor="benefit_type">Tipo de Benefício</Label>
                <Select
                  value={formData.benefit_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, benefit_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {benefitTypeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="green_hours">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    Verde (horas)
                  </span>
                </Label>
                <Input
                  id="green_hours"
                  type="number"
                  min={1}
                  value={formData.green_hours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, green_hours: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yellow_hours">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    Amarelo (horas)
                  </span>
                </Label>
                <Input
                  id="yellow_hours"
                  type="number"
                  min={1}
                  value={formData.yellow_hours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yellow_hours: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Solicitações que ultrapassarem {formData.yellow_hours} horas serão marcadas como vermelho (atrasadas).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.benefit_type || formData.green_hours >= formData.yellow_hours}
            >
              {saving ? 'Salvando...' : editingConfig ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Configuração de SLA"
        description={`Tem certeza que deseja excluir a configuração de SLA para "${
          configToDelete ? benefitTypeLabels[configToDelete.benefit_type] || configToDelete.benefit_type : ''
        }"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </MainLayout>
  );
}

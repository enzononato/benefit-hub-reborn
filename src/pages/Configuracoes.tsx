import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSlaConfigs, SlaConfig } from '@/hooks/useSlaConfigs';
import { useHolidays, Holiday } from '@/hooks/useHolidays';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, RefreshCw, Clock, Settings, Info, Car, Pill, Wrench, Cylinder, BookOpen, Glasses, CalendarDays, FileText, Stethoscope, Receipt, CalendarClock, AlertTriangle, Sun, ClipboardList, Smile, HeartPulse, Bus, HelpCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Todos os 19 tipos de benefícios organizados por categoria
const benefitCategories = {
  convenios: {
    label: 'Convênios',
    types: ['autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'],
  },
  dp: {
    label: 'Solicitações DP',
    types: ['alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque', 'abono_horas', 'alteracao_horario', 'operacao_domingo', 'relatorio_ponto', 'relato_anomalia'],
  },
  beneficios: {
    label: 'Benefícios',
    types: ['plano_odontologico', 'plano_saude', 'vale_transporte'],
  },
  outros: {
    label: 'Outros',
    types: ['outros'],
  },
};

const benefitTypeLabels: Record<string, string> = {
  // Convênios
  autoescola: 'Autoescola',
  farmacia: 'Farmácia',
  oficina: 'Oficina',
  vale_gas: 'Vale Gás',
  papelaria: 'Papelaria',
  otica: 'Ótica',
  // Solicitações DP
  alteracao_ferias: 'Alteração de Férias',
  aviso_folga_falta: 'Aviso Folga/Falta',
  atestado: 'Atestado',
  contracheque: 'Contracheque',
  abono_horas: 'Abono de Horas',
  alteracao_horario: 'Alteração de Horário',
  operacao_domingo: 'Operação Domingo',
  relatorio_ponto: 'Relatório de Ponto',
  relato_anomalia: 'Relato de Anomalia',
  // Benefícios
  plano_odontologico: 'Plano Odontológico',
  plano_saude: 'Plano de Saúde',
  vale_transporte: 'Vale Transporte',
  // Outros
  outros: 'Outros',
};

const benefitTypeIcons: Record<string, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
  alteracao_ferias: CalendarDays,
  aviso_folga_falta: FileText,
  atestado: Stethoscope,
  contracheque: Receipt,
  abono_horas: Clock,
  alteracao_horario: CalendarClock,
  operacao_domingo: Sun,
  relatorio_ponto: ClipboardList,
  plano_odontologico: Smile,
  plano_saude: HeartPulse,
  vale_transporte: Bus,
  relato_anomalia: AlertTriangle,
  outros: HelpCircle,
};

// Helper para identificar a categoria de um tipo
const getCategoryForType = (type: string): string => {
  for (const [key, cat] of Object.entries(benefitCategories)) {
    if (cat.types.includes(type)) return key;
  }
  return 'outros';
};

export default function Configuracoes() {
  const { configs, loading, fetchConfigs, createConfig, updateConfig, deleteConfig } = useSlaConfigs();
  const { 
    holidays, 
    loading: holidaysLoading, 
    fetchHolidays, 
    createHoliday, 
    updateHoliday, 
    deleteHoliday 
  } = useHolidays();
  
  // SLA Dialog State
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

  // Holiday Dialog State
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [deleteHolidayDialogOpen, setDeleteHolidayDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const [holidayFormData, setHolidayFormData] = useState({
    date: '',
    name: '',
  });
  const [savingHoliday, setSavingHoliday] = useState(false);

  const existingTypes = configs.map((c) => c.benefit_type);
  const availableTypes = Object.keys(benefitTypeLabels).filter((t) => !existingTypes.includes(t));

  // SLA Handlers
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

  // Holiday Handlers
  const handleOpenCreateHoliday = () => {
    setEditingHoliday(null);
    setHolidayFormData({ date: '', name: '' });
    setHolidayDialogOpen(true);
  };

  const handleOpenEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayFormData({
      date: holiday.date,
      name: holiday.name,
    });
    setHolidayDialogOpen(true);
  };

  const handleOpenDeleteHoliday = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
    setDeleteHolidayDialogOpen(true);
  };

  const handleSubmitHoliday = async () => {
    if (!holidayFormData.date || !holidayFormData.name) return;

    setSavingHoliday(true);
    if (editingHoliday) {
      await updateHoliday(editingHoliday.id, holidayFormData);
    } else {
      await createHoliday(holidayFormData);
    }
    setSavingHoliday(false);
    setHolidayDialogOpen(false);
  };

  const handleDeleteHoliday = async () => {
    if (!holidayToDelete) return;
    await deleteHoliday(holidayToDelete.id);
    setDeleteHolidayDialogOpen(false);
    setHolidayToDelete(null);
  };

  // Separar feriados futuros e passados
  const today = new Date().toISOString().split('T')[0];
  const futureHolidays = holidays.filter(h => h.date >= today);
  const pastHolidays = holidays.filter(h => h.date < today);

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
            {/* Nota informativa sobre horário comercial */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Cálculo de horas úteis
                </p>
                <p className="text-sm text-muted-foreground">
                  O SLA considera apenas <strong>horas úteis</strong>. Sábados após 12h, domingos inteiros e <strong>feriados cadastrados</strong> não são contabilizados no tempo de atendimento.
                </p>
              </div>
            </div>

            {/* Card de Feriados */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Feriados
                    </CardTitle>
                    <CardDescription>
                      Cadastre feriados que não devem ser contabilizados no cálculo de SLA.
                      Dias inteiros de feriados são excluídos da contagem de horas.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchHolidays} disabled={holidaysLoading}>
                      <RefreshCw className={cn('h-4 w-4 mr-2', holidaysLoading && 'animate-spin')} />
                      Atualizar
                    </Button>
                    <Button size="sm" onClick={handleOpenCreateHoliday}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Feriado
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holidaysLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <div className="flex items-center justify-center">
                              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : holidays.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            Nenhum feriado cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...futureHolidays, ...pastHolidays].map((holiday) => {
                          const isPast = holiday.date < today;
                          return (
                            <TableRow key={holiday.id} className={cn(isPast && 'opacity-60')}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-lg",
                                    isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                  )}>
                                    <Calendar className="h-4 w-4" />
                                  </div>
                                  <span className="font-medium">
                                    {format(parseISO(holiday.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{holiday.name}</TableCell>
                              <TableCell>
                                <Badge variant={isPast ? 'secondary' : 'default'}>
                                  {isPast ? 'Passado' : 'Ativo'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenEditHoliday(holiday)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteHoliday(holiday)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Configurações de SLA por Tipo</CardTitle>
                    <CardDescription>
                      Define os limites de tempo para cada tipo de benefício/convênio. Verde indica atendimento
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
                        configs.map((config) => {
                          const category = getCategoryForType(config.benefit_type);
                          const categoryLabel = benefitCategories[category as keyof typeof benefitCategories]?.label || 'Outros';
                          const Icon = benefitTypeIcons[config.benefit_type] || HelpCircle;
                          
                          return (
                            <TableRow key={config.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {benefitTypeLabels[config.benefit_type] || config.benefit_type}
                                    </p>
                                    <Badge variant="outline" className="text-xs mt-0.5">
                                      {categoryLabel}
                                    </Badge>
                                  </div>
                                </div>
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
                          );
                        })
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
                  <SelectContent className="max-h-80">
                    {Object.entries(benefitCategories).map(([key, category]) => {
                      const availableInCategory = category.types.filter(t => availableTypes.includes(t));
                      if (availableInCategory.length === 0) return null;
                      
                      return (
                        <SelectGroup key={key}>
                          <SelectLabel className="text-xs text-muted-foreground">{category.label}</SelectLabel>
                          {availableInCategory.map((type) => {
                            const Icon = benefitTypeIcons[type] || HelpCircle;
                            return (
                              <SelectItem key={type} value={type}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                  {benefitTypeLabels[type] || type}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      );
                    })}
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

      {/* Holiday Dialog */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHoliday ? 'Editar Feriado' : 'Novo Feriado'}</DialogTitle>
            <DialogDescription>
              {editingHoliday
                ? 'Atualize as informações do feriado.'
                : 'Cadastre um novo feriado que não será contabilizado no SLA.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="holiday_date">Data</Label>
              <Input
                id="holiday_date"
                type="date"
                value={holidayFormData.date}
                onChange={(e) => setHolidayFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday_name">Nome do Feriado</Label>
              <Input
                id="holiday_name"
                placeholder="Ex: Natal, Ano Novo, Corpus Christi..."
                value={holidayFormData.name}
                onChange={(e) => setHolidayFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitHoliday}
              disabled={savingHoliday || !holidayFormData.date || !holidayFormData.name.trim()}
            >
              {savingHoliday ? 'Salvando...' : editingHoliday ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteHolidayDialogOpen}
        onOpenChange={setDeleteHolidayDialogOpen}
        title="Excluir Feriado"
        description={`Tem certeza que deseja excluir o feriado "${holidayToDelete?.name || ''}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteHoliday}
        variant="destructive"
      />
    </MainLayout>
  );
}

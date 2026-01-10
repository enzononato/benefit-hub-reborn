import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useUsuarios, SystemUser } from '@/hooks/useUsuarios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Search, UserCog, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditarFuncaoDialog } from '@/components/usuarios/EditarFuncaoDialog';

type SystemRole = 'admin' | 'gestor' | 'agente_dp';

const roleLabels: Record<SystemRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  agente_dp: 'Agente de DP',
};

const roleColors: Record<SystemRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  gestor: 'bg-warning/10 text-warning border-warning/20',
  agente_dp: 'bg-primary/10 text-primary border-primary/20',
};

// Módulos de Convênios e Benefícios (para agrupar na exibição)
const CONVENIOS_IDS = ['autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'];
const BENEFICIOS_IDS = ['plano_odontologico', 'plano_saude', 'vale_transporte'];

const moduleLabels: Record<string, string> = {
  autoescola: 'Autoescola',
  farmacia: 'Farmácia',
  oficina: 'Oficina',
  vale_gas: 'Vale Gás',
  papelaria: 'Papelaria',
  otica: 'Ótica',
  plano_odontologico: 'Plano Odonto',
  plano_saude: 'Plano Saúde',
  vale_transporte: 'Vale Transporte',
  abono_horas: 'Abono Horas',
  alteracao_ferias: 'Alt. Férias',
  alteracao_horario: 'Alt. Horário',
  atestado: 'Atestado',
  aviso_folga_falta: 'Folga/Falta',
  contracheque: 'Contracheque',
  operacao_domingo: 'Op. Domingo',
  relatorio_ponto: 'Rel. Ponto',
  relato_anomalia: 'Rel. Anomalia',
  outros: 'Outros',
};

// IDs agregadores que não devem existir no banco (apenas os individuais)
const AGGREGATE_IDS = ['convenios', 'beneficios'];

function formatModulesDisplay(modules: string[], role: SystemRole) {
  // Administrador tem acesso a todos os módulos automaticamente
  if (role === 'admin') {
    return (
      <Badge variant="default" className="bg-primary text-primary-foreground">
        Todos
      </Badge>
    );
  }

  // Filtrar módulos válidos (excluir IDs agregadores que não deveriam estar no banco)
  const validModules = modules?.filter(m => !AGGREGATE_IDS.includes(m)) || [];

  if (validModules.length === 0) {
    return <span className="text-muted-foreground text-sm italic">Nenhum</span>;
  }

  const hasAllConvenios = CONVENIOS_IDS.every(id => validModules.includes(id));
  const hasAllBeneficios = BENEFICIOS_IDS.every(id => validModules.includes(id));

  const displayItems: string[] = [];

  if (hasAllConvenios) {
    displayItems.push('Convênios');
  }
  if (hasAllBeneficios) {
    displayItems.push('Benefícios');
  }

  // Adicionar módulos individuais (que não são convênios/benefícios completos)
  validModules.forEach(m => {
    if (hasAllConvenios && CONVENIOS_IDS.includes(m)) return;
    if (hasAllBeneficios && BENEFICIOS_IDS.includes(m)) return;
    if (!CONVENIOS_IDS.includes(m) && !BENEFICIOS_IDS.includes(m)) {
      displayItems.push(moduleLabels[m] || m);
    }
  });

  // Mostrar até 3 badges, depois "+N"
  const maxVisible = 3;
  const visibleItems = displayItems.slice(0, maxVisible);
  const remaining = displayItems.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleItems.map(item => (
        <Badge key={item} variant="secondary" className="text-xs whitespace-nowrap">
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

export default function Usuarios() {
  const { users, loading, fetchUsers, createUser, deleteUser, changePassword } = useUsuarios();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'gestor' as SystemRole,
  });

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      return;
    }

    setFormLoading(true);
    const { error } = await createUser({
      email: formData.email,
      password: formData.password,
      fullName: formData.full_name,
      role: formData.role,
    });

    if (!error) {
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'gestor' });
    }
    setFormLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    const { error } = await deleteUser(selectedUser.user_id);

    if (!error) {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
    setFormLoading(false);
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) return;

    setFormLoading(true);
    const { error } = await changePassword(selectedUser.user_id, newPassword);

    if (!error) {
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    }
    setFormLoading(false);
  };

  const openEditDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openPasswordDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsPasswordDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários e suas permissões no sistema
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite o email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Digite a senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Permissão</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: SystemRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="agente_dp">Agente de DP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserCog className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(roleColors[user.role])}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {formatModulesDisplay(user.modules, user.role)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPasswordDialog(user)}
                          title="Alterar senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Editar função e módulos"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          title="Remover usuário"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Function + Modules Dialog */}
        {selectedUser && (
          <EditarFuncaoDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            userId={selectedUser.user_id}
            userName={selectedUser.full_name}
            userEmail={selectedUser.email}
            currentRole={selectedUser.role}
            onRoleUpdated={fetchUsers}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o usuário {selectedUser?.full_name}?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Digite a nova senha para o usuário {selectedUser?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} disabled={formLoading || newPassword.length < 6}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
}

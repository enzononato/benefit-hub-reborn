import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCnpj } from '@/lib/utils';

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string | null;
  birthday: string | null;
  admission_date: string | null;
  phone: string | null;
  gender: string | null;
  position: string | null;
  unit_id: string | null;
  departamento: string | null;
  credit_limit: number | null;
  status: string;
}

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'ferias', label: 'Férias' },
  { value: 'afastado', label: 'Afastado' },
  { value: 'demitido', label: 'Demitido' },
];

const DEPARTAMENTOS = [
  { value: '101', label: '101 – PUXADA' },
  { value: '102', label: '102 – PUXADA' },
  { value: '201', label: '201 – ARMAZEM' },
  { value: '202', label: '202 – ARMAZEM' },
  { value: '301', label: '301 – ADM' },
  { value: '302', label: '302 – ADM' },
  { value: '401', label: '401 – VENDAS' },
  { value: '402', label: '402 – VENDAS' },
  { value: '501', label: '501 – ENTREGA' },
  { value: '502', label: '502 – ENTREGA' },
  { value: '601', label: '601 – ESTAGIO' },
  { value: '602', label: '602 – ESTAGIO' },
  { value: '701', label: '701 – JOVEM APRENDIZ' },
  { value: '702', label: '702 – JOVEM APRENDIZ' },
  { value: '801', label: '801 – ADM - CSC' },
  { value: '802', label: '802 – VENDAS - CSC' },
  { value: '803', label: '803 – ENTREGA - CSC' },
];

// Cache global para unidades - evita recarregar ao mudar de aba
let unitsCache: Unit[] | null = null;

export function EditColaboradorDialog({
  profile,
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  profile: Profile;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>(unitsCache || []);
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    unit_id: profile.unit_id || '',
    cpf: profile.cpf || '',
    departamento: profile.departamento || '',
    birthday: profile.birthday || '',
    admission_date: profile.admission_date || '',
    phone: profile.phone || '',
    gender: profile.gender || '',
    position: profile.position || '',
    credit_limit: profile.credit_limit?.toString() || '',
    status: profile.status || 'ativo',
  });
  
  const prevOpenRef = useRef(false);

  // Load units only once (use cache if available)
  useEffect(() => {
    if (open && units.length === 0 && !unitsCache) {
      fetchUnits();
    } else if (unitsCache && units.length === 0) {
      setUnits(unitsCache);
    }
  }, [open]);

  // Reset form only when the dialog is opened (avoids wiping edits on rerenders/tab focus)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setFormData({
        full_name: profile.full_name,
        unit_id: profile.unit_id || '',
        cpf: profile.cpf || '',
        departamento: profile.departamento || '',
        birthday: profile.birthday || '',
        admission_date: profile.admission_date || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        position: profile.position || '',
        credit_limit: profile.credit_limit?.toString() || '',
        status: profile.status || 'ativo',
      });
    }
    prevOpenRef.current = open;
  }, [open, profile]);

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) {
      console.error('Erro ao buscar unidades:', error);
      toast.error('Erro ao carregar unidades');
    } else if (data && data.length > 0) {
      unitsCache = data as Unit[];
      setUnits(unitsCache);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formatted });
  };

  const formatBirthday = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');
    }
    return value;
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthday(e.target.value);
    setFormData({ ...formData, birthday: formatted });
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const oldCreditLimit = profile.credit_limit || 0;
      const newCreditLimit = formData.credit_limit ? parseFloat(formData.credit_limit.replace(',', '.')) : 0;
      const oldStatus = profile.status || 'ativo';
      const newStatus = formData.status;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          cpf: formData.cpf.replace(/\D/g, ''),
          birthday: formData.birthday,
          admission_date: formData.admission_date || null,
          phone: formData.phone.replace(/\D/g, ''),
          gender: formData.gender,
          position: formData.position,
          unit_id: formData.unit_id,
          departamento: formData.departamento,
          credit_limit: newCreditLimit,
          status: newStatus,
        })
        .eq('id', profile.id);

      if (error) throw error;

      if (oldCreditLimit !== newCreditLimit) {
        await supabase.rpc('create_system_log', {
          p_action: 'credit_limit_updated',
          p_entity_type: 'profile',
          p_entity_id: profile.id,
          p_details: {
            full_name: formData.full_name,
            old_credit_limit: oldCreditLimit,
            new_credit_limit: newCreditLimit,
          },
        });
      }

      if (oldStatus !== newStatus) {
        await supabase.rpc('create_system_log', {
          p_action: 'collaborator_status_changed',
          p_entity_type: 'profile',
          p_entity_id: profile.id,
          p_details: {
            full_name: formData.full_name,
            old_status: oldStatus,
            new_status: newStatus,
          },
        });
      }

      toast.success('Colaborador atualizado com sucesso!');
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao atualizar colaborador:', error);

      if (error?.message?.includes('profiles_cpf_key') ||
          error?.code === '23505' ||
          error?.message?.includes('duplicate key')) {
        toast.error('Este CPF já está cadastrado no sistema');
      } else {
        toast.error(error.message || 'Erro ao atualizar colaborador');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Colaborador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
              <SelectTrigger id="unit">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {units.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Carregando unidades...</div>
                ) : (
                  units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} - {formatCnpj(unit.code)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              required
              value={formData.cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento *</Label>
            <Select value={formData.departamento} onValueChange={(value) => setFormData({ ...formData, departamento: value })}>
              <SelectTrigger id="departamento">
                <SelectValue placeholder="Selecione o departamento" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {DEPARTAMENTOS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Data de Aniversário *</Label>
            <Input
              id="birthday"
              required
              value={formData.birthday}
              onChange={handleBirthdayChange}
              placeholder="01/10/1990"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admission_date">Data de Admissão</Label>
            <Input
              id="admission_date"
              value={formData.admission_date}
              onChange={(e) => {
                const numbers = e.target.value.replace(/\D/g, '');
                let formatted = numbers;
                if (numbers.length <= 8) {
                  formatted = numbers
                    .replace(/(\d{2})(\d)/, '$1/$2')
                    .replace(/(\d{2})(\d)/, '$1/$2');
                }
                setFormData({ ...formData, admission_date: formatted });
              }}
              placeholder="01/01/2024"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Sexo *</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo *</Label>
            <Input
              id="position"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Analista, Gerente, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit_limit">Limite de Crédito (R$)</Label>
            <Input
              id="credit_limit"
              type="text"
              value={formData.credit_limit}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,\.]/g, '');
                setFormData({ ...formData, credit_limit: value });
              }}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Situação *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

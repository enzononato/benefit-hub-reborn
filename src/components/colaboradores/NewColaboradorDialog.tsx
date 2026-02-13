import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCnpj } from '@/lib/utils';

interface Unit {
  id: string;
  name: string;
  code: string;
}

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

export function NewColaboradorDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    unit_id: '',
    cpf: '',
    departamento: '',
    birthday: '',
    admission_date: '',
    phone: '',
    gender: '',
    position: '',
  });

  useEffect(() => {
    if (open) {
      fetchUnits();
    }
  }, [open]);

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) {
      console.error('Erro ao buscar unidades:', error);
      toast.error('Erro ao carregar unidades');
    } else if (data && data.length > 0) {
      setUnits(data as Unit[]);
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: crypto.randomUUID(),
          full_name: formData.full_name,
          email: `${formData.cpf.replace(/\D/g, '')}@temp.com`,
          cpf: formData.cpf.replace(/\D/g, ''),
          birthday: formData.birthday,
          admission_date: formData.admission_date || null,
          phone: formData.phone.replace(/\D/g, ''),
          gender: formData.gender,
          position: formData.position,
          unit_id: formData.unit_id,
          departamento: formData.departamento,
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: profileData.user_id,
          role: 'colaborador',
        }]);

      if (roleError) {
        console.error('Erro ao criar role:', roleError);
      }

      await supabase.rpc('create_system_log', {
        p_action: 'collaborator_created',
        p_entity_type: 'profile',
        p_entity_id: profileData.id,
        p_details: {
          full_name: formData.full_name,
          cpf: formData.cpf,
        },
      });

      toast.success('Colaborador cadastrado com sucesso!');

      setOpen(false);
      setFormData({
        full_name: '',
        unit_id: '',
        cpf: '',
        departamento: '',
        birthday: '',
        admission_date: '',
        phone: '',
        gender: '',
        position: '',
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar colaborador:', error);

      if (error?.message?.includes('profiles_cpf_key') ||
          error?.code === '23505' ||
          error?.message?.includes('duplicate key')) {
        toast.error('Este CPF já está cadastrado no sistema');
      } else {
        toast.error(error.message || 'Erro ao cadastrar colaborador');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Cadastrar Novo Colaborador</DialogTitle>
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { roleLabels, UserRole } from '@/types/benefits';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Building2, Calendar, Phone, Briefcase, History, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { NewColaboradorDialog } from '@/components/colaboradores/NewColaboradorDialog';
import { ImportCSVDialog } from '@/components/colaboradores/ImportCSVDialog';
import { DeleteColaboradorDialog } from '@/components/colaboradores/DeleteColaboradorDialog';
import { EditColaboradorDialog } from '@/components/colaboradores/EditColaboradorDialog';
import { ColaboradorHistorySheet } from '@/components/colaboradores/ColaboradorHistorySheet';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Unit {
  id: string;
  name: string;
}

const DEPARTAMENTOS_LABELS: Record<string, string> = {
  '101': '101 – PUXADA',
  '102': '102 – PUXADA',
  '201': '201 – ARMAZEM',
  '202': '202 – ARMAZEM',
  '301': '301 – ADM',
  '302': '302 – ADM',
  '401': '401 – VENDAS',
  '402': '402 – VENDAS',
  '501': '501 – ENTREGA',
  '502': '502 – ENTREGA',
  '601': '601 – ESTAGIO',
  '602': '602 – ESTAGIO',
  '701': '701 – JOVEM APRENDIZ',
  '702': '702 – JOVEM APRENDIZ',
  '801': '801 – ADM - CSC',
  '802': '802 – VENDAS - CSC',
  '803': '803 – ENTREGA - CSC',
};

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string | null;
  birthday: string | null;
  phone: string | null;
  gender: string | null;
  position: string | null;
  unit_id: string | null;
  departamento: string | null;
  credit_limit: number | null;
  credit_used: number;
  units: { name: string } | null;
  user_roles: { role: UserRole }[];
}

export default function Colaboradores() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(searchParams.get('unit') || null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState<{ user_id: string; full_name: string } | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(searchParams.get('edit') || null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Restore history sheet from URL
  useEffect(() => {
    const historyUserId = searchParams.get('history');
    if (historyUserId && profiles.length > 0 && !selectedColaborador) {
      const profile = profiles.find(p => p.user_id === historyUserId);
      if (profile) {
        setSelectedColaborador({ user_id: profile.user_id, full_name: profile.full_name });
        setHistoryOpen(true);
      }
    }
  }, [profiles, searchParams]);

  const fetchProfiles = async () => {
    setLoading(true);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, cpf, birthday, phone, gender, position, unit_id, departamento, credit_limit')
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    const { data: unitsData } = await supabase.from('units').select('id, name').order('name');
    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');

    setUnits(unitsData || []);

    const systemRoles = ['admin', 'gestor', 'agente_dp'];
    const systemUserIds = new Set(
      (rolesData || []).filter((r) => systemRoles.includes(r.role)).map((r) => r.user_id)
    );

    const userIds = (profilesData || []).map(p => p.user_id);
    const { data: approvedBenefits } = await supabase
      .from('benefit_requests')
      .select('user_id, approved_value')
      .in('user_id', userIds)
      .in('status', ['aprovada', 'concluida']);

    const usageByUser: Record<string, number> = {};
    approvedBenefits?.forEach((benefit) => {
      usageByUser[benefit.user_id] = (usageByUser[benefit.user_id] || 0) + (benefit.approved_value || 0);
    });

    const profilesWithRelations = (profilesData || [])
      .filter((profile) => !systemUserIds.has(profile.user_id))
      .map((profile) => {
        const unit = unitsData?.find((u) => u.id === profile.unit_id);
        const roles = (rolesData || []).filter((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          units: unit ? { name: unit.name } : null,
          user_roles: roles,
          credit_used: usageByUser[profile.user_id] || 0,
        };
      });

    setProfiles(profilesWithRelations as unknown as Profile[]);
    setLoading(false);
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (profile.cpf && profile.cpf.includes(search));
    const matchesUnit = !selectedUnitId || profile.unit_id === selectedUnitId;
    return matchesSearch && matchesUnit;
  });

  const getRoleLabel = (profile: Profile) => {
    const role = profile.user_roles?.[0]?.role || 'colaborador';
    return roleLabels[role] || 'Colaborador';
  };

  const getRoleVariant = (profile: Profile) => {
    const role = profile.user_roles?.[0]?.role;
    return role === 'admin' ? 'default' : 'secondary';
  };

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Colaboradores</h1>
            <p className="mt-1 text-muted-foreground">Gerencie os colaboradores cadastrados</p>
          </div>
          <div className="flex gap-3">
            <ImportCSVDialog onSuccess={fetchProfiles} />
            <NewColaboradorDialog onSuccess={fetchProfiles} />
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearch(newValue);
                setCurrentPage(1);
                const newParams = new URLSearchParams(searchParams);
                if (newValue) {
                  newParams.set('search', newValue);
                } else {
                  newParams.delete('search');
                }
                setSearchParams(newParams, { replace: true });
              }}
              className="pl-9"
            />
          </div>
          <Select value={selectedUnitId || "all"} onValueChange={(value) => { 
            const newValue = value === "all" ? null : value;
            setSelectedUnitId(newValue); 
            setCurrentPage(1);
            // Persist to URL
            const newParams = new URLSearchParams(searchParams);
            if (newValue) {
              newParams.set('unit', newValue);
            } else {
              newParams.delete('unit');
            }
            setSearchParams(newParams, { replace: true });
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            ))
          ) : paginatedProfiles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            paginatedProfiles.map((profile) => (
              <div key={profile.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                    {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{profile.full_name}</h3>
                    {profile.cpf && (
                      <p className="text-sm text-muted-foreground truncate">
                        CPF: {profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.birthday || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.units?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.position || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 opacity-70 shrink-0" />
                    <span className="text-xs truncate">{profile.departamento ? DEPARTAMENTOS_LABELS[profile.departamento] || profile.departamento : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <Wallet className="h-4 w-4 shrink-0 text-primary" />
                    <span className={`font-medium ${profile.credit_limit && profile.credit_used >= profile.credit_limit ? 'text-destructive' : 'text-foreground'}`}>
                      R$ {profile.credit_used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {(profile.credit_limit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <Badge variant={getRoleVariant(profile)}>{getRoleLabel(profile)}</Badge>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { 
                      setSelectedColaborador({ user_id: profile.user_id, full_name: profile.full_name }); 
                      setHistoryOpen(true);
                      // Persist to URL
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('history', profile.user_id);
                      setSearchParams(newParams, { replace: true });
                    }} title="Histórico">
                      <History className="h-4 w-4" />
                    </Button>
                    <EditColaboradorDialog 
                      profile={profile} 
                      onSuccess={fetchProfiles}
                      open={editingProfileId === profile.id}
                      onOpenChange={(open) => {
                        const newParams = new URLSearchParams(searchParams);
                        if (open) {
                          setEditingProfileId(profile.id);
                          newParams.set('edit', profile.id);
                        } else {
                          setEditingProfileId(null);
                          newParams.delete('edit');
                        }
                        setSearchParams(newParams, { replace: true });
                      }}
                    />
                    <DeleteColaboradorDialog profileId={profile.id} userId={profile.user_id} name={profile.full_name} onSuccess={fetchProfiles} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredProfiles.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredProfiles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}

        <ColaboradorHistorySheet 
          open={historyOpen} 
          onOpenChange={(open) => {
            setHistoryOpen(open);
            if (!open) {
              setSelectedColaborador(null);
              // Remove from URL when closing
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('history');
              setSearchParams(newParams, { replace: true });
            }
          }} 
          colaborador={selectedColaborador} 
        />
      </div>
    </MainLayout>
  );
}

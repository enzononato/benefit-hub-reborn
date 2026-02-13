import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, CheckCircle2, Upload, FileText, UserMinus, UserPlus, UserCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Unit {
  id: string;
  code: string;
}

interface SyncResult {
  updated: number;
  created: number;
  terminated: number;
  errors: string[];
}

interface PreviewData {
  toUpdate: { cpf: string; name: string }[];
  toCreate: { cpf: string; name: string }[];
  toTerminate: { cpf: string; name: string }[];
}

interface SyncCSVDialogProps {
  onSuccess: () => void;
}

export function SyncCSVDialog({ onSuccess }: SyncCSVDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [units, setUnits] = useState<Unit[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    if (open) {
      fetchUnits();
      setCsvData([]);
      setPreview(null);
      setResult(null);
      setProgress(0);
    }
  }, [open]);

  const fetchUnits = async () => {
    const { data } = await supabase.from('units').select('id, code');
    setUnits(data || []);
  };

  const cleanCPF = (cpf: string): string => {
    return cpf.replace(/\D/g, '');
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Format: DD/MM/YYYY -> YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
  };

  const parseGender = (gender: string): string | null => {
    if (!gender) return null;
    const lower = gender.toLowerCase().trim();
    if (lower === 'masculino' || lower === 'm') return 'masculino';
    if (lower === 'feminino' || lower === 'f') return 'feminino';
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setPreview(null);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^\ufeff/, ''));
      
      // Validate headers
      const requiredHeaders = ['nome_completo', 'cpf', 'codigo_unidade', 'departamento', 'codigo_empresa', 'codigo_empregador', 'data_admissao'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast.error(`Colunas obrigatórias faltando: ${missingHeaders.join(', ')}`);
        setLoading(false);
        return;
      }

      // Parse CSV data
      const dataRows: string[][] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length) {
          dataRows.push(values);
        }
      }

      setCsvData(dataRows);

      // Get column indices
      const nameIdx = headers.indexOf('nome_completo');
      const cpfIdx = headers.indexOf('cpf');
      const birthdayIdx = headers.indexOf('data_aniversario');
      const admissionIdx = headers.indexOf('data_admissao');
      const phoneIdx = headers.indexOf('telefone');
      const genderIdx = headers.indexOf('sexo');
      const positionIdx = headers.indexOf('cargo');
      const unitCodeIdx = headers.indexOf('codigo_unidade');

      // Extract CPFs from CSV
      const csvCpfs = new Set(dataRows.map(row => cleanCPF(row[cpfIdx])));

      // Get all active collaborators from DB
      const { data: dbProfiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, cpf, status')
        .eq('status', 'ativo');

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Identify system users (admin, gestor, agente_dp) to exclude
      const systemRoles = ['admin', 'gestor', 'agente_dp'];
      const systemUserIds = new Set(
        (rolesData || []).filter(r => systemRoles.includes(r.role)).map(r => r.user_id)
      );

      // Filter to get only collaborators (exclude system users)
      const activeColaboradores = (dbProfiles || []).filter(p => 
        !systemUserIds.has(p.user_id) && p.cpf
      );

      // Build preview
      const toUpdate: { cpf: string; name: string }[] = [];
      const toCreate: { cpf: string; name: string }[] = [];
      const toTerminate: { cpf: string; name: string }[] = [];

      // Check CSV rows
      for (const row of dataRows) {
        const cpf = cleanCPF(row[cpfIdx]);
        const name = row[nameIdx];
        const existsInDb = activeColaboradores.some(p => cleanCPF(p.cpf || '') === cpf);
        
        if (existsInDb) {
          toUpdate.push({ cpf, name });
        } else {
          toCreate.push({ cpf, name });
        }
      }

      // Check DB profiles not in CSV (to terminate)
      for (const profile of activeColaboradores) {
        const cpf = cleanCPF(profile.cpf || '');
        if (!csvCpfs.has(cpf)) {
          toTerminate.push({ cpf, name: profile.full_name });
        }
      }

      setPreview({ toUpdate, toCreate, toTerminate });
      toast.success(`Arquivo analisado: ${dataRows.length} linhas`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Erro ao processar arquivo CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!preview || csvData.length === 0) return;

    setSyncing(true);
    setProgress(0);

    const result: SyncResult = { updated: 0, created: 0, terminated: 0, errors: [] };

    try {
      // Column indices
      const nameIdx = 0, cpfIdx = 1, birthdayIdx = 2, admissionDateIdx = 3, phoneIdx = 4, genderIdx = 5, positionIdx = 6, unitCodeIdx = 7, deptIdx = 8, empCodeIdx = 9, empIdIdx = 10;

      // Create unit code to ID map
      const unitMap = new Map(units.map(u => [u.code, u.id]));

      setProgress(10);

      // Step 1: Fetch all existing profiles in ONE query
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, cpf, status');

      const cpfToProfileId = new Map(
        (existingProfiles || [])
          .filter(p => p.cpf)
          .map(p => [cleanCPF(p.cpf), p.id])
      );

      const cpfToStatus = new Map(
        (existingProfiles || [])
          .filter(p => p.cpf)
          .map(p => [cleanCPF(p.cpf), p.status])
      );

      setProgress(20);

      // Step 2: Separate updates from creates
      const toUpdateBatch: { id: string; data: Record<string, unknown> }[] = [];
      const toCreateBatch: Record<string, unknown>[] = [];

      for (const row of csvData) {
        const cpf = cleanCPF(row[cpfIdx]);
        const name = row[nameIdx];
        const birthday = parseDate(row[birthdayIdx]);
        const admissionDate = parseDate(row[admissionDateIdx]);
        const phone = row[phoneIdx];
        const gender = parseGender(row[genderIdx]);
        const position = row[positionIdx];
        const unitCode = row[unitCodeIdx];
        const departamento = row[deptIdx];
        const codigoEmpresa = row[empCodeIdx];
        const codigoEmpregador = row[empIdIdx];
        const unitId = unitMap.get(unitCode);

        const existingId = cpfToProfileId.get(cpf);

        if (existingId) {
          toUpdateBatch.push({
            id: existingId,
            data: {
              full_name: name,
              phone: phone || null,
              birthday: birthday,
              admission_date: admissionDate,
              gender: gender,
              position: position || null,
              unit_id: unitId || null,
              departamento: departamento || null,
              codigo_empresa: codigoEmpresa || null,
              codigo_empregador: codigoEmpregador || null,
              status: (cpfToStatus.get(cpf) === 'ferias' || cpfToStatus.get(cpf) === 'afastado') ? cpfToStatus.get(cpf) : 'ativo',
            }
          });
        } else {
          const newUserId = crypto.randomUUID();
          toCreateBatch.push({
            user_id: newUserId,
            full_name: name,
            email: `${cpf}@placeholder.local`,
            cpf: cpf,
            phone: phone || null,
            birthday: birthday,
            admission_date: admissionDate,
            gender: gender,
            position: position || null,
            unit_id: unitId || null,
            departamento: departamento || null,
            codigo_empresa: codigoEmpresa || null,
            codigo_empregador: codigoEmpregador || null,
            credit_limit: 0,
            status: 'ativo',
          });
        }
      }

      setProgress(30);

      // Step 3: Batch updates (in chunks of 50)
      const updateChunkSize = 50;
      for (let i = 0; i < toUpdateBatch.length; i += updateChunkSize) {
        const chunk = toUpdateBatch.slice(i, i + updateChunkSize);
        
        // Process chunk in parallel
        const updatePromises = chunk.map(item =>
          supabase
            .from('profiles')
            .update(item.data)
            .eq('id', item.id)
        );

        const results = await Promise.all(updatePromises);
        results.forEach((res, idx) => {
          if (res.error) {
            result.errors.push(`Erro ao atualizar: ${res.error.message}`);
          } else {
            result.updated++;
          }
        });

        setProgress(30 + Math.round((i / toUpdateBatch.length) * 40));
      }

      setProgress(70);

      // Step 4: Batch inserts (in chunks of 100)
      const createChunkSize = 100;
      for (let i = 0; i < toCreateBatch.length; i += createChunkSize) {
        const chunk = toCreateBatch.slice(i, i + createChunkSize);
        
        const { error, data: insertedData } = await supabase
          .from('profiles')
          .insert(chunk)
          .select('user_id');

        if (error) {
          result.errors.push(`Erro ao criar lote: ${error.message}`);
        } else {
          result.created += chunk.length;
          
          // Add colaborador roles in batch
          if (insertedData && insertedData.length > 0) {
            const roleInserts = insertedData.map(p => ({
              user_id: p.user_id,
              role: 'colaborador' as const,
            }));
            await supabase.from('user_roles').insert(roleInserts);
          }
        }

        setProgress(70 + Math.round((i / Math.max(toCreateBatch.length, 1)) * 15));
      }

      setProgress(85);

      // Step 5: Batch terminate (in chunks of 50)
      const terminateCpfs = preview.toTerminate.map(t => t.cpf);
      const terminateChunkSize = 50;
      
      for (let i = 0; i < terminateCpfs.length; i += terminateChunkSize) {
        const chunk = terminateCpfs.slice(i, i + terminateChunkSize);
        
        const { error, count } = await supabase
          .from('profiles')
          .update({ status: 'demitido' })
          .in('cpf', chunk);

        if (error) {
          result.errors.push(`Erro ao demitir lote: ${error.message}`);
        } else {
          result.terminated += chunk.length;
        }

        setProgress(85 + Math.round((i / Math.max(terminateCpfs.length, 1)) * 15));
      }

      setProgress(100);
      setResult(result);

      // Save last sync date
      await supabase
        .from('system_config')
        .upsert({
          key: 'last_colaboradores_sync',
          value: { timestamp: new Date().toISOString() },
          description: 'Data da última sincronização de colaboradores via CSV'
        }, { onConflict: 'key' });
      
      if (result.errors.length === 0) {
        toast.success('Sincronização concluída com sucesso!');
        onSuccess();
      } else {
        toast.warning(`Sincronização concluída com ${result.errors.length} erros`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro durante a sincronização');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Sincronizar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronizar Colaboradores
          </DialogTitle>
          <DialogDescription>
            Atualize dados existentes, crie novos e marque demitidos automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Esta ação irá:
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Atualizar dados de colaboradores existentes (exceto limite de crédito)</li>
                <li>Criar novos colaboradores que não existem</li>
                <li>Marcar como <strong>DEMITIDO</strong> colaboradores que não estão no CSV</li>
              </ul>
              <p className="mt-2 text-green-600 dark:text-green-400">
                ✅ Preserva: limite de crédito e histórico de benefícios
              </p>
            </AlertDescription>
          </Alert>

          {!result && (
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading || syncing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Button variant="outline" className="w-full gap-2" disabled={loading || syncing}>
                <Upload className="h-4 w-4" />
                {loading ? 'Analisando...' : 'Selecionar Arquivo CSV'}
              </Button>
            </div>
          )}

          {preview && !result && (
            <ScrollArea className="flex-1 max-h-[300px]">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <UserCheck className="h-5 w-5" />
                      <span className="font-semibold">Atualizar</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {preview.toUpdate.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <UserPlus className="h-5 w-5" />
                      <span className="font-semibold">Criar</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                      {preview.toCreate.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <UserMinus className="h-5 w-5" />
                      <span className="font-semibold">Demitir</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                      {preview.toTerminate.length}
                    </p>
                  </div>
                </div>

                {preview.toTerminate.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Colaboradores que serão marcados como demitidos:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {preview.toTerminate.slice(0, 20).map((t, i) => (
                        <p key={i} className="text-sm text-foreground">{t.name}</p>
                      ))}
                      {preview.toTerminate.length > 20 && (
                        <p className="text-sm text-muted-foreground">
                          ... e mais {preview.toTerminate.length - 20}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {syncing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Processando... {progress}%
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Sincronização concluída!</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">{result.updated}</p>
                  <p className="text-sm text-muted-foreground">Atualizados</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">{result.created}</p>
                  <p className="text-sm text-muted-foreground">Criados</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">{result.terminated}</p>
                  <p className="text-sm text-muted-foreground">Demitidos</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-2">Erros ({result.errors.length}):</p>
                  <ScrollArea className="max-h-24">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {result ? 'Fechar' : 'Cancelar'}
          </Button>
          {preview && !result && (
            <Button onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Sincronização
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

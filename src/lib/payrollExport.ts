import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { benefitTypeLabels, BenefitType } from '@/types/benefits';

interface PayrollRequest {
  protocol: string;
  benefit_type: BenefitType;
  status: string;
  approved_value?: number | null;
  total_installments?: number | null;
  closed_at?: string | null;
  created_at: string;
  details?: string | null;
  profile?: {
    full_name?: string | null;
    cpf?: string | null;
    phone?: string | null;
    unit?: { name?: string | null } | null;
  } | null;
}

const HEADERS = [
  'Protocolo',
  'Colaborador',
  'CPF',
  'Telefone',
  'Revenda',
  'Tipo',
  'Status',
  'Proventos ',
  'descontos ',
  'Parcelas',
  'Data',
  'Detalhes',
];

function buildRows(requests: PayrollRequest[]): (string | number | null)[][] {
  const approved = requests.filter((r) => r.status === 'aprovada');
  const rows: (string | number | null)[][] = [];

  for (const r of approved) {
    const colaborador = r.profile?.full_name || '';
    const cpf = r.profile?.cpf || '';
    const telefone = r.profile?.phone || '';
    const revenda = r.profile?.unit?.name || '';
    const tipo = benefitTypeLabels[r.benefit_type] || r.benefit_type;
    const dataBase = r.closed_at ? new Date(r.closed_at) : new Date(r.created_at);
    const dataFormatted = format(dataBase, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    const valor = Number(r.approved_value || 0);
    const parcelas = Math.max(1, Number(r.total_installments || 1));
    const valorParcela = parcelas > 0 ? valor / parcelas : valor;
    const detalhes = r.details || '';

    // Linha de provento (1 por protocolo)
    rows.push([
      r.protocol,
      colaborador,
      cpf,
      telefone,
      revenda,
      tipo,
      'Aprovado',
      Number(valor.toFixed(2)),
      null,
      parcelas,
      dataFormatted,
      detalhes,
    ]);

    // Linhas de desconto (1 por parcela)
    for (let i = 0; i < parcelas; i++) {
      rows.push([
        r.protocol,
        colaborador,
        cpf,
        telefone,
        revenda,
        'Convenio Revalle ',
        'Aprovado',
        null,
        Number((-valorParcela).toFixed(2)),
        null,
        null,
        null,
      ]);
    }
  }

  return rows;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportApprovedPayrollCSV(requests: PayrollRequest[]) {
  const rows = buildRows(requests);
  const csv = [
    HEADERS.join(';'),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          return `"${String(cell).replace(/"/g, '""')}"`;
        })
        .join(';')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `folha_aprovados_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
}

export function exportApprovedPayrollXLSX(requests: PayrollRequest[]) {
  const rows = buildRows(requests);
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);

  // Aplica formato contábil com negativos em vermelho nas colunas Proventos (H) e Descontos (I)
  const moneyFormat = '#,##0.00;[Red]-#,##0.00;-';
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let R = 1; R <= range.e.r; R++) {
    for (const C of [7, 8]) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[ref];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        cell.z = moneyFormat;
      }
    }
  }

  // Larguras de coluna para melhor leitura
  ws['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 16 },
    { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aprovados');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `folha_aprovados_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`);
}

export function countApproved(requests: PayrollRequest[]): number {
  return requests.filter((r) => r.status === 'aprovada').length;
}

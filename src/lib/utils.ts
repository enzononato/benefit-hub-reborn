import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCnpj(value: string): string {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  if (numbers.length !== 14) return value;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export function getWhatsAppLink(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  const phoneWithCountry = numbers.startsWith('55') ? numbers : `55${numbers}`;
  return `https://wa.me/${phoneWithCountry}`;
}

export function getSLATime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) {
    const mins = diffMins % 60;
    return `${diffHours}h ${mins}min`;
  }
  if (diffDays < 7) {
    const hours = diffHours % 24;
    return `${diffDays}d ${hours}h`;
  }
  return `${diffDays}d`;
}

export function truncateFileName(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) return name;
  
  const lastDot = name.lastIndexOf('.');
  const extension = lastDot > -1 ? name.slice(lastDot) : '';
  const baseName = lastDot > -1 ? name.slice(0, lastDot) : name;
  
  const availableLength = maxLength - extension.length - 3;
  
  if (availableLength <= 0) {
    return name.slice(0, maxLength - 3) + '...';
  }
  
  return baseName.slice(0, availableLength) + '...' + extension;
}

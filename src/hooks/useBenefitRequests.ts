import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BenefitStatus, BenefitType } from '@/types/benefits';
import { toast } from 'sonner';

// Store for new request IDs to trigger highlight animations
const newRequestIdsStore = new Set<string>();

export const getNewRequestIds = () => newRequestIdsStore;
export const clearNewRequestId = (id: string) => newRequestIdsStore.delete(id);

export interface BenefitRequest {
  id: string;
  protocol: string;
  user_id: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  details: string | null;
  requested_value: number | null;
  approved_value?: number | null;
  total_installments?: number | null;
  paid_installments?: number | null;
  created_at: string;
  closed_at?: string | null;
  pdf_url?: string | null;
  pdf_file_name?: string | null;
  rejection_reason?: string | null;
  closing_message?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
  // Evolution API direct integration
  whatsapp_jid?: string | null;
  // Legacy: Chatwoot integration (for backward compatibility)
  account_id?: number | null;
  conversation_id?: number | null;
  // HR approval fields
  hr_status?: string | null;
  hr_reviewed_by?: string | null;
  hr_reviewed_at?: string | null;
  hr_notes?: string | null;
  profile?: {
    full_name: string;
    cpf?: string | null;
    phone?: string | null;
    unit_id?: string | null;
    unit?: {
      name: string;
    } | null;
  } | null;
}

const fetchBenefitRequests = async (allowedModules: string[] | null, userRole: string | null): Promise<BenefitRequest[]> => {
  // RH users can only see alteracao_ferias (RLS enforces this, but we explicitly set modules)
  if (userRole === 'rh') {
    // RLS already filters to only alteracao_ferias for RH
    // Just fetch what RLS allows
    const { data: requestsData, error: requestsError } = await supabase
      .from('benefit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      throw requestsError;
    }

    // Fetch profiles
    const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
    
    if (userIds.length === 0) {
      return [];
    }

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, cpf, phone, unit_id, unit:units(name)')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    const requestsWithProfiles = (requestsData || []).map(req => ({
      ...req,
      profile: profilesMap.get(req.user_id) || null
    }));

    return requestsWithProfiles as BenefitRequest[];
  }

  // If user has no modules configured (empty array), return empty
  if (allowedModules !== null && allowedModules.length === 0) {
    return [];
  }

  let query = supabase
    .from('benefit_requests')
    .select('*')
    .order('created_at', { ascending: false });

  // If not admin (allowedModules !== null), filter by allowed benefit types
  if (allowedModules !== null) {
    query = query.in('benefit_type', allowedModules);
  }

  const { data: requestsData, error: requestsError } = await query;

  if (requestsError) {
    console.error('Error fetching requests:', requestsError);
    throw requestsError;
  }

  // Fetch profiles separately
  const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
  
  if (userIds.length === 0) {
    return [];
  }

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, full_name, cpf, phone, unit_id, unit:units(name)')
    .in('user_id', userIds);

  const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

  let requestsWithProfiles = (requestsData || []).map(req => ({
    ...req,
    profile: profilesMap.get(req.user_id) || null
  })) as BenefitRequest[];

  // For DP/Gestor/Admin, filter out alteracao_ferias that haven't been approved by HR yet
  // (unless they are already closed)
  if (userRole !== 'rh') {
    requestsWithProfiles = requestsWithProfiles.filter(req => {
      // If not alteracao_ferias, show it
      if (req.benefit_type !== 'alteracao_ferias') {
        return true;
      }
      // If alteracao_ferias is closed (aprovada/recusada), show it
      if (req.status === 'aprovada' || req.status === 'recusada') {
        return true;
      }
      // If HR has approved, show it
      if (req.hr_status === 'aprovada') {
        return true;
      }
      // Otherwise, hide it (pending HR approval)
      return false;
    });
  }

  return requestsWithProfiles;
};

export const useBenefitRequests = (allowedModules: string[] | null = null, userRole: string | null = null) => {
  const queryClient = useQueryClient();

  // Normalize queryKey to prevent unnecessary refetches when array order changes
  const normalizedModules = allowedModules ? [...allowedModules].sort() : null;

  const query = useQuery({
    queryKey: ['benefit-requests', normalizedModules, userRole],
    queryFn: () => fetchBenefitRequests(allowedModules, userRole),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  // Use ref to track current queryKey for realtime updates
  const queryKeyRef = useRef(['benefit-requests', normalizedModules, userRole]);
  queryKeyRef.current = ['benefit-requests', normalizedModules, userRole];

  // Realtime subscription - uses ref to always have current queryKey
  useEffect(() => {
    const channel = supabase
      .channel('benefit-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'benefit_requests',
        },
        async (payload) => {
          console.log('Realtime event:', payload.eventType, 'queryKey:', queryKeyRef.current);
          
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as any;
            
            // Check if this benefit type is allowed for current user
            const currentModules = queryKeyRef.current[1] as string[] | null;
            if (currentModules !== null && !currentModules.includes(newRequest.benefit_type)) {
              console.log('Skipping INSERT - benefit type not in allowed modules');
              return;
            }
            
            // Fetch the new request with profile data
            const { data: profileData } = await supabase
              .from('profiles')
              .select('user_id, full_name, cpf, phone, unit_id, unit:units(name)')
              .eq('user_id', newRequest.user_id)
              .maybeSingle();

            const requestWithProfile = {
              ...newRequest,
              profile: profileData || null,
            };

            // Add to new requests set for highlight animation
            newRequestIdsStore.add(newRequest.id);
            
            // Auto-remove from highlight after 3 seconds
            setTimeout(() => {
              newRequestIdsStore.delete(newRequest.id);
            }, 3000);

            // Update cache with correct queryKey
            queryClient.setQueryData<BenefitRequest[]>(queryKeyRef.current, (old) => {
              if (!old) return [requestWithProfile];
              if (old.some(r => r.id === newRequest.id)) return old;
              return [requestWithProfile, ...old];
            });

            toast.info('Nova solicitação recebida!', {
              description: `Protocolo: ${newRequest.protocol}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as any;
            
            queryClient.setQueryData<BenefitRequest[]>(queryKeyRef.current, (old) => {
              if (!old) return old;
              return old.map((r) =>
                r.id === updatedRequest.id
                  ? { ...r, ...updatedRequest }
                  : r
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            
            queryClient.setQueryData<BenefitRequest[]>(queryKeyRef.current, (old) => {
              if (!old) return old;
              return old.filter((r) => r.id !== deletedId);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BenefitRequest> }) => {
      const { data, error } = await supabase
        .from('benefit_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<BenefitRequest[]>(['benefit-requests', normalizedModules, userRole], (old) => {
        if (!old) return old;
        return old.map((r) => (r.id === data.id ? { ...r, ...data } : r));
      });
    },
  });

  const updateLocalRequest = useCallback((id: string, updates: Partial<BenefitRequest>) => {
    queryClient.setQueryData<BenefitRequest[]>(['benefit-requests', normalizedModules, userRole], (old) => {
      if (!old) return old;
      return old.map((r) => (r.id === id ? { ...r, ...updates } : r));
    });
  }, [queryClient, normalizedModules, userRole]);

  return {
    requests: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateRequest: updateRequestMutation.mutateAsync,
    updateLocalRequest,
  };
};

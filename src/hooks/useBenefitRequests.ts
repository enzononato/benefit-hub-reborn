import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BenefitStatus, BenefitType } from '@/types/benefits';
import { toast } from 'sonner';

export interface BenefitRequest {
  id: string;
  protocol: string;
  user_id: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  details: string | null;
  requested_value: number | null;
  created_at: string;
  closed_at?: string | null;
  pdf_url?: string | null;
  pdf_file_name?: string | null;
  rejection_reason?: string | null;
  closing_message?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
  account_id?: number | null;
  conversation_id?: number | null;
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

const fetchBenefitRequests = async (allowedModules: string[] | null): Promise<BenefitRequest[]> => {
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

  const requestsWithProfiles = (requestsData || []).map(req => ({
    ...req,
    profile: profilesMap.get(req.user_id) || null
  }));

  return requestsWithProfiles as BenefitRequest[];
};

export const useBenefitRequests = (allowedModules: string[] | null = null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['benefit-requests', allowedModules],
    queryFn: () => fetchBenefitRequests(allowedModules),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  // Realtime subscription
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
          console.log('Realtime event:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the new request with profile data
            const newRequest = payload.new as any;
            const { data: profileData } = await supabase
              .from('profiles')
              .select('user_id, full_name, cpf, phone, unit_id, unit:units(name)')
              .eq('user_id', newRequest.user_id)
              .maybeSingle();

            const requestWithProfile = {
              ...newRequest,
              profile: profileData || null,
            };

            queryClient.setQueryData<BenefitRequest[]>(['benefit-requests'], (old) => {
              if (!old) return [requestWithProfile];
              // Check if already exists
              if (old.some(r => r.id === newRequest.id)) return old;
              return [requestWithProfile, ...old];
            });

            toast.info('Nova solicitação recebida!', {
              description: `Protocolo: ${newRequest.protocol}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as any;
            
            queryClient.setQueryData<BenefitRequest[]>(['benefit-requests'], (old) => {
              if (!old) return old;
              return old.map((r) =>
                r.id === updatedRequest.id
                  ? { ...r, ...updatedRequest }
                  : r
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            
            queryClient.setQueryData<BenefitRequest[]>(['benefit-requests'], (old) => {
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
      queryClient.setQueryData<BenefitRequest[]>(['benefit-requests'], (old) => {
        if (!old) return old;
        return old.map((r) => (r.id === data.id ? { ...r, ...data } : r));
      });
    },
  });

  const updateLocalRequest = (id: string, updates: Partial<BenefitRequest>) => {
    queryClient.setQueryData<BenefitRequest[]>(['benefit-requests'], (old) => {
      if (!old) return old;
      return old.map((r) => (r.id === id ? { ...r, ...updates } : r));
    });
  };

  return {
    requests: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateRequest: updateRequestMutation.mutateAsync,
    updateLocalRequest,
  };
};

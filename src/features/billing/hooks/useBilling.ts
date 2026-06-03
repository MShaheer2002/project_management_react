import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { billingService } from '../services/billingService';

export const billingQueryKeys = {
  all: ['billing'] as const,
  subscription: (workspaceId?: string) => ['billing', 'subscription', workspaceId] as const,
  paymentStatus: (workspaceId?: string) => ['billing', 'payment-status', workspaceId] as const,
  paymentMethods: (workspaceId?: string) => ['billing', 'payment-methods', workspaceId] as const,
  invoices: (workspaceId?: string) => ['billing', 'invoices', workspaceId] as const,
};

export const useSubscription = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: billingQueryKeys.subscription(workspaceId),
    queryFn: billingService.getSubscription,
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
};

export const usePaymentStatus = (enabled = false) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: billingQueryKeys.paymentStatus(workspaceId),
    queryFn: billingService.getPaymentStatus,
    enabled: !!workspaceId && enabled,
    refetchInterval: false,
  });
};

export const usePaymentMethods = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: billingQueryKeys.paymentMethods(workspaceId),
    queryFn: billingService.getPaymentMethods,
    enabled: !!workspaceId,
  });
};

export const useInvoices = () => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: billingQueryKeys.invoices(workspaceId),
    queryFn: billingService.getInvoices,
    enabled: !!workspaceId,
  });
};

export const useCreateSubscription = () => {
  return useMutation({
    mutationFn: (plan: 'STANDARD' | 'PREMIUM') => billingService.createSubscription(plan),
  });
};

export const useChangePlan = () => {
  return useMutation({
    mutationFn: (plan: 'STANDARD' | 'PREMIUM') => billingService.changePlan(plan),
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useMutation({
    mutationFn: () => billingService.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.subscription(workspaceId) });
    },
  });
};

export const useCreateSetupIntent = () => {
  return useMutation({
    mutationFn: () => billingService.createSetupIntent(),
  });
};

export const useAttachPaymentMethod = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useMutation({
    mutationFn: (paymentMethodId: string) => billingService.attachPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.paymentMethods(workspaceId) });
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useMutation({
    mutationFn: (paymentMethodId: string) => billingService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.paymentMethods(workspaceId) });
    },
  });
};

export const useRemovePaymentMethod = () => {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useMutation({
    mutationFn: (id: string) => billingService.removePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.paymentMethods(workspaceId) });
    },
  });
};

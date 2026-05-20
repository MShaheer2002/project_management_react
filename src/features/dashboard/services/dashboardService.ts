import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { DashboardData } from '../types';

export const dashboardService = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await privateApi.get<ApiResponse<DashboardData>>('/dashboard');
    return data.data;
  },
};

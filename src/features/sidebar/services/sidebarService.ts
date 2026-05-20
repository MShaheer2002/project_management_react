import { privateApi } from '@shared/services/privateApi';
import type { ApiResponse } from '@shared/services/types';
import type { SidebarData } from '../types';

export const sidebarService = {
  getSidebar: async (): Promise<SidebarData> => {
    const { data } = await privateApi.get<ApiResponse<SidebarData>>('/sidebar');
    return data.data;
  },
};

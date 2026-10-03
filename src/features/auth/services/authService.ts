import axios from 'axios';
import { tunnelHeaders } from '@shared/services/tunnelHeaders';
import type { ApiResponse } from '@shared/services/types';

export interface BackendUserResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export const authService = {
  getMe: async (token: string): Promise<BackendUserResponse> => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    const { data } = await axios.get<ApiResponse<BackendUserResponse>>(`${baseUrl}/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...tunnelHeaders,
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });
    return data.data;
  },
};

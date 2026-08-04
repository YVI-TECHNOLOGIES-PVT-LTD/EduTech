export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  errors?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

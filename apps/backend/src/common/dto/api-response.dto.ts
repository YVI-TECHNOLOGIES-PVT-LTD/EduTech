export interface MetaResponse {
  requestId?: string;
  timestamp: string;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: MetaResponse;
}

export interface PagedResponse<T = any> extends ApiResponse<T[]> {
  meta: MetaResponse & {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

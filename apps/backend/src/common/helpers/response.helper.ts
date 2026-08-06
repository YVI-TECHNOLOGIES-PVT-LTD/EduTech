import { ApiResponse, PagedResponse, ErrorResponse } from '../dto/api-response.dto';

export class ResponseHelper {
  public static success<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  public static paged<T>(
    items: T[],
    page: number,
    pageSize: number,
    totalCount: number,
    message?: string,
  ): PagedResponse<T> {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    return {
      success: true,
      data: items,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  }

  public static error(
    errors: Array<{ code: string; message: string; field?: string }>,
    message = 'Request failed',
    requestId?: string,
  ): ErrorResponse {
    return {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }
}

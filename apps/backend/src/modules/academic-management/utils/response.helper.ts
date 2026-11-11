import { Response } from 'express';

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  requestId?: string;
  [key: string]: any;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}

export class ResponseHelper {
  static sendSuccess<T>(
    res: Response,
    data: T,
    meta?: ApiResponseMeta,
    statusCode: number = 200,
  ): Response {
    const requestId = (res.req?.headers['x-request-id'] as string) || undefined;
    const responsePayload: ApiSuccessResponse<T> = {
      success: true,
      data,
      meta: {
        ...(requestId ? { requestId } : {}),
        ...(meta || {}),
      },
    };
    return res.status(statusCode).json(responsePayload);
  }

  static sendError(
    res: Response,
    message: string,
    statusCode: number = 400,
    code: string = 'ACADEMIC_ERROR',
    details?: any,
  ): Response {
    const requestId = (res.req?.headers['x-request-id'] as string) || undefined;
    const responsePayload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      ...(requestId ? { requestId } : {}),
    };
    return res.status(statusCode).json(responsePayload);
  }
}

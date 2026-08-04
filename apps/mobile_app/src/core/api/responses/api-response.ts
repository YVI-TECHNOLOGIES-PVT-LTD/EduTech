export interface BaseApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

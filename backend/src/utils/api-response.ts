export type ApiSuccess<TData> = {
  success: true;
  data: TData;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function successResponse<TData>(data: TData): ApiSuccess<TData> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code: string, message: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

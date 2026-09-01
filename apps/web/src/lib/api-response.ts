import { NextResponse } from 'next/server'

// Standardized API response utilities for consistency across endpoints

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse<T>)
}

export function errorResponse(
  error: string | Error,
  statusCode: number = 500,
  code?: string
): NextResponse {
  const message = error instanceof Error ? error.message : error
  return NextResponse.json({
    success: false,
    error: message,
    code,
    meta: {
      timestamp: new Date().toISOString()
    }
  } as ApiResponse, { status: statusCode })
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, 401, 'UNAUTHORIZED')
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, 403, 'FORBIDDEN')
}

export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return errorResponse(message, 404, 'NOT_FOUND')
}

export function badRequestResponse(message: string = 'Bad request'): NextResponse {
  return errorResponse(message, 400, 'BAD_REQUEST')
}

export function validationErrorResponse(message: string = 'Validation failed'): NextResponse {
  return errorResponse(message, 422, 'VALIDATION_ERROR')
}

export function serverErrorResponse(message: string = 'Internal server error'): NextResponse {
  return errorResponse(message, 500, 'SERVER_ERROR')
}
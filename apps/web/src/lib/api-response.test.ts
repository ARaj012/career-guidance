import { describe, it, expect } from 'vitest'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse,
  serverErrorResponse,
  ApiError,
} from './api-response'

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should return a successful response with data', async () => {
      const data = { id: 1, name: 'Test' }
      const response = successResponse(data, 'Success message')

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        success: true,
        data,
        message: 'Success message',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should return success without message', async () => {
      const data = { id: 1 }
      const response = successResponse(data)

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('errorResponse', () => {
    it('should return error response with string', async () => {
      const response = errorResponse('Error message', 400, 'BAD_REQUEST')

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Error message',
        code: 'BAD_REQUEST',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should return error response with Error object', async () => {
      const error = new Error('Test error')
      const response = errorResponse(error, 500)

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Test error',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should default to 500 status code', () => {
      const response = errorResponse('Error')

      expect(response.status).toBe(500)
    })
  })

  describe('unauthorizedResponse', () => {
    it('should return 401 unauthorized response', async () => {
      const response = unauthorizedResponse('Custom message')

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Custom message',
        code: 'UNAUTHORIZED',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })

    it('should use default message', async () => {
      const response = unauthorizedResponse()

      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('forbiddenResponse', () => {
    it('should return 403 forbidden response', async () => {
      const response = forbiddenResponse()

      expect(response.status).toBe(403)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Forbidden',
        code: 'FORBIDDEN',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('notFoundResponse', () => {
    it('should return 404 not found response', async () => {
      const response = notFoundResponse()

      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('badRequestResponse', () => {
    it('should return 400 bad request response', async () => {
      const response = badRequestResponse()

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Bad request',
        code: 'BAD_REQUEST',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('validationErrorResponse', () => {
    it('should return 422 validation error response', async () => {
      const response = validationErrorResponse()

      expect(response.status).toBe(422)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('serverErrorResponse', () => {
    it('should return 500 server error response', async () => {
      const response = serverErrorResponse()

      expect(response.status).toBe(500)
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        meta: {
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('ApiError', () => {
    it('should create ApiError with message and status', () => {
      const error = new ApiError('Not found', 404, 'NOT_FOUND')

      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.name).toBe('ApiError')
    })

    it('should default to 500 status code', () => {
      const error = new ApiError('Error')

      expect(error.statusCode).toBe(500)
      expect(error.code).toBeUndefined()
    })
  })
})

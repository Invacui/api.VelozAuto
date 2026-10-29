/**
 * @file apiResponse.test.ts
 * @description Unit tests for the standard response envelope + pagination math.
 */
import {
  successResponse,
  createdResponse,
  errorResponse,
  buildPagination,
} from '../../utils/apiResponse';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('apiResponse', () => {
  it('successResponse uses 200 by default and the envelope shape', () => {
    const res = mockRes();
    successResponse(res, { id: 1 }, 'OK');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { id: 1 } });
  });
  it('createdResponse uses 201', () => {
    const res = mockRes();
    createdResponse(res, { id: 2 }, 'Created');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Created', data: { id: 2 } });
  });
  it('errorResponse uses the given status code and success:false', () => {
    const res = mockRes();
    errorResponse(res, 'Not found', 404, 'err', ['bad']);
    const arg = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(404);
    expect(arg.success).toBe(false);
    expect(arg.message).toBe('Not found');
    expect(arg.error).toBe('err');
    expect(arg.errors).toEqual(['bad']);
  });
});

describe('buildPagination', () => {
  it('computes pages, hasNext and hasPrev correctly', () => {
    const meta = buildPagination(2, 10, 25);
    expect(meta).toMatchObject({ page: 2, limit: 10, totalItems: 25, totalPages: 3, hasNextPage: true, hasPrevPage: true });
  });
  it('handles the first page', () => {
    const meta = buildPagination(1, 12, 100);
    expect(meta.hasPrevPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.totalPages).toBe(9);
  });
  it('handles empty results (totalPages falls back to 1)', () => {
    const meta = buildPagination(1, 10, 0);
    expect(meta.totalItems).toBe(0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
  });
});

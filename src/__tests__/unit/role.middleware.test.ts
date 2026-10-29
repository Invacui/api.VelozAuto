/**
 * @file role.middleware.test.ts
 * @description Unit tests for the RBAC role middleware.
 */
import { requireRole } from '../../middleware/role.middleware';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireRole', () => {
  it('401s when there is no authenticated user', () => {
    const req: any = {};
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('403s when the role is not allowed', () => {
    const req: any = { user: { id: 'u1', role: 'USER' } };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN', 'EMPLOYEE')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when the role is allowed', () => {
    const req: any = { user: { id: 'u2', role: 'EMPLOYEE' } };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN', 'EMPLOYEE')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

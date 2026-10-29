/**
 * @file api.test.ts
 * @description End-to-end integration tests against the Express app, backed by
 *              an in-memory MongoDB. Covers auth, vehicle CRUD + filters,
 *              buy-request duplicate guard, sell-request pipeline + convert,
 *              and RBAC on admin routes.
 */
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;
let app: any;
let User: any;

const API = '/api/v1';
let adminToken = '';
let adminRefreshToken = '';
let userToken = '';
let vehicleId = '';
let vehicleSlug = '';

let brandId = '';

const validVehicleBody = (over: Record<string, any> = {}) => ({
  category: 'PASSENGER_CAR',
  usageType: 'PRIVATE',
  brand: brandId,
  brandName: 'Maruti Suzuki',
  model: 'Swift',
  variant: 'VXi',
  manufacturingYear: 2019,
  fuelType: 'PETROL',
  transmission: 'MANUAL',
  ownerCount: '1ST',
  kmDriven: 42000,
  price: 495000,
  registrationState: 'Delhi',
  locationState: 'Delhi',
  locationCity: 'Delhi',
  locationPincode: '110001',
  roadTax: 'LIFETIME', accidentHistory: 'NONE', tyreCondition: 'GOOD',
  status: 'ACTIVE',
  images: [{ url: 'https://example.com/a.jpg', tag: 'FRONT', isPrimary: true }],
  ...over,
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'vm-test' });
  // Import app AFTER mongoose is connected (avoids any side effects).
  app = (await import('../../app')).default;
  User = (await import('../../models/User.model')).default;
  const Brand = (await import('../../models/Brand.model')).default;

  await User.create({ name: 'Admin', email: 'admin@velozauto.in', passwordHash: 'Admin@123', role: 'ADMIN', phone: '9000000001' });
  const brand = await Brand.create({ name: 'Maruti Suzuki', slug: 'maruti-suzuki', categories: ['PASSENGER_CAR'], isActive: true });
  brandId = String(brand._id);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Health & docs', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  it('GET /api-docs.json serves the OpenAPI spec', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(50);
  });
  it('GET /sitemap.xml returns an XML urlset', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('<urlset');
  });
});

describe('Auth', () => {
  it('registers a new user and returns an access token', async () => {
    const res = await request(app).post(`${API}/auth/register`).send({ name: 'Asha Rao', email: 'asha@vehiclemarket.in', password: 'Secret12' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    userToken = res.body.data.accessToken;
  });

  it('rejects an invalid registration payload (400)', async () => {
    const res = await request(app).post(`${API}/auth/register`).send({ name: 'X', email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in the admin', async () => {
    const res = await request(app).post(`${API}/auth/login`).send({ email: 'admin@velozauto.in', password: 'Admin@123' });
    expect(res.status).toBe(200);
    adminToken = res.body.data.accessToken;
    adminRefreshToken = res.body.data.refreshToken;
    expect(adminRefreshToken).toBeTruthy();
  });

  it('returns a rotated refresh token and invalidates the old one', async () => {
    const first = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: adminRefreshToken });
    expect(first.status).toBe(200);
    expect(first.body.data.refreshToken).toBeTruthy();
    expect(first.body.data.refreshToken).not.toBe(adminRefreshToken);

    const reusedOld = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: adminRefreshToken });
    expect(reusedOld.status).toBe(401);

    const second = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: first.body.data.refreshToken });
    expect(second.status).toBe(200);
    expect(second.body.data.accessToken).toBeTruthy();
  });

  it('logs in the admin with a mobile number', async () => {
    const res = await request(app).post(`${API}/auth/login`).send({ phone: '9000000001', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@velozauto.in');
  });

  it('rejects a wrong password (401)', async () => {
    const res = await request(app).post(`${API}/auth/login`).send({ email: 'admin@velozauto.in', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('GET /auth/me requires authentication (401)', async () => {
    expect((await request(app).get(`${API}/auth/me`)).status).toBe(401);
  });

  it('GET /auth/me returns the current user', async () => {
    const res = await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('asha@vehiclemarket.in');
  });

  it('requires a credential for Google sign-in (400)', async () => {
    const res = await request(app).post(`${API}/auth/google`).send({});
    expect(res.status).toBe(400);
  });

  it('sends a phone OTP and verifies it', async () => {
    const send = await request(app)
      .post(`${API}/auth/phone/send-otp`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ phone: '9876500001' });

    expect(send.status).toBe(200);
    expect(send.body.data.phone).toBe('9876500001');
    expect(send.body.data.devCode).toMatch(/^\d{6}$/);

    const wrong = await request(app)
      .post(`${API}/auth/phone/verify-otp`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: send.body.data.devCode === '000000' ? '111111' : '000000' });
    expect(wrong.status).toBe(400);

    const verify = await request(app)
      .post(`${API}/auth/phone/verify-otp`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: send.body.data.devCode });

    expect(verify.status).toBe(200);
    expect(verify.body.data.phoneVerified).toBe(true);

    const already = await request(app)
      .post(`${API}/auth/phone/send-otp`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(already.status).toBe(200);
    expect(already.body.data.alreadyVerified).toBe(true);
  });
});

describe('Vehicles (admin CRUD + public reads)', () => {
  it('creates a vehicle as admin (201)', async () => {
    const res = await request(app).post(`${API}/vehicles`).set('Authorization', `Bearer ${adminToken}`).send(validVehicleBody());
    expect(res.status).toBe(201);
    vehicleId = res.body.data.id;
    vehicleSlug = res.body.data.slug;
    expect(vehicleSlug).toBeTruthy();
  });

  it('forbids a normal user from creating a vehicle (403)', async () => {
    const res = await request(app).post(`${API}/vehicles`).set('Authorization', `Bearer ${userToken}`).send(validVehicleBody());
    expect(res.status).toBe(403);
  });

  it('lists vehicles publicly', async () => {
    const res = await request(app).get(`${API}/vehicles`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters vehicles by category', async () => {
    const res = await request(app).get(`${API}/vehicles?category=PASSENGER_CAR`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((v: any) => v.category === 'PASSENGER_CAR')).toBe(true);
  });

  it('gets a vehicle by slug', async () => {
    const res = await request(app).get(`${API}/vehicles/slug/${vehicleSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(vehicleSlug);
  });

  it('updates vehicle status as admin', async () => {
    const res = await request(app).patch(`${API}/vehicles/${vehicleId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'RESERVED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RESERVED');
  });
});

describe('Buy requests (public + duplicate guard)', () => {
  it('creates a buy request as a guest (201)', async () => {
    const res = await request(app).post(`${API}/buy-requests`).send({ vehicle: vehicleId, name: 'Rahul', phone: '9876543210' });
    expect(res.status).toBe(201);
  });

  it('rejects a duplicate within the window (409)', async () => {
    const res = await request(app).post(`${API}/buy-requests`).send({ vehicle: vehicleId, name: 'Rahul', phone: '9876543210' });
    expect(res.status).toBe(409);
  });

  it('lists buy requests for admins', async () => {
    const res = await request(app).get(`${API}/buy-requests`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Sell requests (public submit + pipeline + convert)', () => {
  let sellId = '';
  const sellBody = () => ({
    name: 'Priya', phone: '9876500001', city: 'Pune', pincode: '411001', expectedPrice: 480000,
    category: 'PASSENGER_CAR', usageType: 'PRIVATE', brand: brandId, brandName: 'Maruti Suzuki', model: 'Baleno', manufacturingYear: 2020,
    fuelType: 'PETROL', transmission: 'MANUAL', kmDriven: 30000, ownerCount: '1ST',
    registrationState: 'Maharashtra', insuranceType: 'COMPREHENSIVE', loanStatus: 'NO_LOAN',
    accidentHistory: 'NONE', tyreCondition: 'GOOD',
  });

  it('creates a sell request as a guest (201)', async () => {
    const res = await request(app).post(`${API}/sell-requests`).send(sellBody());
    expect(res.status).toBe(201);
    sellId = res.body.data._id;
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  it('tracks by phone publicly', async () => {
    const res = await request(app).get(`${API}/sell-requests/track?phone=9876500001`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('advances the pipeline as admin', async () => {
    const res = await request(app).patch(`${API}/sell-requests/${sellId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'UNDER_REVIEW' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
  });

  it('converts the sell request into a listing (201)', async () => {
    const res = await request(app).post(`${API}/sell-requests/${sellId}/convert`).set('Authorization', `Bearer ${adminToken}`).send({ override: { price: 500000, status: 'ACTIVE' } });
    expect(res.status).toBe(201);
    expect(res.body.data.vehicle.price).toBe(500000);
    expect(res.body.data.vehicle.status).toBe('ACTIVE');
    expect(res.body.data.sellRequest.status).toBe('LISTED');
    expect(res.body.data.slug).toBeTruthy();
  });

  it('requires a price to convert (422)', async () => {
    const created = await request(app).post(`${API}/sell-requests`).send({ ...sellBody(), phone: '9876500002' });
    const res = await request(app).post(`${API}/sell-requests/${created.body.data._id}/convert`).set('Authorization', `Bearer ${adminToken}`).send({ override: {} });
    expect(res.status).toBe(422);
  });
});

describe('RBAC on admin routes', () => {
  it('forbids a normal user from the dashboard (403)', async () => {
    const res = await request(app).get(`${API}/admin/dashboard`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
  it('allows an admin to read the dashboard (200)', async () => {
    const res = await request(app).get(`${API}/admin/dashboard`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.vehicles).toBeDefined();
  });
});

describe('Vendor employee RBAC', () => {
  let employeeToken = '';
  let employeeVehicleId = '';

  beforeAll(async () => {
    await User.create({
      name: 'Vendor One',
      email: 'vendor@velozauto.in',
      phone: '9876500010',
      passwordHash: 'Vendor@123',
      role: 'EMPLOYEE',
      isVendor: true,
      companyName: 'Velo Motors',
    });
    const login = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'vendor@velozauto.in', password: 'Vendor@123' });
    expect(login.status).toBe(200);
    expect(login.body.data.user.isVendor).toBe(true);
    expect(login.body.data.user.companyName).toBe('Velo Motors');
    employeeToken = login.body.data.accessToken;
  });

  it('lets an employee create a vehicle and exposes posted-by to admins', async () => {
    const created = await request(app)
      .post(`${API}/vehicles`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send(validVehicleBody({ model: 'Vendor Sedan' }));
    expect(created.status).toBe(201);
    employeeVehicleId = created.body.data.id;

    const employeeList = await request(app)
      .get(`${API}/vehicles/admin/all?limit=50`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(employeeList.status).toBe(200);
    expect(employeeList.body.data).toHaveLength(1);
    expect(employeeList.body.data[0].id).toBe(employeeVehicleId);

    const adminList = await request(app)
      .get(`${API}/vehicles/admin/all?limit=50`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminList.status).toBe(200);
    const posted = adminList.body.data.find((v: any) => v.id === employeeVehicleId);
    expect(posted).toBeDefined();
    expect(posted.postedBy.companyName).toBe('Velo Motors');
    expect(posted.postedBy.isVendor).toBe(true);
  });

  it('blocks an employee from another vendor vehicle and admin-only modules', async () => {
    const otherVehicle = await request(app)
      .get(`${API}/vehicles/admin/${vehicleId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(otherVehicle.status).toBe(403);

    const users = await request(app).get(`${API}/admin/users`).set('Authorization', `Bearer ${employeeToken}`);
    expect(users.status).toBe(403);
    const buyRequests = await request(app).get(`${API}/buy-requests`).set('Authorization', `Bearer ${employeeToken}`);
    expect(buyRequests.status).toBe(403);
    const notifications = await request(app).get(`${API}/admin/notifications`).set('Authorization', `Bearer ${employeeToken}`);
    expect(notifications.status).toBe(403);
  });

  it('requires a company name when promoting a user to vendor employee', async () => {
    const asha = await User.findOne({ email: 'asha@vehiclemarket.in' });
    const id = String(asha._id);

    const missingCompany = await request(app)
      .patch(`${API}/admin/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'EMPLOYEE', isVendor: true });
    expect(missingCompany.status).toBe(422);

    const promoted = await request(app)
      .patch(`${API}/admin/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'EMPLOYEE', isVendor: true, companyName: 'Asha Cars' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.data.role).toBe('EMPLOYEE');
    expect(promoted.body.data.isVendor).toBe(true);
    expect(promoted.body.data.companyName).toBe('Asha Cars');
  });
});

describe('404 handling', () => {
  it('returns a 404 envelope for unknown routes', async () => {
    const res = await request(app).get(`${API}/does-not-exist`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

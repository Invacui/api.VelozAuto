/**
 * @file generateOpenapi.js
 * @description Builds the OpenAPI 3.0.3 spec for the VehicleMarket API and
 *              writes it to docs/openapi.json. Run: `node scripts/generateOpenapi.js`.
 * @author VehicleMarket Backend
 */
'use strict';
const fs = require('fs');
const path = require('path');

const API = '/api/v1';

// ---------- reusable builders ----------
const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const jsonBody = (schema, required) => ({
  required: !!required,
  content: { 'application/json': { schema } },
});
const multipartBody = (schema, required) => ({
  required: !!required,
  content: { 'multipart/form-data': { schema } },
});
const param = (name, where, opts = {}) => ({
  name, in: where, required: opts.required ?? false,
  schema: opts.schema || { type: 'string' },
  description: opts.description || '',
  ...(opts.example ? { example: opts.example } : {}),
});
const idParam = (name = 'id') => param(name, 'path', { required: true, schema: { type: 'string' }, description: 'Mongo ObjectId' });
const pageParams = [
  param('page', 'query', { schema: { type: 'integer', minimum: 1, default: 1 } }),
  param('limit', 'query', { schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 } }),
];
const sortParam = param('sort', 'query', { schema: { type: 'string' }, description: 'Sort key, e.g. -createdAt, price_asc, price_desc, kmDriven_asc, manufacturingYear_desc' });

function ok(schemaName, { array = false, message = 'Success', paginated = false } = {}) {
  const data = array ? { type: 'array', items: ref(schemaName) } : ref(schemaName);
  const props = {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message },
    data,
  };
  if (paginated) props.pagination = ref('PaginationMeta');
  return {
    description: 'Success',
    content: { 'application/json': { schema: { type: 'object', properties: props } } },
  };
}
function okWrap(schema, description = 'Success') {
  return { description, content: { 'application/json': { schema } } };
}
const created = (schemaName) => ({
  description: 'Created',
  content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Created successfully' }, data: ref(schemaName) } } } },
});
const errs = {
  400: { description: 'Validation error', content: { 'application/json': { schema: ref('ErrorResponse') } } },
  401: { description: 'Unauthenticated', content: { 'application/json': { schema: ref('ErrorResponse') } } },
  403: { description: 'Forbidden (insufficient role)', content: { 'application/json': { schema: ref('ErrorResponse') } } },
  404: { description: 'Not found', content: { 'application/json': { schema: ref('ErrorResponse') } } },
  409: { description: 'Conflict (duplicate)', content: { 'application/json': { schema: ref('ErrorResponse') } } },
  500: { description: 'Server error', content: { 'application/json': { schema: ref('ErrorResponse') } } },
};
const E = (...codes) => codes.reduce((o, c) => ({ ...o, [c]: errs[c] }), {});
const bearer = [{ bearerAuth: [] }];
const publicReq = [];

// ---------- paths ----------
const paths = {};

// ===== Auth =====
paths[`${API}/auth/register`] = { post: {
  tags: ['Auth'], summary: 'Register a new user', security: publicReq,
  requestBody: jsonBody(ref('RegisterInput'), true),
  responses: { 201: created('AuthResult'), ...E(409, 500) },
}};
paths[`${API}/auth/login`] = { post: {
  tags: ['Auth'], summary: 'Login with email and password (optional phone to store/update)', security: publicReq,
  requestBody: jsonBody(ref('LoginInput'), true),
  responses: { 200: ok('AuthResult'), ...E(401, 403, 500) },
}};
paths[`${API}/auth/google`] = { post: {
  tags: ['Auth'], summary: 'Sign in or register with Google Identity Services', security: publicReq,
  requestBody: jsonBody(ref('GoogleSignInInput'), true),
  responses: { 200: ok('AuthResult'), ...E(400, 401, 403, 500) },
}};
paths[`${API}/auth/phone/send-otp`] = { post: {
  tags: ['Auth'], summary: 'Send WhatsApp OTP for phone verification (authenticated)', security: bearer,
  requestBody: jsonBody(ref('SendPhoneOtpInput'), true),
  responses: { 200: okWrap(ref('SendPhoneOtpResult')), ...E(400, 401, 409, 429, 500, 502, 503) },
}};
paths[`${API}/auth/phone/verify-otp`] = { post: {
  tags: ['Auth'], summary: 'Verify WhatsApp OTP (authenticated)', security: bearer,
  requestBody: jsonBody(ref('VerifyPhoneOtpInput'), true),
  responses: { 200: ok('User'), ...E(400, 401, 429, 500) },
}};
paths[`${API}/auth/refresh`] = { post: {
  tags: ['Auth'], summary: 'Refresh access token (body or vm_refresh cookie)', security: publicReq,
  requestBody: jsonBody(ref('RefreshInput')),
  responses: { 200: ok('AuthResult', { message: 'Token refreshed' }), ...E(401, 500) },
}};
paths[`${API}/auth/logout`] = { post: {
  tags: ['Auth'], summary: 'Log out (blacklists access token, clears refresh cookie)', security: bearer,
  responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 500) },
}};
paths[`${API}/auth/forgot-password`] = { post: {
  tags: ['Auth'], summary: 'Request a password-reset email', security: publicReq,
  requestBody: jsonBody(ref('ForgotPasswordInput'), true),
  responses: { 200: okWrap(ref('MessageOnly')), ...E(400, 500) },
}};
paths[`${API}/auth/reset-password`] = { post: {
  tags: ['Auth'], summary: 'Reset password using email token', security: publicReq,
  requestBody: jsonBody(ref('ResetPasswordInput'), true),
  responses: { 200: okWrap(ref('MessageOnly')), ...E(400, 500) },
}};
paths[`${API}/auth/me`] = {
  get: { tags: ['Auth'], summary: 'Get the current authenticated user', security: bearer, responses: { 200: ok('User'), ...E(401, 500) } },
  patch: { tags: ['Auth'], summary: 'Update current user profile (name, phone)', security: bearer, requestBody: jsonBody(ref('UpdateProfileInput'), true), responses: { 200: ok('User'), ...E(400, 401, 500) } },
};
paths[`${API}/auth/verify-email/:token`] = { get: {
  tags: ['Auth'], summary: 'Verify an email address using the emailed token', security: publicReq,
  parameters: [param('token', 'path', { required: true, schema: { type: 'string' } })],
  responses: { 200: ok('User'), ...E(400, 404, 500) },
}};
paths[`${API}/auth/resend-verification`] = { post: {
  tags: ['Auth'], summary: 'Resend the email-verification link to the current user', security: bearer,
  responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 500) },
}};
paths[`${API}/auth/me/password`] = { patch: {
  tags: ['Auth'], summary: 'Change current user password', security: bearer,
  requestBody: jsonBody(ref('ChangePasswordInput'), true),
  responses: { 200: okWrap(ref('MessageOnly')), ...E(400, 401, 500) },
}};
paths[`${API}/auth/me/profile-image`] = { post: {
  tags: ['Auth'], summary: 'Upload / replace profile image', security: bearer,
  requestBody: multipartBody({ type: 'object', properties: { photo: { type: 'string', format: 'binary' } } }, true),
  responses: { 200: ok('User'), ...E(400, 401, 500) },
}};

// ===== Vehicles =====
paths[`${API}/vehicles`] = {
  get: {
    tags: ['Vehicles'], summary: 'Search vehicles (public; filters, sort, pagination)', security: publicReq,
    parameters: [
      param('q', 'query', { description: 'Free-text search (brand, model, variant, city)' }),
      param('category', 'query', { schema: { type: 'string', enum: ['TWO_WHEELER','THREE_WHEELER','PASSENGER_CAR','COMMERCIAL','CARAVAN_MOTORHOME'] } }),
      param('usageType', 'query', { schema: { type: 'string', enum: ['PRIVATE','COMMERCIAL'] } }),
      param('subCategory', 'query', { schema: { type: 'string' } }),
      param('bodyType', 'query', { schema: { type: 'string' } }),
      param('brand', 'query', { description: 'Brand id' }),
      param('model', 'query', { schema: { type: 'string' } }),
      param('fuelType', 'query', { schema: { type: 'string' } }),
      param('transmission', 'query', { schema: { type: 'string' } }),
      param('ownerCount', 'query', { schema: { type: 'string', enum: ['1ST','2ND','3RD','4TH_PLUS'] } }),
      param('bsNorm', 'query', { schema: { type: 'string' } }),
      param('minPrice', 'query', { schema: { type: 'number' } }),
      param('maxPrice', 'query', { schema: { type: 'number' } }),
      param('minYear', 'query', { schema: { type: 'integer' } }),
      param('maxYear', 'query', { schema: { type: 'integer' } }),
      param('maxKm', 'query', { schema: { type: 'number' } }),
      param('minGvw', 'query', { schema: { type: 'number' } }),
      param('maxGvw', 'query', { schema: { type: 'number' } }),
      param('state', 'query', { schema: { type: 'string' } }),
      param('city', 'query', { schema: { type: 'string' } }),
      param('isInspected', 'query', { schema: { type: 'boolean' } }),
      param('insured', 'query', { schema: { type: 'boolean' } }),
      param('isFeatured', 'query', { schema: { type: 'boolean' } }),
      sortParam, ...pageParams,
    ],
    responses: { 200: ok('Vehicle', { array: true, paginated: true }), ...E(400, 500) },
  },
  post: {
    tags: ['Vehicles'], summary: 'Create a vehicle listing (admin/employee)', security: bearer,
    requestBody: jsonBody(ref('VehicleCreateInput'), true),
    responses: { 201: created('Vehicle'), ...E(400, 401, 403, 409, 500) },
  },
};
paths[`${API}/vehicles/featured`] = { get: {
  tags: ['Vehicles'], summary: 'List featured vehicles', security: publicReq,
  parameters: [param('limit', 'query', { schema: { type: 'integer', default: 8 } })],
  responses: { 200: ok('Vehicle', { array: true }), ...E(500) },
}};
paths[`${API}/vehicles/filters-meta`] = { get: {
  tags: ['Vehicles'], summary: 'Distinct facet values for filter UI (brands, cities, price/year ranges)', security: publicReq,
  responses: { 200: ok('FiltersMeta'), ...E(500) },
}};
paths[`${API}/vehicles/slug/:slug`] = { get: {
  tags: ['Vehicles'], summary: 'Get a public vehicle by SEO slug (increments views)', security: publicReq,
  parameters: [param('slug', 'path', { required: true })],
  responses: { 200: ok('Vehicle'), ...E(404, 500) },
}};
paths[`${API}/vehicles/:id/similar`] = { get: {
  tags: ['Vehicles'], summary: 'Similar vehicles to a given listing', security: publicReq,
  parameters: [idParam(), param('limit', 'query', { schema: { type: 'integer', default: 6 } })],
  responses: { 200: ok('Vehicle', { array: true }), ...E(404, 500) },
}};
paths[`${API}/vehicles/admin/all`] = { get: {
  tags: ['Vehicles'], summary: 'List ALL vehicles incl. DRAFT/INACTIVE (admin/employee)', security: bearer,
  parameters: [
    param('status', 'query', { schema: { type: 'string', enum: ['DRAFT','ACTIVE','RESERVED','SOLD','INACTIVE'] } }),
    param('category', 'query', { schema: { type: 'string' } }),
    param('q', 'query', { schema: { type: 'string' } }),
    sortParam, ...pageParams,
  ],
  responses: { 200: ok('Vehicle', { array: true, paginated: true }), ...E(401, 403, 500) },
}};
paths[`${API}/vehicles/admin/:id`] = { get: {
  tags: ['Vehicles'], summary: 'Get full vehicle (all legal fields) by id (admin/employee)', security: bearer,
  parameters: [idParam()],
  responses: { 200: ok('Vehicle'), ...E(401, 403, 404, 500) },
}};
paths[`${API}/vehicles/:id`] = {
  get: { tags: ['Vehicles'], summary: 'Get a public vehicle by id', security: publicReq, parameters: [idParam()], responses: { 200: ok('Vehicle'), ...E(404, 500) } },
  put: { tags: ['Vehicles'], summary: 'Update a vehicle (admin/employee)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('VehicleUpdateInput'), true), responses: { 200: ok('Vehicle'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Vehicles'], summary: 'Soft-delete a vehicle (admin/employee)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/vehicles/:id/status`] = { patch: {
  tags: ['Vehicles'], summary: 'Change vehicle status (admin/employee)', security: bearer,
  parameters: [idParam()],
  requestBody: jsonBody({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['DRAFT','ACTIVE','RESERVED','SOLD','INACTIVE'] } } }, true),
  responses: { 200: ok('Vehicle'), ...E(400, 401, 403, 404, 500) },
}};
paths[`${API}/vehicles/:id/images`] = { post: {
  tags: ['Vehicles'], summary: 'Add images to a vehicle (multipart, up to 15)', security: bearer,
  parameters: [idParam()],
  requestBody: multipartBody({ type: 'object', properties: { photo: { type: 'array', items: { type: 'string', format: 'binary' } }, tags: { type: 'string', description: 'Comma-separated image tags in order' }, primary: { type: 'string', description: 'Index of primary image' } } }, true),
  responses: { 200: ok('Vehicle'), ...E(400, 401, 403, 404, 500) },
}};
paths[`${API}/vehicles/:id/images/urls`] = { post: {
  tags: ['Vehicles'], summary: 'Add images to a vehicle by URL (admin/employee)', security: bearer,
  parameters: [idParam()],
  requestBody: jsonBody(ref('AddVehicleImagesByUrlInput'), true),
  responses: { 201: created('Vehicle'), ...E(400, 401, 403, 404, 500) },
}};
paths[`${API}/vehicles/:id/images/:imageId`] = { delete: {
  tags: ['Vehicles'], summary: 'Remove an image from a vehicle (admin/employee)', security: bearer,
  parameters: [idParam(), idParam('imageId')],
  responses: { 200: ok('Vehicle'), ...E(401, 403, 404, 500) },
}};

// ===== Buy Requests =====
paths[`${API}/buy-requests`] = {
  post: { tags: ['Buy Requests'], summary: 'Create a buy request (public; guest allowed; 24h duplicate window)', security: publicReq, requestBody: jsonBody(ref('BuyRequestCreateInput'), true), responses: { 201: created('BuyRequest'), ...E(400, 404, 409, 500) } },
  get: { tags: ['Buy Requests'], summary: 'List buy requests (admin only)', security: bearer, parameters: [
    param('status', 'query', { schema: { type: 'string', enum: ['NEW','CONTACTED','TEST_DRIVE_SCHEDULED','NEGOTIATION','CLOSED_WON','CLOSED_LOST'] } }),
    param('vehicle', 'query'), param('assignedTo', 'query'), param('q', 'query'), sortParam, ...pageParams,
  ], responses: { 200: ok('BuyRequest', { array: true, paginated: true }), ...E(401, 403, 500) } },
};
paths[`${API}/buy-requests/mine`] = { get: {
  tags: ['Buy Requests'], summary: 'List own buy requests', security: bearer,
  responses: { 200: ok('BuyRequest', { array: true }), ...E(401, 500) },
}};
paths[`${API}/buy-requests/:id`] = { get: {
  tags: ['Buy Requests'], summary: 'Get a buy request by id (admin only)', security: bearer, parameters: [idParam()],
  responses: { 200: ok('BuyRequest'), ...E(401, 403, 404, 500) },
}};
paths[`${API}/buy-requests/:id`].patch = { tags: ['Buy Requests'], summary: 'Update buy request status / assign / add note (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('BuyRequestUpdateInput'), true), responses: { 200: ok('BuyRequest'), ...E(400, 401, 403, 404, 500) } };

// ===== Sell Requests =====
paths[`${API}/sell-requests`] = {
  post: { tags: ['Sell Requests'], summary: 'Create a sell request (public; guest allowed; photos optional)', security: publicReq, requestBody: jsonBody(ref('SellRequestCreateInput'), true), responses: { 201: created('SellRequest'), ...E(400, 500) } },
  get: { tags: ['Sell Requests'], summary: 'List sell requests (admin only)', security: bearer, parameters: [
    param('status', 'query', { schema: { type: 'string', enum: ['SUBMITTED','UNDER_REVIEW','INSPECTION_SCHEDULED','INSPECTED','OFFER_MADE','ACCEPTED','REJECTED','NEGOTIATING','LISTED','CLOSED'] } }),
    param('category', 'query'), param('assignedTo', 'query'), param('q', 'query'), sortParam, ...pageParams,
  ], responses: { 200: ok('SellRequest', { array: true, paginated: true }), ...E(401, 403, 500) } },
};
paths[`${API}/sell-requests/mine`] = { get: { tags: ['Sell Requests'], summary: 'List own sell requests', security: bearer, responses: { 200: ok('SellRequest', { array: true }), ...E(401, 500) } } };
paths[`${API}/sell-requests/track`] = { get: {
  tags: ['Sell Requests'], summary: 'Track sell requests by phone (guests; internal notes stripped)', security: publicReq,
  parameters: [param('phone', 'query', { required: true, schema: { type: 'string', pattern: '^[6-9]\\d{9}$' } })],
  responses: { 200: ok('SellRequest', { array: true }), ...E(400, 500) },
}};
paths[`${API}/sell-requests/:id`] = {
  get: { tags: ['Sell Requests'], summary: 'Get a sell request by id (admin only)', security: bearer, parameters: [idParam()], responses: { 200: ok('SellRequest'), ...E(401, 403, 404, 500) } },
  patch: { tags: ['Sell Requests'], summary: 'Advance pipeline / set offer / inspection / notes (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('SellRequestUpdateInput'), true), responses: { 200: ok('SellRequest'), ...E(400, 401, 403, 404, 500) } },
};
paths[`${API}/sell-requests/:id/convert`] = { post: {
  tags: ['Sell Requests'], summary: 'Convert sell request to an ACTIVE listing (admin/employee; requires price)', security: bearer,
  parameters: [idParam()], requestBody: jsonBody(ref('SellRequestConvertInput')),
  responses: { 201: created('ConvertResult'), ...E(400, 401, 403, 404, 500) },
}};

// ===== Wishlist =====
paths[`${API}/wishlist`] = { get: { tags: ['Wishlist'], summary: 'List own wishlist', security: bearer, parameters: [...pageParams], responses: { 200: ok('Vehicle', { array: true, paginated: true }), ...E(401, 500) } } };
paths[`${API}/wishlist/:vehicleId`] = {
  post: { tags: ['Wishlist'], summary: 'Add a vehicle to wishlist', security: bearer, parameters: [idParam('vehicleId')], responses: { 201: created('Wishlist'), ...E(401, 404, 409, 500) } },
  delete: { tags: ['Wishlist'], summary: 'Remove a vehicle from wishlist', security: bearer, parameters: [idParam('vehicleId')], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 404, 500) } },
};

// ===== Master =====
paths[`${API}/master/brands`] = {
  get: { tags: ['Master'], summary: 'List brands (public; ?category=, ?q=)', security: publicReq, parameters: [param('category', 'query'), param('q', 'query'), param('isActive', 'query', { schema: { type: 'boolean' } })], responses: { 200: ok('Brand', { array: true }), ...E(500) } },
  post: { tags: ['Master'], summary: 'Create a brand (admin only)', security: bearer, requestBody: jsonBody(ref('BrandInput'), true), responses: { 201: created('Brand'), ...E(400, 401, 403, 409, 500) } },
};
paths[`${API}/master/brands/:id`] = {
  put: { tags: ['Master'], summary: 'Update a brand (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('BrandInput'), true), responses: { 200: ok('Brand'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Master'], summary: 'Delete a brand (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
const masterListGet = (res, tag) => ({ get: { tags: ['Master'], summary: `List ${tag} (public)`, security: publicReq, parameters: [param('category', 'query'), param('brandId', 'query'), param('q', 'query'), param('isActive', 'query', { schema: { type: 'boolean' } })], responses: { 200: ok(res, { array: true }), ...E(500) } } });
paths[`${API}/master/models`] = {
  ...masterListGet('VehicleModel', 'vehicle models'),
  post: { tags: ['Master'], summary: 'Create a vehicle model (admin only)', security: bearer, requestBody: jsonBody(ref('VehicleModelInput'), true), responses: { 201: created('VehicleModel'), ...E(400, 401, 403, 409, 500) } },
};
paths[`${API}/master/models/:id`] = {
  put: { tags: ['Master'], summary: 'Update a vehicle model (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('VehicleModelInput'), true), responses: { 200: ok('VehicleModel'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Master'], summary: 'Delete a vehicle model (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/master/locations`] = {
  ...masterListGet('Location', 'locations'),
  post: { tags: ['Master'], summary: 'Create a location (admin only)', security: bearer, requestBody: jsonBody(ref('LocationInput'), true), responses: { 201: created('Location'), ...E(400, 401, 403, 409, 500) } },
};
paths[`${API}/master/locations/:id`] = {
  put: { tags: ['Master'], summary: 'Update a location (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('LocationInput'), true), responses: { 200: ok('Location'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Master'], summary: 'Delete a location (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/master/features`] = {
  ...masterListGet('Feature', 'features'),
  post: { tags: ['Master'], summary: 'Create a feature (admin only)', security: bearer, requestBody: jsonBody(ref('FeatureInput'), true), responses: { 201: created('Feature'), ...E(400, 401, 403, 409, 500) } },
};
paths[`${API}/master/features/:id`] = {
  put: { tags: ['Master'], summary: 'Update a feature (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('FeatureInput'), true), responses: { 200: ok('Feature'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Master'], summary: 'Delete a feature (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};

// ===== Chat =====
paths[`${API}/chat/tickets`] = {
  post: { tags: ['Chat'], summary: 'Create a support chat ticket (auth)', security: bearer, requestBody: jsonBody(ref('ChatTicketCreateInput'), true), responses: { 201: created('ChatTicket'), ...E(400, 401, 500) } },
  get: { tags: ['Chat'], summary: 'List all tickets (admin only)', security: bearer, parameters: [param('status', 'query', { schema: { type: 'string', enum: ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] } }), param('assignedTo', 'query'), ...pageParams], responses: { 200: ok('ChatTicket', { array: true, paginated: true }), ...E(401, 403, 500) } },
};
paths[`${API}/chat/tickets/mine`] = { get: { tags: ['Chat'], summary: 'List own tickets', security: bearer, responses: { 200: ok('ChatTicket', { array: true }), ...E(401, 500) } } };
paths[`${API}/chat/tickets/:id`] = {
  get: { tags: ['Chat'], summary: 'Get a ticket by id', security: bearer, parameters: [idParam()], responses: { 200: ok('ChatTicket'), ...E(401, 403, 404, 500) } },
  patch: { tags: ['Chat'], summary: 'Update ticket status / assign (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('ChatTicketUpdateInput'), true), responses: { 200: ok('ChatTicket'), ...E(400, 401, 403, 404, 500) } },
};
paths[`${API}/chat/tickets/:id/messages`] = {
  get: { tags: ['Chat'], summary: 'List messages of a ticket', security: bearer, parameters: [idParam()], responses: { 200: ok('ChatMessage', { array: true }), ...E(401, 403, 404, 500) } },
  post: { tags: ['Chat'], summary: 'Send a text message', security: bearer, parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['message'], properties: { message: { type: 'string', minLength: 1, maxLength: 4000 } } }, true), responses: { 201: created('ChatMessage'), ...E(400, 401, 403, 404, 500) } },
};
paths[`${API}/chat/tickets/:id/messages/image`] = { post: {
  tags: ['Chat'], summary: 'Send an image message (multipart)', security: bearer, parameters: [idParam()],
  requestBody: multipartBody({ type: 'object', properties: { photo: { type: 'string', format: 'binary' } } }, true),
  responses: { 201: created('ChatMessage'), ...E(400, 401, 403, 404, 500) },
}};
paths[`${API}/chat/tickets/:id/read`] = { patch: { tags: ['Chat'], summary: 'Mark ticket messages as read', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } } };

// ===== Admin =====
paths[`${API}/admin/dashboard`] = { get: { tags: ['Admin'], summary: 'Dashboard stats, counts and activity feed (admin/employee)', security: bearer, responses: { 200: ok('Dashboard'), ...E(401, 403, 500) } } };
paths[`${API}/admin/users`] = { get: { tags: ['Admin'], summary: 'List users (admin only)', security: bearer, parameters: [param('role', 'query', { schema: { type: 'string', enum: ['USER','EMPLOYEE','ADMIN'] } }), param('q', 'query'), param('isActive', 'query', { schema: { type: 'boolean' } }), ...pageParams], responses: { 200: ok('User', { array: true, paginated: true }), ...E(401, 403, 500) } } };
paths[`${API}/admin/users/:id`] = {
  get: { tags: ['Admin'], summary: 'Get a user by id (admin only)', security: bearer, parameters: [idParam()], responses: { 200: ok('User'), ...E(401, 403, 404, 500) } },
  patch: { tags: ['Admin'], summary: 'Update user role / active status (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('AdminUserUpdateInput'), true), responses: { 200: ok('User'), ...E(400, 401, 403, 404, 500) } },
};
paths[`${API}/admin/notifications`] = { get: { tags: ['Admin'], summary: 'List admin notifications', security: bearer, parameters: [...pageParams], responses: { 200: ok('Notification', { array: true, paginated: true }), ...E(401, 403, 500) } } };
paths[`${API}/admin/notifications/:id/read`] = { patch: { tags: ['Admin'], summary: 'Mark a notification read', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } } };
paths[`${API}/admin/notifications/read-all`] = { patch: { tags: ['Admin'], summary: 'Mark all notifications read', security: bearer, responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 500) } } };

// ===== Content =====
paths[`${API}/content/banners`] = {
  get: { tags: ['Content'], summary: 'List banners (public; ?position=, ?isActive=)', security: publicReq, parameters: [param('position', 'query', { schema: { type: 'string', enum: ['HERO','SELL_STRIP','CATEGORIES','FOOTER'] } }), param('isActive', 'query', { schema: { type: 'boolean' } })], responses: { 200: ok('Banner', { array: true }), ...E(500) } },
  post: { tags: ['Content'], summary: 'Create a banner (admin only)', security: bearer, requestBody: jsonBody(ref('BannerInput'), true), responses: { 201: created('Banner'), ...E(400, 401, 403, 500) } },
};
paths[`${API}/content/banners/:id`] = {
  put: { tags: ['Content'], summary: 'Update a banner (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('BannerInput'), true), responses: { 200: ok('Banner'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Content'], summary: 'Delete a banner (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/content/testimonials`] = {
  get: { tags: ['Content'], summary: 'List testimonials (public)', security: publicReq, parameters: [param('isActive', 'query', { schema: { type: 'boolean' } })], responses: { 200: ok('Testimonial', { array: true }), ...E(500) } },
  post: { tags: ['Content'], summary: 'Create a testimonial (admin only)', security: bearer, requestBody: jsonBody(ref('TestimonialInput'), true), responses: { 201: created('Testimonial'), ...E(400, 401, 403, 500) } },
};
paths[`${API}/content/testimonials/:id`] = {
  put: { tags: ['Content'], summary: 'Update a testimonial (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('TestimonialInput'), true), responses: { 200: ok('Testimonial'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Content'], summary: 'Delete a testimonial (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/content/faqs`] = { get: { tags: ['Content'], summary: 'Public FAQ tree (categories with articles)', security: publicReq, responses: { 200: ok('FaqCategoryWithArticles', { array: true }), ...E(500) } } };
paths[`${API}/content/faq-categories`] = {
  get: { tags: ['Content'], summary: 'List FAQ categories', security: publicReq, responses: { 200: ok('FaqCategory', { array: true }), ...E(500) } },
  post: { tags: ['Content'], summary: 'Create FAQ category (admin only)', security: bearer, requestBody: jsonBody(ref('FaqCategoryInput'), true), responses: { 201: created('FaqCategory'), ...E(400, 401, 403, 500) } },
};
paths[`${API}/content/faq-categories/:id`] = {
  put: { tags: ['Content'], summary: 'Update FAQ category (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('FaqCategoryInput'), true), responses: { 200: ok('FaqCategory'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Content'], summary: 'Delete FAQ category (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/content/faq-articles`] = {
  get: { tags: ['Content'], summary: 'List FAQ articles (?category=)', security: publicReq, parameters: [param('category', 'query')], responses: { 200: ok('FaqArticle', { array: true }), ...E(500) } },
  post: { tags: ['Content'], summary: 'Create FAQ article (admin only)', security: bearer, requestBody: jsonBody(ref('FaqArticleInput'), true), responses: { 201: created('FaqArticle'), ...E(400, 401, 403, 500) } },
};
paths[`${API}/content/faq-articles/:id`] = {
  put: { tags: ['Content'], summary: 'Update FAQ article (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('FaqArticleInput'), true), responses: { 200: ok('FaqArticle'), ...E(400, 401, 403, 404, 500) } },
  delete: { tags: ['Content'], summary: 'Delete FAQ article (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } },
};
paths[`${API}/content/site-settings`] = {
  get: { tags: ['Content'], summary: 'Get site settings (public)', security: publicReq, responses: { 200: ok('SiteSetting'), ...E(500) } },
  put: { tags: ['Content'], summary: 'Update site settings (admin only)', security: bearer, requestBody: jsonBody(ref('SiteSettingInput'), true), responses: { 200: ok('SiteSetting'), ...E(400, 401, 403, 500) } },
};
paths[`${API}/content/seo`] = { get: { tags: ['Content'], summary: 'Resolve SEO setting for a path (public)', security: publicReq, parameters: [param('path', 'query', { required: true })], responses: { 200: ok('SeoSetting'), ...E(400, 404, 500) } } };
paths[`${API}/content/seo-settings`] = {
  get: { tags: ['Content'], summary: 'List SEO settings (admin only)', security: bearer, parameters: [...pageParams], responses: { 200: ok('SeoSetting', { array: true, paginated: true }), ...E(401, 403, 500) } },
  put: { tags: ['Content'], summary: 'Upsert an SEO setting by path (admin only)', security: bearer, requestBody: jsonBody(ref('SeoSettingInput'), true), responses: { 200: ok('SeoSetting'), ...E(400, 401, 403, 500) } },
};
paths[`${API}/content/seo-settings/:id`] = { delete: { tags: ['Content'], summary: 'Delete an SEO setting (admin only)', security: bearer, parameters: [idParam()], responses: { 200: okWrap(ref('MessageOnly')), ...E(401, 403, 404, 500) } } };
paths[`${API}/content/contacts`] = {
  post: { tags: ['Content'], summary: 'Submit a contact message (public)', security: publicReq, requestBody: jsonBody(ref('ContactInput'), true), responses: { 201: created('Contact'), ...E(400, 500) } },
  get: { tags: ['Content'], summary: 'List contact messages (admin only)', security: bearer, parameters: [param('status', 'query', { schema: { type: 'string', enum: ['NEW','IN_PROGRESS','RESOLVED'] } }), ...pageParams], responses: { 200: ok('Contact', { array: true, paginated: true }), ...E(401, 403, 500) } },
};
paths[`${API}/content/contacts/:id`] = { patch: { tags: ['Content'], summary: 'Update contact status / admin notes (admin only)', security: bearer, parameters: [idParam()], requestBody: jsonBody(ref('ContactUpdateInput'), true), responses: { 200: ok('Contact'), ...E(400, 401, 403, 404, 500) } } };

// ===== Uploads =====
paths[`${API}/uploads`] = { post: {
  tags: ['Uploads'], summary: 'Upload up to 6 images, returns [{url, s3Key}] (guest allowed; strict rate limit)', security: publicReq,
  requestBody: multipartBody({ type: 'object', properties: { photo: { type: 'array', items: { type: 'string', format: 'binary' } } } }, true),
  responses: { 200: okWrap({ type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'array', items: ref('UploadedFile') } } }), ...E(400, 429, 500) },
}};

// ===== Sitemap (root-mounted) =====
paths['/sitemap.xml'] = { get: {
  tags: ['Sitemap'], summary: 'XML sitemap of vehicles + static pages', security: publicReq,
  responses: { 200: { description: 'XML sitemap', content: { 'application/xml': { schema: { type: 'string' } } } } },
}};

// ---------- components ----------
const str = { type: 'string' };
const num = { type: 'number' };
const int = { type: 'integer' };
const bool = { type: 'boolean' };
const date = { type: 'string', format: 'date-time' };
const strArr = { type: 'array', items: { type: 'string' } };
const ID = { type: 'string', description: 'Mongo ObjectId' };
const NullableStr = { type: 'string', nullable: true };

const schemas = {
  PaginationMeta: { type: 'object', properties: { page: int, limit: int, total: int, totalPages: int, hasNextPage: bool, hasPrevPage: bool } },
  MessageOnly: { type: 'object', properties: { success: bool, message: str, data: { nullable: true } } },
  ErrorResponse: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: str, error: str, errors: { type: 'array', items: { type: 'object', properties: { field: str, message: str } } } } },
  UploadedFile: { type: 'object', properties: { url: str, s3Key: { type: 'string', nullable: true }, name: str, size: int, mimetype: str } },

  // Auth
  RegisterInput: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, phone: { type: 'string', pattern: '^[6-9]\\d{9}$' }, password: { type: 'string', minLength: 8 } } },
  LoginInput: { type: 'object', required: ['password'], description: 'Provide either email or phone.', properties: { email: { type: 'string', format: 'email' }, phone: { type: 'string', pattern: '^[6-9]\\d{9}$' }, password: { type: 'string' } }, oneOf: [{ required: ['email'] }, { required: ['phone'] }] },
  GoogleSignInInput: { type: 'object', required: ['credential'], properties: { credential: { type: 'string' } } },
  SendPhoneOtpInput: { type: 'object', properties: { phone: { type: 'string', pattern: '^[6-9]\\d{9}$' } } },
  VerifyPhoneOtpInput: { type: 'object', required: ['code'], properties: { code: { type: 'string', pattern: '^\\d{6}$' } } },
  SendPhoneOtpResult: { type: 'object', properties: { phone: str, sent: bool, alreadyVerified: bool, devCode: { type: 'string' } } },
  RefreshInput: { type: 'object', properties: { refreshToken: str } },
  ForgotPasswordInput: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } },
  ResetPasswordInput: { type: 'object', required: ['token', 'email', 'password'], properties: { token: str, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } },
  UpdateProfileInput: { type: 'object', properties: { name: { type: 'string', minLength: 2 }, phone: { type: 'string', pattern: '^[6-9]\\d{9}$' }, profileImage: str } },
  ChangePasswordInput: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: str, newPassword: { type: 'string', minLength: 8 } } },
  AuthResult: { type: 'object', properties: { user: ref('User'), accessToken: str, refreshToken: str } },
  User: { type: 'object', properties: { id: ID, name: str, email: str, phone: NullableStr, role: { type: 'string', enum: ['USER','EMPLOYEE','ADMIN'] }, isVendor: bool, companyName: NullableStr, emailVerified: bool, phoneVerified: bool, profileImage: NullableStr } },
  AdminUserUpdateInput: { type: 'object', properties: { role: { type: 'string', enum: ['USER','EMPLOYEE','ADMIN'] }, isActive: bool, isVendor: bool, companyName: NullableStr } },

  // Vehicle
  VehicleImage: { type: 'object', properties: { _id: ID, url: str, s3Key: NullableStr, order: int, isPrimary: bool, tag: { type: 'string', enum: ['EXTERIOR','INTERIOR','ENGINE','ODOMETER','DOCUMENTS','TYRES','FRONT','BACK','SIDE'] } } },
  AddVehicleImagesByUrlInput: {
    type: 'object',
    required: ['images'],
    properties: {
      images: {
        type: 'array',
        minItems: 1,
        maxItems: 15,
        items: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string', format: 'uri' },
            isPrimary: bool,
            tag: { type: 'string', enum: ['EXTERIOR','INTERIOR','ENGINE','ODOMETER','DOCUMENTS','TYRES','FRONT','BACK','SIDE'] },
          },
        },
      },
    },
  },
  Vehicle: {
    type: 'object',
    properties: {
      id: ID, slug: str,
      category: { type: 'string', enum: ['TWO_WHEELER','THREE_WHEELER','PASSENGER_CAR','COMMERCIAL','CARAVAN_MOTORHOME'] },
      usageType: { type: 'string', enum: ['PRIVATE','COMMERCIAL'] },
      subCategory: NullableStr, bodyType: NullableStr,
      brand: ID, brandName: str, model: str, variant: NullableStr,
      manufacturingYear: int, registrationYear: int, color: NullableStr,
      fuelType: str, transmission: str, bsNorm: NullableStr, engineCapacityCc: num, powerBhp: num, torqueNm: num, mileageKmpl: num, batteryCapacityKwh: num, rangeKm: num,
      kmDriven: num, ownerCount: { type: 'string', enum: ['1ST','2ND','3RD','4TH_PLUS'] }, seats: int, numberOfKeys: int,
      price: num, isPriceNegotiable: bool, emiStartingFrom: num, originalPrice: num,
      description: NullableStr, features: strArr, highlights: strArr, images: { type: 'array', items: ref('VehicleImage') }, videoUrl: NullableStr,
      status: { type: 'string', enum: ['DRAFT','ACTIVE','RESERVED','SOLD','INACTIVE'] }, isFeatured: bool, views: int,
      registrationNumber: { type: 'string', description: 'Full for admin; masked for public' }, registrationState: str, rtoCode: NullableStr, registrationCity: NullableStr,
      registrationType: NullableStr, rcAvailable: bool, rcType: NullableStr, ownershipTransferStatus: NullableStr,
      insuranceType: str, insuranceValidTill: date, ncbPercentage: num, pucValidTill: date,
      roadTax: NullableStr, roadTaxValidTill: date, fitnessCertificateValidTill: date, permitType: NullableStr, permitValidTill: date,
      loanStatus: NullableStr, financierName: NullableStr, fastagInstalled: bool,
      accidentHistory: NullableStr, floodDamage: bool, serviceHistoryAvailable: bool, lastServiceDate: date, tyreCondition: NullableStr, modifications: NullableStr,
      isInspected: bool, inspectionScore: num, warrantyMonths: int, warrantyKm: int, warrantyType: NullableStr,
      grossVehicleWeightKg: num, payloadCapacityKg: num, unladenWeightKg: num, axleConfiguration: NullableStr, numberOfTyres: int, wheelbaseMm: num, cabinType: NullableStr,
      sleepingCapacity: int, hasKitchenette: bool, hasToilet: bool, hasGenerator: bool, waterTankLitres: num, buildType: NullableStr,
      locationState: str, locationCity: str, locationPincode: str, yardName: NullableStr, sellerType: NullableStr,
      createdBy: ID,
      postedBy: { type: 'object', nullable: true, properties: { id: ID, name: str, email: str, isVendor: bool, companyName: NullableStr } },
      createdAt: date, updatedAt: date,
    },
  },
  VehicleCreateInput: {
    type: 'object',
    required: ['category','usageType','brand','model','manufacturingYear','fuelType','transmission','ownerCount','price','registrationState','locationState','locationCity','locationPincode','insuranceType'],
    properties: {
      category: { type: 'string', enum: ['TWO_WHEELER','THREE_WHEELER','PASSENGER_CAR','COMMERCIAL','CARAVAN_MOTORHOME'] },
      usageType: { type: 'string', enum: ['PRIVATE','COMMERCIAL'] }, subCategory: str, bodyType: str,
      brand: ID, model: str, variant: str, manufacturingYear: int, color: str,
      fuelType: str, transmission: str, bsNorm: str, engineCapacityCc: num, powerBhp: num, mileageKmpl: num, batteryCapacityKwh: num, rangeKm: num,
      kmDriven: num, ownerCount: str, seats: int,
      price: num, isPriceNegotiable: bool, emiStartingFrom: num,
      description: str, features: strArr, highlights: strArr, images: { type: 'array', items: { type: 'object', properties: { url: str, tag: str, order: int, isPrimary: bool } } },
      status: { type: 'string', enum: ['DRAFT','ACTIVE','RESERVED','SOLD','INACTIVE'] }, isFeatured: bool,
      registrationNumber: str, registrationState: str, rtoCode: str, registrationCity: str,
      insuranceType: str, insuranceValidTill: { type: 'string', format: 'date' }, pucValidTill: { type: 'string', format: 'date' },
      roadTax: str, loanStatus: str, accidentHistory: str, tyreCondition: str, isInspected: bool, inspectionScore: num,
      grossVehicleWeightKg: num, payloadCapacityKg: num, axleConfiguration: str, numberOfTyres: int, cabinType: str,
      sleepingCapacity: int, hasKitchenette: bool, hasToilet: bool, waterTankLitres: num,
      locationState: str, locationCity: str, locationPincode: str,
    },
  },
  VehicleUpdateInput: { type: 'object', description: 'Any subset of VehicleCreateInput fields', additionalProperties: true },
  FiltersMeta: { type: 'object', properties: { categories: strArr, usageTypes: strArr, brands: { type: 'array', items: { type: 'object', properties: { _id: ID, name: str, count: int } } }, fuelTypes: strArr, transmissions: strArr, bodyTypes: strArr, states: strArr, cities: strArr, priceRange: { type: 'object', properties: { min: num, max: num } }, yearRange: { type: 'object', properties: { min: int, max: int } }, kmRange: { type: 'object', properties: { min: num, max: num } } } },

  // Buy request
  StatusHistoryEntry: { type: 'object', properties: { from: NullableStr, to: str, note: NullableStr, by: ID, at: date } },
  InternalNote: { type: 'object', properties: { _id: ID, author: ID, note: str, at: date } },
  BuyRequest: { type: 'object', properties: {
    _id: ID, vehicle: ID, user: ID, name: str, phone: str, email: NullableStr, city: NullableStr,
    budget: { type: 'string', enum: ['UNDER_2_LAKH','2_5_LAKH','5_10_LAKH','10_20_LAKH','20_50_LAKH','ABOVE_50_LAKH'], nullable: true },
    needsFinance: bool, wantsTestDrive: bool, testDriveDate: date, hasExchangeVehicle: bool, exchangeDetails: NullableStr,
    message: NullableStr, status: { type: 'string', enum: ['NEW','CONTACTED','TEST_DRIVE_SCHEDULED','NEGOTIATION','CLOSED_WON','CLOSED_LOST'] },
    assignedTo: ID, statusHistory: { type: 'array', items: ref('StatusHistoryEntry') }, internalNotes: { type: 'array', items: ref('InternalNote') },
    createdAt: date, updatedAt: date } },
  BuyRequestCreateInput: { type: 'object', required: ['vehicle','name','phone'], properties: {
    vehicle: ID, name: str, phone: { type: 'string', pattern: '^[6-9]\\d{9}$' }, email: { type: 'string', format: 'email' }, city: str,
    budget: { type: 'string', enum: ['UNDER_2_LAKH','2_5_LAKH','5_10_LAKH','10_20_LAKH','20_50_LAKH','ABOVE_50_LAKH'] },
    needsFinance: bool, wantsTestDrive: bool,
    testDriveDate: { type: 'string', format: 'date' }, hasExchangeVehicle: bool, exchangeDetails: str, message: str } },
  BuyRequestUpdateInput: { type: 'object', properties: {
    status: { type: 'string', enum: ['NEW','CONTACTED','TEST_DRIVE_SCHEDULED','NEGOTIATION','CLOSED_WON','CLOSED_LOST'] },
    assignedTo: ID, note: str, internalNote: str,
    budget: { type: 'string', enum: ['UNDER_2_LAKH','2_5_LAKH','5_10_LAKH','10_20_LAKH','20_50_LAKH','ABOVE_50_LAKH'] },
    needsFinance: bool, wantsTestDrive: bool, testDriveDate: { type: 'string', format: 'date' },
    hasExchangeVehicle: bool, exchangeDetails: str } },

  // Sell request
  SellRequest: { type: 'object', properties: {
    _id: ID, user: ID,
    name: str, phone: str, email: NullableStr, city: str, pincode: str,
    inspectionSlot: NullableStr, sellerType: NullableStr, expectedPrice: num,
    category: str, usageType: str, subCategory: NullableStr, bodyType: NullableStr, brand: ID, brandName: str, model: str, variant: NullableStr,
    manufacturingYear: int, registrationYear: int, color: NullableStr, fuelType: str, transmission: str, bsNorm: NullableStr,
    engineCapacityCc: num, powerBhp: num, kmDriven: num, ownerCount: NullableStr, seats: int,
    registrationNumber: NullableStr, registrationState: str, rtoCode: NullableStr, registrationCity: NullableStr,
    registrationType: NullableStr, rcAvailable: bool, insuranceType: str, insuranceValidTill: date,
    loanStatus: str, financierName: NullableStr, accidentHistory: str, floodDamage: bool, serviceHistoryAvailable: bool, tyreCondition: str,
    grossVehicleWeightKg: num, payloadCapacityKg: num, axleConfiguration: NullableStr, numberOfTyres: int, sleepingCapacity: int, hasKitchenette: bool, hasToilet: bool,
    description: NullableStr, images: { type: 'array', items: { type: 'object', properties: { url: str, tag: { type: 'string', enum: ['FRONT','BACK','SIDES','INTERIOR','ODOMETER','ENGINE','TYRES','RC_COPY'] } } } },
    status: { type: 'string', enum: ['SUBMITTED','UNDER_REVIEW','INSPECTION_SCHEDULED','INSPECTED','OFFER_MADE','ACCEPTED','REJECTED','NEGOTIATING','LISTED','CLOSED'] },
    offerPrice: num, inspectionDate: date, inspector: ID, rejectionReason: NullableStr,
    internalNotes: { type: 'array', items: ref('InternalNote') }, statusHistory: { type: 'array', items: ref('StatusHistoryEntry') },
    listedVehicle: ID, assignedTo: ID, createdAt: date, updatedAt: date } },
  ConvertResult: { type: 'object', properties: {
    sellRequest: ref('SellRequest'),
    vehicle: ref('Vehicle'),
    slug: str,
  } },
  SellRequestCreateInput: { type: 'object', required: ['name','phone','city','pincode','expectedPrice','category','usageType','brandName','model','manufacturingYear','fuelType','transmission','kmDriven','ownerCount','registrationState','insuranceType','loanStatus','accidentHistory','tyreCondition'], properties: {
    name: str, phone: { type: 'string', pattern: '^[6-9]\\d{9}$' }, email: { type: 'string', format: 'email' }, city: str, pincode: { type: 'string', pattern: '^[1-8][0-9]{5}$' },
    inspectionSlot: { type: 'string', enum: ['MORNING_9_12','AFTERNOON_12_3','EVENING_3_6','WEEKEND'] }, sellerType: { type: 'string', enum: ['INDIVIDUAL','DEALER'] }, expectedPrice: num,
    category: { type: 'string', enum: ['TWO_WHEELER','THREE_WHEELER','PASSENGER_CAR','COMMERCIAL','CARAVAN_MOTORHOME'] },
    usageType: { type: 'string', enum: ['PRIVATE','COMMERCIAL'] }, subCategory: str, bodyType: str, brand: ID,
    brandName: str, model: str, variant: str, manufacturingYear: int, registrationYear: int, color: str,
    fuelType: str, transmission: str, bsNorm: str, engineCapacityCc: num, powerBhp: num, kmDriven: num, ownerCount: str, seats: int,
    registrationNumber: str, registrationState: str, rtoCode: str, registrationCity: str, registrationType: str, rcAvailable: bool,
    insuranceType: str, insuranceValidTill: { type: 'string', format: 'date' }, loanStatus: str, financierName: str, accidentHistory: str, floodDamage: bool, serviceHistoryAvailable: bool, tyreCondition: str,
    grossVehicleWeightKg: num, payloadCapacityKg: num, axleConfiguration: str, numberOfTyres: int, sleepingCapacity: int, hasKitchenette: bool, hasToilet: bool, description: str,
    images: { type: 'array', items: { type: 'object', properties: { url: str, tag: str } } } } },
  SellRequestUpdateInput: { type: 'object', properties: {
    status: { type: 'string', enum: ['SUBMITTED','UNDER_REVIEW','INSPECTION_SCHEDULED','INSPECTED','OFFER_MADE','ACCEPTED','REJECTED','NEGOTIATING','LISTED','CLOSED'] },
    offerPrice: num, inspectionDate: { type: 'string', format: 'date' }, inspector: ID, rejectionReason: str, assignedTo: ID, internalNote: str, note: str } },
  SellRequestConvertInput: { type: 'object', properties: {
    override: { type: 'object', properties: {
      price: num, status: { type: 'string', enum: ['DRAFT','ACTIVE'] }, isFeatured: bool,
      brand: ID, description: str, isPriceNegotiable: bool, emiStartingFrom: num,
      locationState: str, locationCity: str, locationPincode: str, yardName: str } } } },

  // Wishlist
  Wishlist: { type: 'object', properties: { _id: ID, user: ID, vehicle: ID, createdAt: date, updatedAt: date } },

  // Master
  Brand: { type: 'object', properties: { _id: ID, name: str, slug: str, categories: strArr, logo: NullableStr, country: NullableStr, isActive: bool, sortOrder: int } },
  BrandInput: { type: 'object', required: ['name'], properties: { name: str, categories: strArr, logo: str, country: str, isActive: bool, sortOrder: int } },
  VehicleModel: { type: 'object', properties: { _id: ID, brand: ID, name: str, slug: str, category: str, bodyTypes: strArr, fuelOptions: strArr, transmissionOptions: strArr, priceRange: { type: 'object', properties: { min: num, max: num } }, isActive: bool } },
  VehicleModelInput: { type: 'object', required: ['brand','name','category'], properties: { brand: ID, name: str, category: str, bodyTypes: strArr, fuelOptions: strArr, transmissionOptions: strArr, priceRange: { type: 'object', properties: { min: num, max: num } }, isActive: bool } },
  Location: { type: 'object', properties: { _id: ID, state: str, stateCode: str, cities: { type: 'array', items: { type: 'object', properties: { name: str, rtoCodes: strArr } } }, isActive: bool } },
  LocationInput: { type: 'object', required: ['state','stateCode'], properties: { state: str, stateCode: str, cities: { type: 'array', items: { type: 'object', properties: { name: str, rtoCodes: strArr } } }, isActive: bool } },
  Feature: { type: 'object', properties: { _id: ID, name: str, slug: str, category: { type: 'string', enum: ['SAFETY','COMFORT','EXTERIOR','INTERIOR','TECH','COMMERCIAL'] }, applicableCategories: strArr, isActive: bool } },
  FeatureInput: { type: 'object', required: ['name','category'], properties: { name: str, category: str, applicableCategories: strArr, isActive: bool } },

  // Chat
  ChatTicket: { type: 'object', properties: { _id: ID, ticketId: str, user: ID, subject: str, category: str, priority: str, status: { type: 'string', enum: ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] }, assignedTo: ID, relatedVehicle: ID, relatedBuyRequest: ID, lastMessageAt: date, unreadCount: int, createdAt: date, updatedAt: date } },
  ChatTicketCreateInput: { type: 'object', required: ['subject'], properties: { subject: { type: 'string', minLength: 3, maxLength: 200 }, description: str, category: { type: 'string', enum: ['BUY_REQUEST','SELL_REQUEST','VEHICLE','FINANCE','PAYMENT','OTHER'] }, priority: { type: 'string', enum: ['LOW','MEDIUM','HIGH','URGENT'] }, relatedVehicle: ID, relatedBuyRequest: ID } },
  ChatTicketUpdateInput: { type: 'object', properties: { status: { type: 'string', enum: ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] }, assignedTo: ID, priority: str } },
  ChatMessage: { type: 'object', properties: { _id: ID, ticket: ID, sender: ID, senderRole: { type: 'string', enum: ['USER','EMPLOYEE','ADMIN'] }, message: NullableStr, imageUrl: NullableStr, isRead: bool, readAt: date, createdAt: date } },

  // Admin
  Dashboard: { type: 'object', properties: {
    vehicles: { type: 'object', properties: { total: int, totalViews: int, avgPrice: num, active: int, sold: int, draft: int, byStatus: { type: 'object', additionalProperties: int }, byCategory: { type: 'object', additionalProperties: int } } },
    requests: { type: 'object', properties: { buyNew: int, sellPending: int, buyThisWeek: int, sellThisWeek: int } },
    users: { type: 'object', properties: { total: int, thisWeek: int } },
    chats: { type: 'object', properties: { open: int } },
    growth: { type: 'object', properties: { vehiclesThisWeek: int, buyThisWeek: int, sellThisWeek: int, usersThisWeek: int } },
    activity: { type: 'array', items: { type: 'object', properties: { type: str, id: ID, title: str, subtitle: str, at: date, link: str } } } } },
  Notification: { type: 'object', properties: { _id: ID, user: ID, type: str, title: str, body: NullableStr, link: NullableStr, isRead: bool, createdAt: date } },

  // Content
  Banner: { type: 'object', properties: { _id: ID, title: str, subtitle: NullableStr, image: NullableStr, link: NullableStr, position: { type: 'string', enum: ['HERO','SELL_STRIP','CATEGORIES','FOOTER'] }, sortOrder: int, isActive: bool } },
  BannerInput: { type: 'object', required: ['title'], properties: { title: str, subtitle: str, image: str, link: str, position: str, sortOrder: int, isActive: bool } },
  Testimonial: { type: 'object', properties: { _id: ID, name: str, city: NullableStr, role: NullableStr, quote: str, rating: int, avatar: NullableStr, isActive: bool, sortOrder: int } },
  TestimonialInput: { type: 'object', required: ['name','quote'], properties: { name: str, city: str, role: str, quote: str, rating: int, avatar: str, isActive: bool, sortOrder: int } },
  FaqCategory: { type: 'object', properties: { _id: ID, title: str, slug: str, description: NullableStr, sortOrder: int, isActive: bool } },
  FaqCategoryWithArticles: { allOf: [ref('FaqCategory'), { type: 'object', properties: { articles: { type: 'array', items: ref('FaqArticle') } } }] },
  FaqCategoryInput: { type: 'object', required: ['title'], properties: { title: str, description: str, sortOrder: int, isActive: bool } },
  FaqArticle: { type: 'object', properties: { _id: ID, category: ID, question: str, answer: str, sortOrder: int, isActive: bool } },
  FaqArticleInput: { type: 'object', required: ['category','question','answer'], properties: { category: ID, question: str, answer: str, sortOrder: int, isActive: bool } },
  SiteSetting: { type: 'object', properties: { _id: ID, siteName: str, tagline: NullableStr, phone: NullableStr, email: NullableStr, whatsapp: NullableStr, address: NullableStr, workingHours: NullableStr, facebook: NullableStr, instagram: NullableStr, twitter: NullableStr, youtube: NullableStr, linkedin: NullableStr, defaultMeta: { type: 'object', properties: { title: str, description: str, image: str } }, footerText: NullableStr, termsContent: NullableStr, privacyContent: NullableStr, legalUpdatedAt: { type: 'string', format: 'date-time', nullable: true } } },
  SiteSettingInput: { type: 'object', properties: { siteName: str, tagline: str, phone: str, email: str, whatsapp: str, address: str, workingHours: str, facebook: str, instagram: str, twitter: str, youtube: str, linkedin: str, defaultMeta: { type: 'object', properties: { title: str, description: str, image: str } }, footerText: str, termsContent: str, privacyContent: str, legalUpdatedAt: { type: 'string', format: 'date-time' } } },
  SeoSetting: { type: 'object', properties: { _id: ID, path: str, title: NullableStr, description: NullableStr, keywords: strArr, ogImage: NullableStr, canonical: NullableStr, noindex: bool, jsonLd: { type: 'object', nullable: true }, lastmod: date } },
  SeoSettingInput: { type: 'object', required: ['path'], properties: { path: str, title: str, description: str, keywords: strArr, ogImage: str, canonical: str, noindex: bool, jsonLd: { type: 'object' } } },
  Contact: { type: 'object', properties: { _id: ID, name: str, email: str, phone: NullableStr, subject: str, message: str, status: { type: 'string', enum: ['NEW','IN_PROGRESS','RESOLVED'] }, adminNotes: NullableStr, createdAt: date } },
  ContactInput: { type: 'object', required: ['name','email','subject','message'], properties: { name: str, email: { type: 'string', format: 'email' }, phone: str, subject: str, message: str } },
  ContactUpdateInput: { type: 'object', properties: { status: { type: 'string', enum: ['NEW','IN_PROGRESS','RESOLVED'] }, adminNotes: str } },
};

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'VehicleMarket API',
    version: '1.0.0',
    description: 'Indian used-vehicle marketplace API — buy & sell vehicles, requests, chat, CMS and admin. All endpoints are under `/api/v1` except `/sitemap.xml`. Authenticate with a Bearer access token (from `/auth/login`); a refresh token is also set as the `vm_refresh` httpOnly cookie.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, tokens, profile' },
    { name: 'Vehicles', description: 'Listings: public search & admin CRUD' },
    { name: 'Buy Requests', description: 'Buyer enquiries on a vehicle' },
    { name: 'Sell Requests', description: 'Seller submissions and offer pipeline' },
    { name: 'Wishlist', description: 'Saved vehicles' },
    { name: 'Master', description: 'Brands, models, locations, features' },
    { name: 'Chat', description: 'Support tickets and live messages' },
    { name: 'Admin', description: 'Dashboard, users, notifications' },
    { name: 'Content', description: 'Banners, testimonials, FAQ, SEO, settings, contacts' },
    { name: 'Uploads', description: 'Generic image upload' },
    { name: 'Sitemap', description: 'SEO sitemap' },
  ],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'vm_refresh' },
    },
    schemas,
  },
};

const out = path.join(__dirname, '..', 'docs', 'openapi.json');
fs.writeFileSync(out, JSON.stringify(spec, null, 2));
const opCount = Object.values(paths).reduce((n, p) => n + Object.keys(p).length, 0);
console.log(`Wrote ${out}`);
console.log(`Paths: ${Object.keys(paths).length}, Operations: ${opCount}, Schemas: ${Object.keys(schemas).length}`);

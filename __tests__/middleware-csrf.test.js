const { NextResponse } = require('next/server');
const { middleware } = require('../middleware');

describe('Middleware CSRF (unit)', () => {
  function mockRequest(method, cookie) {
    return {
      method,
      cookies: {
        get: (name) => name === 'session-token' && cookie ? { value: cookie } : undefined,
      },
    };
  }

  it('permite GET sem autenticação', async () => {
    const req = mockRequest('GET');
    const res = await middleware(req);
    expect(res).toBeInstanceOf(NextResponse);
  });

  it('bloqueia POST sem cookie', async () => {
    const req = mockRequest('POST');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/autenticado/i);
  });

  it('permite POST com cookie', async () => {
    const req = mockRequest('POST', 'token123');
    const res = await middleware(req);
    expect(res).toBeInstanceOf(NextResponse);
  });
}); 
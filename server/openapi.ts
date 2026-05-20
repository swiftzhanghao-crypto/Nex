export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'WPS365 业务平台 API',
    version: '1.0.0',
    description: '业务平台 REST API 文档',
  },
  servers: [{ url: '/api', description: 'API 根路径' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      Paginated: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object' } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          size: { type: 'integer' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['系统'],
        summary: '健康检查',
        security: [],
        responses: {
          '200': {
            description: '服务正常',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    time: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['认证'],
        summary: '邮箱密码登录',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'zhangwei@wps.cn' },
                  password: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    refreshToken: { type: 'string' },
                    user: { type: 'object' },
                  },
                },
              },
            },
          },
          '401': { description: '认证失败', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['认证'],
        summary: '刷新访问令牌',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '新 token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { token: { type: 'string' } },
                },
              },
            },
          },
          '401': { description: '无效 refresh token' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['认证'],
        summary: '当前用户信息',
        responses: {
          '200': { description: '用户信息' },
          '401': { description: '未认证' },
        },
      },
    },
    '/orders': {
      get: {
        tags: ['订单'],
        summary: '订单列表（分页）',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: '分页列表', content: { 'application/json': { schema: { $ref: '#/components/schemas/Paginated' } } } },
        },
      },
      post: {
        tags: ['订单'],
        summary: '创建订单',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerId', 'customerName'],
                properties: {
                  customerId: { type: 'string' },
                  customerName: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: '创建成功' },
          '400': { description: '参数校验失败' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['订单'],
        summary: '订单详情',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '订单' }, '404': { description: '不存在' } },
      },
      put: {
        tags: ['订单'],
        summary: '更新订单',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '更新成功' }, '400': { description: '状态流转不合法' } },
      },
    },
    '/customers': {
      get: {
        tags: ['客户'],
        summary: '客户列表（分页）',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'size', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: '分页列表', content: { 'application/json': { schema: { $ref: '#/components/schemas/Paginated' } } } },
        },
      },
    },
    '/products': {
      get: {
        tags: ['产品'],
        summary: '产品列表（分页）',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'size', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: '分页列表', content: { 'application/json': { schema: { $ref: '#/components/schemas/Paginated' } } } },
        },
      },
    },
    '/users': {
      get: {
        tags: ['用户'],
        summary: '用户列表（分页）',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: '分页列表', content: { 'application/json': { schema: { $ref: '#/components/schemas/Paginated' } } } },
        },
      },
    },
  },
} as const;

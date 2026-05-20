import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { validateBody, customerCreateSchema, customerUpdateSchema } from '../validate.ts';
import { CustomerService } from '../services/CustomerService.ts';

const router = Router();
router.use(authMiddleware);

const customerService = new CustomerService();

router.get('/', checkPermission('customer', 'list'), async (req: AuthRequest, res) => {
  try {
    const result = await customerService.getCustomers(
      req.query as Record<string, string>,
      req.user!
    );
    res.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '获取客户列表失败' });
  }
});

router.get('/:id', checkPermission('customer', 'read'), async (req: AuthRequest, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id as string, req.user!);
    res.json(customer);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '获取客户失败' });
  }
});

router.post('/', checkPermission('customer', 'create'), validateBody(customerCreateSchema), async (req: AuthRequest, res) => {
  try {
    const id = req.body.id || `C${Date.now().toString().slice(-8)}`;
    const customer = await customerService.createCustomer(id, req.body, req.user!);
    res.status(201).json(customer);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '创建客户失败' });
  }
});

router.put('/:id', checkPermission('customer', 'update'), validateBody(customerUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id as string, req.body, req.user!);
    res.json(customer);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '更新客户失败' });
  }
});

router.delete('/:id', checkPermission('customer', 'delete'), async (req: AuthRequest, res) => {
  try {
    await customerService.deleteCustomer(req.params.id as string, req.user!);
    res.json({ ok: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '删除客户失败' });
  }
});

export default router;

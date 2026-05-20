import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { validateBody, orderCreateSchema, orderUpdateSchema } from '../validate.ts';
import { OrderService } from '../services/OrderService.ts';

const router = Router();
router.use(authMiddleware);

const orderService = new OrderService();

router.get('/', checkPermission('order', 'list'), async (req: AuthRequest, res) => {
  try {
    const result = await orderService.getOrders(
      req.query as Record<string, string>,
      req.user!
    );
    res.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '获取订单列表失败' });
  }
});

router.get('/sub-units/list', checkPermission('order', 'list'), async (req: AuthRequest, res) => {
  try {
    const result = await orderService.getSubUnitsFlatList(
      req.query as Record<string, string>,
      req.user!
    );
    res.json(result);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '获取下级单位列表失败' });
  }
});

router.get('/:id', checkPermission('order', 'read'), async (req: AuthRequest, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id as string, req.user!);
    res.json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '获取订单失败' });
  }
});

router.get('/:id/logs', checkPermission('order', 'read'), async (req: AuthRequest, res) => {
  try {
    const logs = await orderService.getOrderAuditLogs(req.params.id as string, req.user!);
    res.json(logs);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '获取订单日志失败' });
  }
});

router.post('/', checkPermission('order', 'create'), validateBody(orderCreateSchema), async (req: AuthRequest, res) => {
  try {
    const order = await orderService.createOrder(req.body, req.user!);
    res.status(201).json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '创建订单失败' });
  }
});

router.put('/:id', checkPermission('order', 'update'), validateBody(orderUpdateSchema), async (req: AuthRequest, res) => {
  try {
    const order = await orderService.updateOrder(req.params.id as string, req.body, req.user!);
    res.json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '更新订单失败' });
  }
});

router.post('/:id/approve', checkPermission('order', 'approve'), async (req: AuthRequest, res) => {
  try {
    const { action, remark } = req.body as { action: 'approve' | 'reject'; remark?: string };
    const order = await orderService.approveOrder(req.params.id as string, action, remark || '', req.user!);
    res.json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '订单审批操作失败' });
  }
});

router.post('/:id/submit', checkPermission('order', 'submit'), async (req: AuthRequest, res) => {
  try {
    const order = await orderService.submitOrderForApproval(req.params.id as string, req.user!);
    res.json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '提交订单审批失败' });
  }
});

router.delete('/:id', checkPermission('order', 'delete'), async (req: AuthRequest, res) => {
  try {
    await orderService.deleteOrder(req.params.id as string, req.user!);
    res.json({ ok: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || '删除订单失败' });
  }
});

export default router;

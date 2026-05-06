const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware');
const { Order, OrderItem, Product } = require('../../shared/database/models');
const FEFOEngine = require('./fefoEngine');
const { v4: uuidv4 } = require('uuid');

const fefoEngine = new FEFOEngine();

/**
 * GET /api/v1/orders
 * Get all orders for current user
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { user_id: req.userId };
    if (status) where.status = status;

    const orders = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }],
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(orders.count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders/:id
 * Get order details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }],
      }],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/orders
 * Create a new order (subscription box or market addon)
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subscription_id, items, order_type = 'subscription_box', is_cross_sell = false } = req.body;

    // Generate order number
    const orderNumber = `PP-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Build FEFO fulfillment plan
    const productIds = items.map(i => i.product_id);
    const quantities = items.map(i => i.quantity);
    const fulfillmentPlan = await fefoEngine.buildFulfillmentPlan(productIds, quantities);

    // Check for shortages
    const shortages = fulfillmentPlan.filter(f => f.status !== 'fulfilled');
    if (shortages.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some products are out of stock',
        shortages: shortages.map(s => ({
          product_id: s.product_id,
          required: s.required,
          available: s.allocated,
        })),
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) continue;

      const itemTotal = product.price_cents * item.quantity;
      subtotal += itemTotal;

      const fulfillment = fulfillmentPlan.find(f => f.product_id === item.product_id);
      const allocation = fulfillment?.allocations?.[0];

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_cents: product.price_cents,
        total_price_cents: itemTotal,
        batch_number: allocation?.batch_number,
        expiry_date: allocation?.expiry_date,
      });
    }

    const shippingCents = is_cross_sell ? 0 : 1999; // Free shipping for cross-sell
    const totalCents = subtotal + shippingCents;

    // Create order
    const order = await Order.create({
      order_number: orderNumber,
      user_id: req.userId,
      subscription_id,
      order_type,
      subtotal_cents: subtotal,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      is_cross_sell,
      shipping_address: req.body.shipping_address,
    });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({ ...item, order_id: order.id });
    }

    // Deduct stock using FEFO
    await fefoEngine.deductStock(fulfillmentPlan);

    // Reload with items
    const fullOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }],
      }],
    });

    res.status(201).json({
      success: true,
      data: { order: fullOrder },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/orders/:orderId/items/:itemId/apply-treatment
 * Mark treatment as applied ("Yes, Applied" button)
 */
router.post('/:orderId/items/:itemId/apply-treatment', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, user_id: req.userId },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const item = await OrderItem.findOne({
      where: { id: req.params.itemId, order_id: order.id },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Order item not found' });
    }

    await item.update({
      treatment_applied: true,
      treatment_applied_at: new Date(),
    });

    res.json({
      success: true,
      data: { message: 'Tedavi uygulandı olarak işaretlendi', item },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/orders/inventory/report
 * Get FEFO inventory report (admin)
 */
router.get('/inventory/report', authenticate, async (req, res, next) => {
  try {
    const report = await fefoEngine.getInventoryReport();
    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

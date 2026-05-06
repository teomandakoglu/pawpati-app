const { Product } = require('../../shared/database/models');
const { Op, literal } = require('sequelize');

/**
 * FEFO (First-Expired, First-Out) Logistics Engine
 * 
 * Manages warehouse inventory prioritization based on product expiry dates.
 * - Products closest to expiry are shipped first
 * - T-30 day warning for near-expiry products
 * - Automatic quarantine for expired products
 */
class FEFOEngine {
  /**
   * Get products sorted by FEFO (First-Expired, First-Out)
   * Used during order fulfillment to pick the correct batch
   * 
   * @param {string[]} productIds - Product IDs to fulfill
   * @param {number[]} quantities - Required quantities per product
   * @returns {Object[]} Fulfillment plan with batch assignments
   */
  async buildFulfillmentPlan(productIds, quantities) {
    const plan = [];

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const requiredQty = quantities[i];

      // Get all non-quarantined batches sorted by expiry date (FEFO)
      const batches = await Product.findAll({
        where: {
          id: productId,
          is_quarantined: false,
          is_active: true,
          stock_quantity: { [Op.gt]: 0 },
          [Op.or]: [
            { expiry_date: { [Op.gt]: new Date() } },
            { expiry_date: null }, // Non-perishable items
          ],
        },
        order: [
          // FEFO: First-Expired items go first
          [literal('CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END'), 'ASC'],
          ['expiry_date', 'ASC'],
        ],
      });

      if (batches.length === 0) {
        plan.push({
          product_id: productId,
          status: 'out_of_stock',
          allocated: 0,
          required: requiredQty,
        });
        continue;
      }

      let remaining = requiredQty;
      const allocations = [];

      for (const batch of batches) {
        if (remaining <= 0) break;

        const allocatable = Math.min(remaining, batch.stock_quantity);
        allocations.push({
          product_id: batch.id,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          quantity: allocatable,
          days_until_expiry: batch.expiry_date
            ? Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
            : null,
        });

        remaining -= allocatable;
      }

      plan.push({
        product_id: productId,
        status: remaining > 0 ? 'partial' : 'fulfilled',
        allocated: requiredQty - remaining,
        required: requiredQty,
        allocations,
        shortage: remaining > 0 ? remaining : 0,
      });
    }

    return plan;
  }

  /**
   * Deduct stock after order confirmation using FEFO allocations
   * @param {Object[]} fulfillmentPlan - Output from buildFulfillmentPlan
   */
  async deductStock(fulfillmentPlan) {
    const results = [];

    for (const item of fulfillmentPlan) {
      if (!item.allocations) continue;

      for (const alloc of item.allocations) {
        const [updatedCount] = await Product.update(
          {
            stock_quantity: literal(`stock_quantity - ${alloc.quantity}`),
          },
          {
            where: {
              id: alloc.product_id,
              stock_quantity: { [Op.gte]: alloc.quantity },
            },
          }
        );

        results.push({
          product_id: alloc.product_id,
          batch_number: alloc.batch_number,
          deducted: alloc.quantity,
          success: updatedCount > 0,
        });
      }
    }

    return results;
  }

  /**
   * Check and quarantine expired products
   * Run daily via cron job
   */
  async quarantineExpiredProducts() {
    const today = new Date().toISOString().split('T')[0];

    const [affectedCount] = await Product.update(
      { is_quarantined: true },
      {
        where: {
          expiry_date: { [Op.lte]: today },
          is_quarantined: false,
        },
      }
    );

    console.log(`🔒 Quarantined ${affectedCount} expired products`);
    return affectedCount;
  }

  /**
   * Get products expiring within N days (T-30 warning)
   * @param {number} days - Warning threshold in days
   */
  async getNearExpiryProducts(days = 30) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);

    return Product.findAll({
      where: {
        expiry_date: {
          [Op.between]: [new Date(), warningDate],
        },
        is_quarantined: false,
        is_active: true,
      },
      order: [['expiry_date', 'ASC']],
    });
  }

  /**
   * Get inventory health report
   */
  async getInventoryReport() {
    const total = await Product.count({ where: { is_active: true } });
    const quarantined = await Product.count({ where: { is_quarantined: true } });
    const nearExpiry = await this.getNearExpiryProducts(30);
    const outOfStock = await Product.count({
      where: { stock_quantity: 0, is_active: true },
    });

    return {
      total_active_products: total,
      quarantined_count: quarantined,
      near_expiry_count: nearExpiry.length,
      near_expiry_products: nearExpiry.map(p => ({
        id: p.id,
        name: p.name,
        expiry_date: p.expiry_date,
        stock: p.stock_quantity,
        days_left: Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)),
      })),
      out_of_stock_count: outOfStock,
      report_date: new Date().toISOString(),
    };
  }
}

module.exports = FEFOEngine;

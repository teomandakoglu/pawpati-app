const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/database/sequelize');

/**
 * Product Model
 * Ürün katalogu - FEFO (First-Expired, First-Out) depo yönetimi
 */
const Product = sequelize.define('products', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM(
      'supplement', 'food', 'treat', 'hygiene',
      'medication', 'accessory', 'toy'
    ),
    allowNull: false,
  },
  // Turkish Veterinary Product Taxonomy
  taxonomy_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Turkish Veterinary Product Taxonomy classification code',
  },
  taxonomy_tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // Species compatibility
  target_species: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['dog', 'cat'],
  },
  // Pricing
  price_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'TRY',
  },
  // Inventory & FEFO
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'FEFO: Products sorted by this date for fulfillment',
  },
  batch_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_quarantined: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Expired or recalled products are quarantined',
  },
  // Media
  image_urls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  // AI Metadata
  ai_recommendation_score: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Base AI compatibility score for recommendation engine',
  },
  health_benefits: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  contraindications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  weight_grams: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['sku'], unique: true },
    { fields: ['category'] },
    { fields: ['expiry_date'] },
    { fields: ['is_quarantined'] },
    { fields: ['is_active'] },
    { fields: ['taxonomy_code'] },
  ],
});

/**
 * Order Model
 * Sipariş ve kargo takip
 */
const Order = sequelize.define('orders', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subscriptions', key: 'id' },
  },
  // Order type
  order_type: {
    type: DataTypes.ENUM('subscription_box', 'market_addon', 'one_time'),
    defaultValue: 'subscription_box',
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'confirmed', 'preparing', 'shipped',
      'in_transit', 'delivered', 'returned', 'cancelled'
    ),
    defaultValue: 'pending',
  },
  // Pricing
  subtotal_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  shipping_cents: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  discount_cents: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'TRY',
  },
  // Shipping
  shipping_address: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  carrier: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Payment
  iyzico_payment_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
  },
  // Cross-sell tracking
  is_cross_sell: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'T-48h cross-sell order from PawPati Market',
  },
  // Notes
  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['order_number'], unique: true },
    { fields: ['user_id'] },
    { fields: ['subscription_id'] },
    { fields: ['status'] },
    { fields: ['shipped_at'] },
    { fields: ['delivered_at'] },
  ],
});

/**
 * OrderItem Model
 * Sipariş kalemleri - FEFO batch takibi
 */
const OrderItem = sequelize.define('order_items', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 },
  },
  unit_price_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_price_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // FEFO tracking
  batch_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Batch assigned via FEFO algorithm',
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Treatment tracking
  treatment_applied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '"Yes, Applied" treatment confirmation button',
  },
  treatment_applied_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] },
  ],
});

module.exports = { Product, Order, OrderItem };

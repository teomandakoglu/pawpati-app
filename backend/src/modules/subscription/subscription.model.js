const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/database/sequelize');

/**
 * Subscription Model
 * Abonelik yönetimi - Pause/Cancel lifecycle with KVKK compliance
 */
const Subscription = sequelize.define('subscriptions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  pet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'pets', key: 'id' },
  },
  // Plan details
  plan_type: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'biannual', 'annual'),
    allowNull: false,
    defaultValue: 'monthly',
  },
  plan_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'PawPati Essential',
  },
  price_cents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Price in kuruş (cents)',
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'TRY',
  },
  // Status lifecycle: active → paused → active | active → cancel_intent → cancelled
  status: {
    type: DataTypes.ENUM(
      'trial',
      'active',
      'paused',
      'cancel_intent',
      'cancelled',
      'expired',
      'past_due'
    ),
    defaultValue: 'trial',
    allowNull: false,
  },
  // Dates
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  next_billing_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Pause mechanism
  paused_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  pause_duration_months: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 2 },
    comment: 'Max 2 months pause to retain AI health profile',
  },
  resume_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // iyzico integration
  iyzico_subscription_ref: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  iyzico_customer_ref: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  payment_method_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // KVKK
  kvkk_deletion_warning_shown: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'KVKK Madde 7 - deletion warning displayed before cancel',
  },
  // Metrics
  total_boxes_shipped: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_amount_paid_cents: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  },
  // Cross-sell / Upsell Engine
  next_shipment_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Next shipment date — triggers upsell banner when <48h away',
  },
  last_upsell_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of last upsell interaction',
  },
  pending_addons: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of add-on product objects added via pre-shipment upsell',
  },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['pet_id'] },
    { fields: ['status'] },
    { fields: ['next_billing_date'] },
    { fields: ['resume_at'] },
  ],
});

module.exports = Subscription;

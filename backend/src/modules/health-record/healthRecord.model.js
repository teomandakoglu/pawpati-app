const { DataTypes } = require('sequelize');
const { sequelize } = require('../../shared/database/sequelize');

/**
 * HealthRecord Model
 * Sağlık kaydı - OCR ile veteriner doküman tarama
 */
const HealthRecord = sequelize.define('health_records', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'pets', key: 'id' },
  },
  vet_clinic_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'vet_clinics', key: 'id' },
  },
  record_type: {
    type: DataTypes.ENUM(
      'vaccination', 'checkup', 'surgery', 'medication',
      'lab_result', 'imaging', 'dental', 'other'
    ),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Record date
  record_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  next_appointment: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Veterinarian
  veterinarian_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  // OCR Integration (Google Cloud Vision)
  document_urls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Uploaded document/image URLs',
  },
  ocr_extracted_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Text extracted via Google Cloud Vision OCR',
  },
  ocr_processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ocr_confidence: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
  },
  // Structured data
  medications: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: '[{ "name": "...", "dosage": "...", "frequency": "...", "duration": "..." }]',
  },
  vitals: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '{ "weight": 12.5, "temperature": 38.5, "heart_rate": 80 }',
  },
  lab_results: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  // AI integration
  ai_analysis: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'AI-generated analysis and recommendations based on this record',
  },
  affects_subscription: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'If true, triggers AI re-evaluation of subscription box contents',
  },
}, {
  indexes: [
    { fields: ['pet_id'] },
    { fields: ['vet_clinic_id'] },
    { fields: ['record_type'] },
    { fields: ['record_date'] },
    { fields: ['ocr_processed'] },
  ],
});

/**
 * AIRecommendation Model
 * AI öneri geçmişi ve re-rank skorları
 */
const AIRecommendation = sequelize.define('ai_recommendations', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'pets', key: 'id' },
  },
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'subscriptions', key: 'id' },
  },
  // AI Engine data
  gpt_raw_response: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Raw GPT-4 recommendation output',
  },
  gpt_model_used: {
    type: DataTypes.STRING(50),
    defaultValue: 'gpt-4',
  },
  gpt_tokens_used: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Re-ranking
  taxonomy_weighted_scores: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Scores after Turkish Veterinary Product Taxonomy weighting',
  },
  feedback_adjusted_scores: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Scores after user feedback re-ranking',
  },
  final_ranked_products: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: '[{ "product_id": "...", "score": 0.95, "reason": "..." }]',
  },
  // Status
  status: {
    type: DataTypes.ENUM('generated', 'accepted', 'modified', 'rejected'),
    defaultValue: 'generated',
  },
  applied_to_order_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // Feedback loop
  user_satisfaction_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  user_feedback_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['pet_id'] },
    { fields: ['subscription_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
});

/**
 * Feedback Model
 * Ürün deneyimi geri bildirim (T+72h cron)
 */
const Feedback = sequelize.define('feedback', {
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
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'products', key: 'id' },
  },
  pet_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'pets', key: 'id' },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Pet reaction tracking
  pet_liked: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  would_reorder: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  // Used for AI training
  used_for_ai_training: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ai_training_batch_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_id'] },
    { fields: ['product_id'] },
    { fields: ['rating'] },
    { fields: ['used_for_ai_training'] },
  ],
});

module.exports = { HealthRecord, AIRecommendation, Feedback };

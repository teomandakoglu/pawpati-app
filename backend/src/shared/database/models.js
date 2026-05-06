const User = require('../modules/user/user.model');
const Pet = require('../modules/user/pet.model');
const Subscription = require('../modules/subscription/subscription.model');
const { Product, Order, OrderItem } = require('../modules/order/order.model');
const VetClinic = require('../modules/veterinary/vetClinic.model');
const { HealthRecord, AIRecommendation, Feedback } = require('../modules/health-record/healthRecord.model');

/**
 * Define all model associations
 * Called once during app initialization
 */
function defineAssociations() {
  // ============================================================
  //  KVKK Madde 7 CASCADE DELETE CHAIN
  //  User silindiğinde tüm kişisel veri zinciri kademeli silinir:
  //  User → Pet → HealthRecord, AIRecommendation
  //  User → Subscription → Order → OrderItem
  //  User → Feedback
  // ============================================================

  // User → Pets (1:N) — CASCADE: Pet kullanıcıyla birlikte silinir
  User.hasMany(Pet, { foreignKey: 'user_id', as: 'pets', onDelete: 'CASCADE', hooks: true });
  Pet.belongsTo(User, { foreignKey: 'user_id', as: 'owner', onDelete: 'CASCADE' });

  // User → Subscriptions (1:N) — CASCADE
  User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions', onDelete: 'CASCADE', hooks: true });
  Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });

  // Pet → Subscription (1:N) — CASCADE: Pet silinirse abonelik de silinir
  Pet.hasMany(Subscription, { foreignKey: 'pet_id', as: 'subscriptions', onDelete: 'CASCADE', hooks: true });
  Subscription.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet', onDelete: 'CASCADE' });

  // User → Orders (1:N) — CASCADE
  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders', onDelete: 'CASCADE', hooks: true });
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });

  // Subscription → Orders (1:N) — SET NULL: Abonelik silinse de sipariş kaydı kalır (fatura)
  Subscription.hasMany(Order, { foreignKey: 'subscription_id', as: 'orders', onDelete: 'SET NULL' });
  Order.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription', onDelete: 'SET NULL' });

  // Order → OrderItems (1:N) — CASCADE
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE', hooks: true });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order', onDelete: 'CASCADE' });

  // Product → OrderItems (1:N) — RESTRICT: Ürün siparişte varsa silinemez
  Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items', onDelete: 'RESTRICT' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product', onDelete: 'RESTRICT' });

  // Pet → HealthRecords (1:N) — CASCADE: Pet silinirse sağlık kayıtları da silinir
  Pet.hasMany(HealthRecord, { foreignKey: 'pet_id', as: 'health_records', onDelete: 'CASCADE', hooks: true });
  HealthRecord.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet', onDelete: 'CASCADE' });

  // VetClinic → HealthRecords (1:N) — SET NULL: Klinik silinse kayıt kalır
  VetClinic.hasMany(HealthRecord, { foreignKey: 'vet_clinic_id', as: 'records', onDelete: 'SET NULL' });
  HealthRecord.belongsTo(VetClinic, { foreignKey: 'vet_clinic_id', as: 'clinic', onDelete: 'SET NULL' });

  // Pet → AIRecommendations (1:N) — CASCADE
  Pet.hasMany(AIRecommendation, { foreignKey: 'pet_id', as: 'recommendations', onDelete: 'CASCADE', hooks: true });
  AIRecommendation.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet', onDelete: 'CASCADE' });

  // Subscription → AIRecommendations (1:N) — SET NULL
  Subscription.hasMany(AIRecommendation, { foreignKey: 'subscription_id', as: 'recommendations', onDelete: 'SET NULL' });
  AIRecommendation.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription', onDelete: 'SET NULL' });

  // User → Feedback (1:N) — CASCADE
  User.hasMany(Feedback, { foreignKey: 'user_id', as: 'feedbacks', onDelete: 'CASCADE', hooks: true });
  Feedback.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });

  // Order → Feedback (1:N) — CASCADE
  Order.hasMany(Feedback, { foreignKey: 'order_id', as: 'feedbacks', onDelete: 'CASCADE', hooks: true });
  Feedback.belongsTo(Order, { foreignKey: 'order_id', as: 'order', onDelete: 'CASCADE' });

  // Product → Feedback (1:N) — SET NULL: Ürün silinse feedback kalır (anonim analiz)
  Product.hasMany(Feedback, { foreignKey: 'product_id', as: 'feedbacks', onDelete: 'SET NULL' });
  Feedback.belongsTo(Product, { foreignKey: 'product_id', as: 'product', onDelete: 'SET NULL' });

  console.log('✅ Model associations defined (KVKK CASCADE enabled)');
}

module.exports = {
  User,
  Pet,
  Subscription,
  Product,
  Order,
  OrderItem,
  VetClinic,
  HealthRecord,
  AIRecommendation,
  Feedback,
  defineAssociations,
};

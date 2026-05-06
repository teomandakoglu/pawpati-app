const { Op } = require('sequelize');
const { sequelize } = require('../shared/database/sequelize');
const {
  User, Pet, Subscription, Order, OrderItem,
  HealthRecord, AIRecommendation, Feedback,
} = require('../shared/database/models');

/**
 * KVKK Madde 7 — Kişisel Veri İmha Görevi (Hard Delete Purge)
 * 
 * Sequelize paranoid: true ile silinen kayıtlar deleted_at sütununa
 * tarih yazılarak "soft delete" yapılır. Bu job, 30 günlük grace period
 * dolduktan sonra bu kayıtları veritabanından kalıcı olarak siler.
 * 
 * Cascade zinciri (models.js onDelete: CASCADE ile güvenceye alınmıştır):
 *   User → Pet → HealthRecord, AIRecommendation
 *   User → Subscription → Order → OrderItem  
 *   User → Feedback
 * 
 * Çalışma zamanı: Her gün 03:00 (scheduler.js içinden çağrılır)
 */
class KVKKPurgeService {
  constructor() {
    this.GRACE_PERIOD_DAYS = 30;
  }

  /**
   * 30 günü geçmiş soft-deleted kullanıcıları ve tüm
   * bağlı kişisel verileri kalıcı olarak siler.
   */
  async purgeExpiredUsers() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.GRACE_PERIOD_DAYS);

    // Soft-deleted_at tarihi 30 günü aşmış kullanıcıları bul
    const expiredUsers = await User.findAll({
      where: {
        deleted_at: { [Op.lte]: cutoffDate },
      },
      paranoid: false, // Soft-deleted kayıtları da getir
      attributes: ['id', 'email', 'deleted_at'],
    });

    if (expiredUsers.length === 0) {
      console.log('🟢 KVKK Purge: No expired users to purge');
      return { purged: 0, errors: [] };
    }

    const results = { purged: 0, errors: [] };

    for (const user of expiredUsers) {
      const transaction = await sequelize.transaction();
      try {
        const userId = user.id;

        // 1. Feedback (User → Feedback)
        await Feedback.destroy({
          where: { user_id: userId },
          force: true, // Hard delete — paranoid override
          transaction,
        });

        // 2. AI Recommendations (User → Pet → AIRecommendation)
        const petIds = (await Pet.findAll({
          where: { user_id: userId },
          attributes: ['id'],
          paranoid: false,
          transaction,
        })).map(p => p.id);

        if (petIds.length > 0) {
          await AIRecommendation.destroy({
            where: { pet_id: petIds },
            force: true,
            transaction,
          });

          // 3. Health Records (User → Pet → HealthRecord)
          await HealthRecord.destroy({
            where: { pet_id: petIds },
            force: true,
            transaction,
          });
        }

        // 4. Order Items (User → Order → OrderItem)
        const orderIds = (await Order.findAll({
          where: { user_id: userId },
          attributes: ['id'],
          paranoid: false,
          transaction,
        })).map(o => o.id);

        if (orderIds.length > 0) {
          await OrderItem.destroy({
            where: { order_id: orderIds },
            force: true,
            transaction,
          });
        }

        // 5. Orders
        await Order.destroy({
          where: { user_id: userId },
          force: true,
          transaction,
        });

        // 6. Subscriptions
        await Subscription.destroy({
          where: { user_id: userId },
          force: true,
          transaction,
        });

        // 7. Pets
        await Pet.destroy({
          where: { user_id: userId },
          force: true,
          transaction,
        });

        // 8. User — son olarak kullanıcının kendisi
        await User.destroy({
          where: { id: userId },
          force: true,
          transaction,
        });

        await transaction.commit();
        results.purged++;
        console.log(`🗑️ KVKK Purge: User ${userId} (${user.email}) permanently deleted`);

      } catch (error) {
        await transaction.rollback();
        results.errors.push({ userId: user.id, error: error.message });
        console.error(`❌ KVKK Purge failed for user ${user.id}:`, error.message);
      }
    }

    console.log(`✅ KVKK Purge complete: ${results.purged} users purged, ${results.errors.length} errors`);
    return results;
  }
}

module.exports = KVKKPurgeService;

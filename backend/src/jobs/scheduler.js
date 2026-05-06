const cron = require('node-cron');
const { Op } = require('sequelize');
const {
  Order, User, Subscription, Pet, Feedback,
} = require('../shared/database/models');
const FEFOEngine = require('../modules/order/fefoEngine');
const SubscriptionService = require('../modules/subscription/subscriptionService');
const KVKKPurgeService = require('./kvkkPurge');

const fefoEngine = new FEFOEngine();
const subscriptionService = new SubscriptionService();
const kvkkPurge = new KVKKPurgeService();

/**
 * Initialize all cron jobs
 * Schedule notation: second(opt) minute hour day-of-month month day-of-week
 */
function initCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // ================================================================
  // T-48h: Cross-sell notification before shipment
  // Runs daily at 09:00
  // ================================================================
  cron.schedule('0 9 * * *', async () => {
    console.log('📦 [CRON] T-48h Cross-sell notification check');
    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      const upcomingShipments = await Order.findAll({
        where: {
          status: 'preparing',
          order_type: 'subscription_box',
          created_at: {
            [Op.gte]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
        include: [{
          model: User,
          as: 'user',
          where: { marketing_consent: true },
        }],
      });

      for (const order of upcomingShipments) {
        // Send cross-sell push notification
        console.log(`📱 Cross-sell notification for user ${order.user.email} - Order ${order.order_number}`);

        // In production: Firebase Push + SendGrid email
        // await sendPushNotification(order.user.firebase_uid, {
        //   title: '🎁 Kutunuza ek ürün ekleyin!',
        //   body: `${order.order_number} numaralı kutunuz 48 saat içinde yola çıkıyor. PawPati Market'ten bedava kargo ile ek ürün ekleyebilirsiniz!`,
        //   data: { type: 'cross_sell', order_id: order.id },
        // });
      }

      console.log(`✅ T-48h: ${upcomingShipments.length} cross-sell notifications sent`);
    } catch (error) {
      console.error('❌ T-48h cron error:', error);
    }
  });

  // ================================================================
  // T+72h: Post-delivery feedback request
  // Runs daily at 14:00
  // ================================================================
  cron.schedule('0 14 * * *', async () => {
    console.log('📝 [CRON] T+72h Feedback request check');
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const recentDeliveries = await Order.findAll({
        where: {
          status: 'delivered',
          delivered_at: {
            [Op.between]: [
              new Date(threeDaysAgo.getTime() - 24 * 60 * 60 * 1000),
              threeDaysAgo,
            ],
          },
        },
        include: [{
          model: User,
          as: 'user',
        }],
      });

      for (const order of recentDeliveries) {
        // Check if feedback already submitted
        const existingFeedback = await Feedback.findOne({
          where: { order_id: order.id },
        });

        if (!existingFeedback) {
          console.log(`📝 Feedback request for user ${order.user.email} - Order ${order.order_number}`);

          // In production: Firebase Push + SendGrid email
          // await sendPushNotification(order.user.firebase_uid, {
          //   title: '🐾 Ürünlerimizi nasıl buldunuz?',
          //   body: `${order.order_number} numaralı kutunuzu aldınız! Deneyiminizi paylaşarak AI önerilerinizi geliştirmemize yardımcı olun.`,
          //   data: { type: 'feedback_request', order_id: order.id },
          // });
        }
      }

      console.log(`✅ T+72h: ${recentDeliveries.length} feedback requests processed`);
    } catch (error) {
      console.error('❌ T+72h cron error:', error);
    }
  });

  // ================================================================
  // T-3 days: Subscription renewal reminder
  // Runs daily at 10:00
  // ================================================================
  cron.schedule('0 10 * * *', async () => {
    console.log('🔔 [CRON] T-3d Renewal reminder check');
    try {
      const upcomingRenewals = await subscriptionService.getUpcomingRenewals(3);

      for (const sub of upcomingRenewals) {
        console.log(`🔔 Renewal reminder for user ${sub.user.email} - Sub ${sub.id}`);

        // In production: SendGrid email + Push notification
        // await sendEmail(sub.user.email, {
        //   subject: '🔄 Abonelik Yenileme Hatırlatması',
        //   template: 'renewal_reminder',
        //   data: {
        //     user_name: sub.user.first_name,
        //     pet_name: sub.pet.name,
        //     renewal_date: sub.next_billing_date,
        //     amount: (sub.price_cents / 100).toFixed(2),
        //   },
        // });
      }

      console.log(`✅ T-3d: ${upcomingRenewals.length} renewal reminders sent`);
    } catch (error) {
      console.error('❌ T-3d cron error:', error);
    }
  });

  // ================================================================
  // Daily: FEFO expired product quarantine
  // Runs daily at 02:00
  // ================================================================
  cron.schedule('0 2 * * *', async () => {
    console.log('🔒 [CRON] Daily FEFO quarantine check');
    try {
      const quarantined = await fefoEngine.quarantineExpiredProducts();
      const nearExpiry = await fefoEngine.getNearExpiryProducts(30);

      if (nearExpiry.length > 0) {
        console.log(`⚠️ ${nearExpiry.length} products expiring within 30 days`);
        // In production: Send admin alert via SendGrid
      }

      console.log(`✅ FEFO: ${quarantined} products quarantined`);
    } catch (error) {
      console.error('❌ FEFO cron error:', error);
    }
  });

  // ================================================================
  // Daily: Auto-resume paused subscriptions
  // Runs daily at 08:00
  // ================================================================
  cron.schedule('0 8 * * *', async () => {
    console.log('🔄 [CRON] Auto-resume paused subscriptions');
    try {
      const results = await subscriptionService.autoResumeExpiredPauses();
      console.log(`✅ Auto-resume: ${results.filter(r => r.resumed).length} subscriptions resumed`);
    } catch (error) {
      console.error('❌ Auto-resume cron error:', error);
    }
  });

  // ================================================================
  // Daily: KVKK Madde 7 — Hard delete purge (30-day grace period)
  // Runs daily at 03:00
  // ================================================================
  cron.schedule('0 3 * * *', async () => {
    console.log('🗑️ [CRON] KVKK Madde 7 purge check');
    try {
      const results = await kvkkPurge.purgeExpiredUsers();
      console.log(`✅ KVKK Purge: ${results.purged} users permanently deleted, ${results.errors.length} errors`);
    } catch (error) {
      console.error('❌ KVKK Purge cron error:', error);
    }
  });

  console.log('✅ All cron jobs initialized (6 jobs)');
}

module.exports = { initCronJobs };

const { Subscription, User, Pet } = require('../../shared/database/models');
const { Op } = require('sequelize');

/**
 * Subscription Lifecycle Service
 * 
 * Manages the subscription state machine:
 * active → paused (1-2 months) → active
 * active → cancel_intent → KVKK warning → pause offer → cancelled
 */
class SubscriptionService {
  /**
   * Pause a subscription (retention strategy)
   * Offers 1 or 2 month pause to retain AI health profile
   * 
   * @param {string} subscriptionId
   * @param {number} durationMonths - 1 or 2 months
   */
  async pauseSubscription(subscriptionId, durationMonths) {
    if (![1, 2].includes(durationMonths)) {
      throw new Error('Pause duration must be 1 or 2 months');
    }

    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [{ model: Pet, as: 'pet' }],
    });

    if (!subscription) throw new Error('Subscription not found');
    if (subscription.status !== 'active') {
      throw new Error(`Cannot pause subscription with status: ${subscription.status}`);
    }

    const resumeDate = new Date();
    resumeDate.setMonth(resumeDate.getMonth() + durationMonths);

    await subscription.update({
      status: 'paused',
      paused_at: new Date(),
      pause_duration_months: durationMonths,
      resume_at: resumeDate,
    });

    return {
      success: true,
      message: `Abonelik ${durationMonths} ay süreyle donduruldu. AI sağlık profiliniz korunmaktadır.`,
      resume_date: resumeDate,
      ai_profile_preserved: true,
    };
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId) {
    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) throw new Error('Subscription not found');
    if (subscription.status !== 'paused') {
      throw new Error('Subscription is not paused');
    }

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    await subscription.update({
      status: 'active',
      paused_at: null,
      pause_duration_months: null,
      resume_at: null,
      current_period_start: new Date(),
      current_period_end: nextBillingDate,
      next_billing_date: nextBillingDate,
    });

    return {
      success: true,
      message: 'Aboneliğiniz yeniden aktive edildi!',
      next_billing_date: nextBillingDate,
    };
  }

  /**
   * Initiate cancellation flow
   * Step 1: Show KVKK Madde 7 deletion warning
   * Step 2: Offer pause as alternative
   * Step 3: If user insists, cancel
   */
  async initiateCancellation(subscriptionId) {
    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [
        { model: User, as: 'user' },
        { model: Pet, as: 'pet' },
      ],
    });

    if (!subscription) throw new Error('Subscription not found');

    // Mark cancel intent
    await subscription.update({
      status: 'cancel_intent',
      kvkk_deletion_warning_shown: true,
    });

    return {
      status: 'cancel_intent',
      kvkk_warning: {
        title: 'KVKK Madde 7 Uyarısı',
        message: `Sayın ${subscription.user.first_name}, aboneliğinizi iptal etmeniz durumunda, KVKK Madde 7 gereğince tüm kişisel verileriniz ve ${subscription.pet.name} için oluşturulmuş AI sağlık profili kalıcı olarak silinecektir. Bu işlem geri alınamaz.`,
        data_to_be_deleted: [
          'Evcil hayvan sağlık profili',
          'AI öneri geçmişi',
          'Veteriner kayıtları',
          'Ürün tercihleri ve geri bildirimler',
        ],
      },
      pause_offer: {
        title: 'AI Sağlık Profilini Koruyun',
        message: `${subscription.pet.name} için özenle oluşturulmuş AI sağlık profilini kaybetmemek için aboneliğinizi 1 veya 2 ay dondurabilirsiniz.`,
        options: [
          { duration: 1, label: '1 Ay Dondur', recommended: false },
          { duration: 2, label: '2 Ay Dondur', recommended: true },
        ],
      },
    };
  }

  /**
   * Confirm cancellation after KVKK warning
   * KVKK Madde 7: Soft-delete user data
   */
  async confirmCancellation(subscriptionId) {
    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) throw new Error('Subscription not found');
    if (!subscription.kvkk_deletion_warning_shown) {
      throw new Error('KVKK warning must be shown before cancellation');
    }

    await subscription.update({
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    // Note: Actual KVKK data deletion is handled by a separate
    // background job after a 30-day grace period (paranoid: true in models)

    return {
      success: true,
      message: 'Aboneliğiniz iptal edildi. Verileriniz KVKK uyarınca 30 gün içinde silinecektir.',
      cancelled_at: new Date(),
      data_deletion_scheduled: true,
      grace_period_days: 30,
    };
  }

  /**
   * Auto-resume paused subscriptions (cron job)
   */
  async autoResumeExpiredPauses() {
    const expiredPauses = await Subscription.findAll({
      where: {
        status: 'paused',
        resume_at: { [Op.lte]: new Date() },
      },
    });

    const results = [];
    for (const sub of expiredPauses) {
      try {
        await this.resumeSubscription(sub.id);
        results.push({ id: sub.id, resumed: true });
      } catch (error) {
        results.push({ id: sub.id, resumed: false, error: error.message });
      }
    }

    console.log(`🔄 Auto-resumed ${results.filter(r => r.resumed).length} paused subscriptions`);
    return results;
  }

  /**
   * Get subscriptions due for renewal in N days
   * Used for T-3 day renewal reminder
   */
  async getUpcomingRenewals(days = 3) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return Subscription.findAll({
      where: {
        status: 'active',
        next_billing_date: {
          [Op.between]: [new Date(), targetDate],
        },
      },
      include: [
        { model: User, as: 'user' },
        { model: Pet, as: 'pet' },
      ],
    });
  }
}

module.exports = SubscriptionService;

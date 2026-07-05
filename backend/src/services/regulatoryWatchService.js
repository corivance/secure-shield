import { regulatoryUpdateService } from './regulatoryUpdateService.js';
import { notificationService } from './notificationService.js';
import { userRepository } from '../repositories/userRepository.js';
import { logger } from '../utils/logger.js';

export const regulatoryWatchService = {
  // Weekly: scrape IRDAI, auto-insert new health circulars (no AI, deduped by
  // the regulation DB), and notify super-admins about what was added.
  async runWeeklyCheck() {
    const res = await regulatoryUpdateService.fetchAndSync();
    if (!res.ok) {
      logger.warn(`IRDAI watch: fetch failed (${res.error || 'no items'})`);
      return { ok: false, error: res.error || 'No items returned' };
    }
    if (!res.inserted) {
      logger.info('IRDAI watch: no new health circulars.');
      return { ok: true, new: 0 };
    }

    const newItems = (res.items || []).filter((i) => i.status === 'inserted');
    const admins = await userRepository.findByRole('super-admin');
    const title = `${res.inserted} new IRDAI health circular${res.inserted > 1 ? 's' : ''} added`;
    const body =
      newItems.slice(0, 3).map((f) => `• ${f.title}`).join('\n') +
      (res.inserted > 3 ? `\n…and ${res.inserted - 3} more` : '');

    await Promise.all(
      admins.map((a) =>
        notificationService.emit({ userId: a._id, type: 'compliance', title, body, link: '/admin/regulations' })
      )
    );
    logger.info(`IRDAI watch: inserted ${res.inserted}, notified ${admins.length} admin(s).`);
    return { ok: true, new: res.inserted, notified: admins.length };
  },
};

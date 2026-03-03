import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ─── Причини скарги ──────────────────────────────────────────────────────────
export const REPORT_REASONS = [
    { id: 'spam',          label: 'Спам або реклама'              },
    { id: 'copyright',     label: 'Порушення авторських прав'     },
    { id: 'inappropriate', label: 'Неприйнятний контент'          },
    { id: 'harassment',    label: 'Цькування або погрози'         },
    { id: 'hate_speech',   label: 'Мова ненависті'                },
    { id: 'misinformation',label: 'Дезінформація'                 },
    { id: 'other',         label: 'Інше'                          },
];

/**
 * Надіслати скаргу в Firestore.
 * @param {Object} params
 * @param {string} params.reportedBy    — uid того хто скаржиться
 * @param {'post'|'track'|'user'|'comment'} params.targetType
 * @param {string} params.targetId      — id об'єкта скарги
 * @param {Object} params.targetData    — snapshot даних (для контексту модератора)
 * @param {string} params.reason        — id з REPORT_REASONS
 * @param {string} [params.description] — додатковий опис (опціонально)
 */
export async function submitReport({ reportedBy, targetType, targetId, targetData, reason, description }) {
    return addDoc(collection(db, 'reports'), {
        reportedBy,
        targetType,
        targetId,
        targetData: targetData || {},
        reason,
        description: description?.trim() || '',
        status:      'pending',
        createdAt:   serverTimestamp(),
    });
}

/**
 * Розглянути скаргу (тільки для адмінів).
 * Оновлює статус звіту та надсилає сповіщення скаржнику.
 *
 * @param {string} reportId         — id документа в колекції reports
 * @param {'resolved'|'dismissed'} action — рішення адміна
 * @param {string} [adminNote]      — опційна примітка для скаржника
 */
export async function resolveReport(reportId, action, adminNote = '') {
    const reportRef  = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) throw new Error('Звіт не знайдено');

    const report = reportSnap.data();

    // 1. Оновлюємо статус скарги
    await updateDoc(reportRef, {
        status:     action,
        adminNote:  adminNote.trim(),
        resolvedAt: serverTimestamp(),
    });

    // 2. Надсилаємо сповіщення скаржнику
    await addDoc(collection(db, 'users', report.reportedBy, 'notifications'), {
        type:             'report_update',
        reportId,
        targetType:       report.targetType,
        targetId:         report.targetId,
        reportedUserId:   report.targetData?.authorId   || null,
        reportedUserNick: report.targetData?.authorNick || null,
        action,
        adminNote:        adminNote.trim(),
        entityLink:       `/report-result/${reportId}`,
        timestamp:        serverTimestamp(),
        read:             false,
        toUserId:         report.reportedBy,
    });
}

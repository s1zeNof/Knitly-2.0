import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUserContext } from '../contexts/UserContext';
import toast from 'react-hot-toast';
import './ReportResultPage.css';

// ── Люди та піктограми ────────────────────────────────────────────────────────
const IconShield    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.47-2.34 6.71-6 7.93-3.66-1.22-6-4.46-6-7.93V7.67L12 5z" /></svg>;
const IconCheck     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>;
const IconX         = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>;
const IconClock     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>;
const IconBan       = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69l11.21-11.21C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" /></svg>;
const IconEyeOff    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" /></svg>;
const IconArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>;

// ── Довідники ──────────────────────────────────────────────────────────────────
const REASON_LABELS = {
    spam:           'Спам або реклама',
    copyright:      'Порушення авторських прав',
    inappropriate:  'Неприйнятний контент',
    harassment:     'Цькування або погрози',
    hate_speech:    'Мова ненависті',
    misinformation: 'Дезінформація',
    other:          'Інше',
};

const TARGET_LABELS = {
    post:    'допис',
    track:   'трек',
    user:    'профіль користувача',
    comment: 'коментар',
};

// ── Сторінка результату скарги ─────────────────────────────────────────────────
export default function ReportResultPage() {
    const { reportId } = useParams();
    const { user: currentUser } = useUserContext();

    const [report,    setReport]    = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [actionDone, setActionDone] = useState({ blocked: false, restricted: false });

    useEffect(() => {
        if (!reportId) { setLoading(false); return; }
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'reports', reportId));
                if (snap.exists()) setReport({ id: snap.id, ...snap.data() });
            } catch (err) {
                console.error('ReportResultPage fetch error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [reportId]);

    const reportedUserId   = report?.targetData?.authorId;
    const reportedUserNick = report?.targetData?.authorNick;
    const isResolved       = report?.status === 'resolved';
    const isDismissed      = report?.status === 'dismissed';
    const isPending        = !isResolved && !isDismissed;
    const canAct           = reportedUserId && currentUser?.uid && reportedUserId !== currentUser.uid;

    const handleBlock = async () => {
        if (!canAct || actionDone.blocked) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                blockedUsers: arrayUnion(reportedUserId),
            });
            setActionDone(s => ({ ...s, blocked: true }));
            toast.success(`@${reportedUserNick} заблоковано`);
        } catch (err) {
            console.error(err);
            toast.error('Не вдалося заблокувати користувача');
        }
    };

    const handleRestrict = async () => {
        if (!canAct || actionDone.restricted) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                restrictedUsers: arrayUnion(reportedUserId),
            });
            setActionDone(s => ({ ...s, restricted: true }));
            toast.success(`Для @${reportedUserNick} встановлено обмеження`);
        } catch (err) {
            console.error(err);
            toast.error('Не вдалося обмежити користувача');
        }
    };

    // ── Стани ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="rrp-wrap">
                <div className="rrp-card rrp-skeleton">
                    <div className="rrp-skeleton-line rrp-skeleton-line--wide"  />
                    <div className="rrp-skeleton-line rrp-skeleton-line--short" />
                    <div className="rrp-skeleton-line" />
                    <div className="rrp-skeleton-line" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="rrp-wrap">
                <div className="rrp-card rrp-not-found">
                    <div className="rrp-not-found-icon"><IconX /></div>
                    <h2 className="rrp-not-found-title">Скаргу не знайдено</h2>
                    <p className="rrp-not-found-text">
                        Можливо, посилання некоректне або скаргу було видалено.
                    </p>
                    <Link to="/notifications" className="rrp-back-link">
                        <IconArrowLeft /> Назад до сповіщень
                    </Link>
                </div>
            </div>
        );
    }

    // ── Головний рендер ────────────────────────────────────────────────────────
    return (
        <div className="rrp-wrap">
            <div className="rrp-card">

                {/* ── Хедер ──────────────────────────────────────────────── */}
                <div className="rrp-header">
                    <div className="rrp-header-icon">
                        <IconShield />
                    </div>
                    <div className="rrp-header-text">
                        <h1 className="rrp-title">Результат розгляду скарги</h1>
                        <p className="rrp-subtitle">Knitly Safety Team</p>
                    </div>
                </div>

                {/* ── Статус ─────────────────────────────────────────────── */}
                <div className={`rrp-status rrp-status--${isResolved ? 'resolved' : isDismissed ? 'dismissed' : 'pending'}`}>
                    {isResolved  && <><IconCheck /> Вжито заходів</>}
                    {isDismissed && <><IconX />     Порушень не виявлено</>}
                    {isPending   && <><IconClock /> На розгляді</>}
                </div>

                {/* ── Деталі скарги ──────────────────────────────────────── */}
                <div className="rrp-details">
                    <div className="rrp-detail-row">
                        <span className="rrp-detail-label">Причина:</span>
                        <span className="rrp-detail-value">
                            {REASON_LABELS[report.reason] || report.reason}
                        </span>
                    </div>
                    <div className="rrp-detail-row">
                        <span className="rrp-detail-label">Тип контенту:</span>
                        <span className="rrp-detail-value">
                            {TARGET_LABELS[report.targetType] || report.targetType}
                        </span>
                    </div>
                    {reportedUserNick && (
                        <div className="rrp-detail-row">
                            <span className="rrp-detail-label">Автор:</span>
                            <Link to={`/${reportedUserNick}`} className="rrp-detail-link">
                                @{reportedUserNick}
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Повідомлення-результат ──────────────────────────────── */}
                <div className="rrp-message">
                    {isResolved && (
                        <>
                            <p>Дякуємо за звернення. Наша команда перевірила вказаний контент і встановила, що він порушує <Link to="/guidelines" className="rrp-inline-link">Правила спільноти Knitly</Link>. Відповідні заходи вжито.</p>
                            <p>Ми цінуємо вашу допомогу у підтримці безпечного та якісного середовища.</p>
                        </>
                    )}
                    {isDismissed && (
                        <>
                            <p>Дякуємо за звернення. Наша команда розглянула вказаний контент і не виявила порушень <Link to="/guidelines" className="rrp-inline-link">Правил спільноти Knitly</Link> на момент перевірки.</p>
                            <p>Якщо ситуація зміниться або ви помітите нові порушення — будь ласка, подайте нову скаргу.</p>
                        </>
                    )}
                    {isPending && (
                        <p>Вашу скаргу отримано та передано на розгляд команді безпеки. Ми повідомимо вас про результат найближчим часом. Дякуємо за терпіння.</p>
                    )}

                    {/* Примітка адміна (опціонально) */}
                    {report.adminNote && (
                        <blockquote className="rrp-admin-note">
                            <span className="rrp-admin-note-label">Примітка команди:</span>
                            {report.adminNote}
                        </blockquote>
                    )}
                </div>

                {/* ── Дії (лише якщо скаргу задоволено і є відомий автор) ── */}
                {isResolved && canAct && (
                    <div className="rrp-actions">
                        <p className="rrp-actions-hint">
                            Якщо ви хочете більше не бачити контент цього користувача:
                        </p>
                        <div className="rrp-actions-row">
                            <button
                                className="rrp-btn-block"
                                onClick={handleBlock}
                                disabled={actionDone.blocked}
                            >
                                <IconBan />
                                {actionDone.blocked
                                    ? 'Заблоковано'
                                    : `Заблокувати @${reportedUserNick}`}
                            </button>
                            <button
                                className="rrp-btn-restrict"
                                onClick={handleRestrict}
                                disabled={actionDone.restricted}
                            >
                                <IconEyeOff />
                                {actionDone.restricted
                                    ? 'Обмежено'
                                    : `Обмежити @${reportedUserNick}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Назад ───────────────────────────────────────────────── */}
                <Link to="/notifications" className="rrp-back-link">
                    <IconArrowLeft /> Назад до сповіщень
                </Link>
            </div>
        </div>
    );
}

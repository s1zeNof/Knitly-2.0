import React, { useState, useEffect, useCallback } from 'react';
import {
    collection, query, orderBy, getDocs, limit, startAfter,
    doc, updateDoc, addDoc, getDoc, serverTimestamp, where,
} from 'firebase/firestore';
import { db }        from '../firebase.js';
import { useAdminAuth } from '../contexts/AdminAuthContext.jsx';
import toast from 'react-hot-toast';

// ── Іконки ────────────────────────────────────────────────────────────────────
const IcoCheck    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>;
const IcoX        = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>;
const IcoChevron  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M6 9l6 6 6-6"/></svg>;
const IcoRefresh  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoExternal = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

// ── Довідники ─────────────────────────────────────────────────────────────────
const REASON_LABELS = {
    spam:           'Спам',
    copyright:      'Авт. права',
    inappropriate:  'Неприйнятний',
    harassment:     'Цькування',
    hate_speech:    'Ненависть',
    misinformation: 'Дезінформація',
    other:          'Інше',
};

const TARGET_LABELS = {
    post:    'Допис',
    track:   'Трек',
    user:    'Юзер',
    comment: 'Коментар',
};

const STATUS_BADGE = {
    pending:  { label: 'Розглядається', cls: 'badge--pending'  },
    resolved: { label: 'Вжито заходів', cls: 'badge--resolved' },
    dismissed:{ label: 'Відхилено',     cls: 'badge--dismissed'},
};

const formatDate = (ts) => {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const PAGE_SIZE = 20;
const MAIN_APP_URL = 'https://knitly-demo.vercel.app'; // змінити на prod URL

// ── Модальне вікно рішення ────────────────────────────────────────────────────
function ResolveModal({ report, onClose, onResolved }) {
    const { adminUser } = useAdminAuth();
    const [action,    setAction]    = useState('resolved');
    const [note,      setNote]      = useState('');
    const [submitting,setSubmitting]= useState(false);

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const reportRef = doc(db, 'reports', report.id);

            // 1. Оновлюємо статус звіту
            await updateDoc(reportRef, {
                status:      action,
                adminNote:   note.trim(),
                resolvedAt:  serverTimestamp(),
                resolvedBy:  adminUser?.uid || null,
            });

            // 2. Сповіщення скаржнику (якщо є reportedBy)
            if (report.reportedBy) {
                await addDoc(collection(db, 'users', report.reportedBy, 'notifications'), {
                    type:             'report_update',
                    reportId:         report.id,
                    targetType:       report.targetType,
                    targetId:         report.targetId,
                    reportedUserId:   report.targetData?.authorId   || null,
                    reportedUserNick: report.targetData?.authorNick || null,
                    action,
                    adminNote:        note.trim(),
                    entityLink:       `/report-result/${report.id}`,
                    timestamp:        serverTimestamp(),
                    read:             false,
                    toUserId:         report.reportedBy,
                });
            }

            toast.success(action === 'resolved' ? 'Скаргу задоволено' : 'Скаргу відхилено');
            onResolved(report.id, action);
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Помилка: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rmodal-overlay" onClick={onClose}>
            <div className="rmodal-card" onClick={e => e.stopPropagation()}>
                <h2 className="rmodal-title">Рішення по скарзі</h2>

                <div className="rmodal-meta">
                    <span><strong>Тип:</strong> {TARGET_LABELS[report.targetType] || report.targetType}</span>
                    <span><strong>Причина:</strong> {REASON_LABELS[report.reason] || report.reason}</span>
                    {report.targetData?.authorNick && (
                        <span><strong>Автор:</strong> @{report.targetData.authorNick}</span>
                    )}
                </div>

                {report.description && (
                    <blockquote className="rmodal-desc">{report.description}</blockquote>
                )}

                {/* Вибір дії */}
                <div className="rmodal-action-group">
                    <button
                        className={`rmodal-action-btn ${action === 'resolved' ? 'rmodal-action-btn--resolved' : ''}`}
                        onClick={() => setAction('resolved')}
                    >
                        <IcoCheck /> Вжити заходів
                    </button>
                    <button
                        className={`rmodal-action-btn ${action === 'dismissed' ? 'rmodal-action-btn--dismissed' : ''}`}
                        onClick={() => setAction('dismissed')}
                    >
                        <IcoX /> Відхилити
                    </button>
                </div>

                {/* Примітка (опціонально) */}
                <textarea
                    className="rmodal-note"
                    placeholder="Примітка для скаржника (опціонально, до 300 символів)..."
                    value={note}
                    onChange={e => setNote(e.target.value.slice(0, 300))}
                    rows={3}
                />
                <p className="rmodal-note-count">{note.length}/300</p>

                <div className="rmodal-footer">
                    <button className="rmodal-btn-cancel" onClick={onClose}>Скасувати</button>
                    <button
                        className={`rmodal-btn-submit ${action === 'resolved' ? 'rmodal-btn-submit--resolved' : 'rmodal-btn-submit--dismissed'}`}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? <span className="adm-spinner adm-spinner--sm" /> : 'Підтвердити рішення'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Рядок скарги ─────────────────────────────────────────────────────────────
function ReportRow({ report, onAction }) {
    const [expanded, setExpanded] = useState(false);
    const badge = STATUS_BADGE[report.status] || STATUS_BADGE.pending;

    const contentUrl = report.targetType === 'post'
        ? `${MAIN_APP_URL}/post/${report.targetId}`
        : report.targetType === 'user'
        ? `${MAIN_APP_URL}/${report.targetData?.authorNick}`
        : null;

    return (
        <>
            <tr
                className={`report-row ${expanded ? 'report-row--expanded' : ''}`}
                onClick={() => setExpanded(s => !s)}
            >
                <td className="td-date">{formatDate(report.createdAt)}</td>
                <td className="td-type">
                    <span className="type-chip">{TARGET_LABELS[report.targetType] || '—'}</span>
                </td>
                <td className="td-reason">{REASON_LABELS[report.reason] || report.reason}</td>
                <td className="td-author">
                    {report.targetData?.authorNick
                        ? <span className="nick-chip">@{report.targetData.authorNick}</span>
                        : <span className="dim">—</span>
                    }
                </td>
                <td className="td-status">
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                </td>
                <td className="td-chevron">
                    <span className={`row-chevron ${expanded ? 'row-chevron--open' : ''}`}>
                        <IcoChevron />
                    </span>
                </td>
            </tr>

            {expanded && (
                <tr className="report-row-detail">
                    <td colSpan={6}>
                        <div className="report-detail">
                            {/* Опис скаржника */}
                            {report.description && (
                                <div className="detail-section">
                                    <span className="detail-label">Опис:</span>
                                    <p className="detail-text">{report.description}</p>
                                </div>
                            )}

                            {/* Прев'ю контенту */}
                            {report.targetData?.preview && (
                                <div className="detail-section">
                                    <span className="detail-label">Прев'ю допису:</span>
                                    <p className="detail-text detail-text--preview">{report.targetData.preview}</p>
                                </div>
                            )}

                            {/* Примітка адміна */}
                            {report.adminNote && (
                                <div className="detail-section">
                                    <span className="detail-label">Примітка команди:</span>
                                    <p className="detail-text detail-text--note">{report.adminNote}</p>
                                </div>
                            )}

                            <div className="detail-actions">
                                {/* Посилання на контент */}
                                {contentUrl && (
                                    <a
                                        href={contentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="detail-link-btn"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <IcoExternal /> Переглянути контент
                                    </a>
                                )}

                                {/* Кнопка рішення (тільки для pending) */}
                                {report.status === 'pending' && (
                                    <button
                                        className="detail-resolve-btn"
                                        onClick={e => { e.stopPropagation(); onAction(report); }}
                                    >
                                        Прийняти рішення
                                    </button>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Головна сторінка ──────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [reports,      setReports]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [lastDoc,      setLastDoc]      = useState(null);
    const [hasMore,      setHasMore]      = useState(false);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [activeReport, setActiveReport] = useState(null); // для модалки

    const fetchReports = useCallback(async (after = null, reset = false) => {
        setLoading(true);
        try {
            let q = query(
                collection(db, 'reports'),
                ...(statusFilter !== 'all' ? [where('status', '==', statusFilter)] : []),
                orderBy('createdAt', 'desc'),
                limit(PAGE_SIZE + 1),
                ...(after ? [startAfter(after)] : [])
            );

            const snap = await getDocs(q);
            const docs = snap.docs.slice(0, PAGE_SIZE).map(d => ({ id: d.id, ...d.data() }));

            setReports(prev => reset ? docs : [...prev, ...docs]);
            setHasMore(snap.docs.length > PAGE_SIZE);
            setLastDoc(snap.docs[PAGE_SIZE - 1] || null);
        } catch (err) {
            console.error(err);
            toast.error('Помилка завантаження: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    // Перезавантажуємо при зміні фільтра
    useEffect(() => {
        setLastDoc(null);
        fetchReports(null, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const handleResolved = (reportId, action) => {
        setReports(prev =>
            prev.map(r => r.id === reportId ? { ...r, status: action } : r)
        );
    };

    const STATUS_FILTERS = [
        { id: 'pending',  label: 'На розгляді' },
        { id: 'resolved', label: 'Задоволені'  },
        { id: 'dismissed',label: 'Відхилені'   },
        { id: 'all',      label: 'Всі'         },
    ];

    return (
        <div className="page-wrap">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Скарги</h1>
                    <p className="page-subtitle">Модерація повідомлень від користувачів</p>
                </div>
                <button
                    className="adm-btn adm-btn--ghost"
                    onClick={() => fetchReports(null, true)}
                    title="Оновити"
                >
                    <IcoRefresh /> Оновити
                </button>
            </div>

            {/* Фільтри статусу */}
            <div className="filter-tabs">
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.id}
                        className={`filter-tab ${statusFilter === f.id ? 'filter-tab--active' : ''}`}
                        onClick={() => setStatusFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Таблиця */}
            <div className="adm-table-wrap">
                {loading && reports.length === 0 ? (
                    <div className="adm-table-loading">
                        <span className="adm-spinner" /> Завантаження...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="adm-table-empty">
                        Немає скарг у цій категорії 🎉
                    </div>
                ) : (
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Тип</th>
                                <th>Причина</th>
                                <th>Автор контенту</th>
                                <th>Статус</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <ReportRow
                                    key={r.id}
                                    report={r}
                                    onAction={setActiveReport}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Load more */}
            {hasMore && (
                <div className="adm-load-more">
                    <button
                        className="adm-btn adm-btn--ghost"
                        onClick={() => fetchReports(lastDoc)}
                        disabled={loading}
                    >
                        {loading ? <span className="adm-spinner adm-spinner--sm" /> : 'Завантажити ще'}
                    </button>
                </div>
            )}

            {/* Resolve modal */}
            {activeReport && (
                <ResolveModal
                    report={activeReport}
                    onClose={() => setActiveReport(null)}
                    onResolved={handleResolved}
                />
            )}
        </div>
    );
}

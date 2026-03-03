import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertOctagon, Copyright, EyeOff, UserX,
    Ban, FileX, MessageSquare, Flag, X, Check, ChevronRight,
} from 'lucide-react';
import { useUserContext } from '../../contexts/UserContext';
import { submitReport, REPORT_REASONS } from '../../services/reportService';
import toast from 'react-hot-toast';
import './ReportModal.css';

// ─── Іконки для кожної причини ───────────────────────────────────────────────
const REASON_ICONS = {
    spam:          AlertOctagon,
    copyright:     Copyright,
    inappropriate: EyeOff,
    harassment:    UserX,
    hate_speech:   Ban,
    misinformation:FileX,
    other:         MessageSquare,
};

// ─── Заголовки для кожного типу контенту ─────────────────────────────────────
const TARGET_LABELS = {
    post:    'допис',
    track:   'трек',
    user:    'користувача',
    comment: 'коментар',
};

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetData }) {
    const { user: currentUser } = useUserContext();

    const [step,        setStep]        = useState('reason');  // 'reason' | 'detail' | 'done'
    const [reason,      setReason]      = useState(null);
    const [description, setDescription] = useState('');
    const [submitting,  setSubmitting]  = useState(false);

    // ── Скинути стан при закритті ────────────────────────────────────────────
    const handleClose = useCallback(() => {
        onClose();
        // невелика затримка аби не мигало при анімації закриття
        setTimeout(() => {
            setStep('reason');
            setReason(null);
            setDescription('');
        }, 300);
    }, [onClose]);

    // ── Esc для закриття ────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
        if (isOpen) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, handleClose]);

    // ── Блокуємо scroll body ─────────────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Сабміт ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!reason || !currentUser || submitting) return;
        setSubmitting(true);
        try {
            await submitReport({
                reportedBy:  currentUser.uid,
                targetType,
                targetId,
                targetData,
                reason,
                description,
            });
            setStep('done');
        } catch (err) {
            console.error('Report error:', err);
            toast.error('Не вдалося надіслати скаргу. Спробуйте ще раз.');
        } finally {
            setSubmitting(false);
        }
    };

    const targetLabel = TARGET_LABELS[targetType] || 'контент';

    return (
        <div className="rmo-overlay" onClick={handleClose}>
            <div
                className={`rmo-modal rmo-modal--${step}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Хедер ────────────────────────────────────────────── */}
                {step !== 'done' && (
                    <div className="rmo-header">
                        <div className="rmo-header-icon">
                            <Flag size={16} />
                        </div>
                        <div className="rmo-header-text">
                            <h2 className="rmo-title">
                                {step === 'reason'
                                    ? `Поскаржитись на ${targetLabel}`
                                    : 'Додаткова інформація'}
                            </h2>
                            <p className="rmo-subtitle">
                                {step === 'reason'
                                    ? 'Оберіть причину скарги'
                                    : 'Це допоможе нам швидше розглянути скаргу'}
                            </p>
                        </div>
                        <button className="rmo-close" onClick={handleClose} aria-label="Закрити">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* ══ КРОК 1 — Вибір причини ══════════════════════════════ */}
                {step === 'reason' && (
                    <div className="rmo-body">
                        <div className="rmo-reasons">
                            {REPORT_REASONS.map(({ id, label }) => {
                                const Icon = REASON_ICONS[id] || MessageSquare;
                                const selected = reason === id;
                                return (
                                    <button
                                        key={id}
                                        className={`rmo-reason-item ${selected ? 'rmo-reason-item--selected' : ''}`}
                                        onClick={() => setReason(id)}
                                    >
                                        <span className="rmo-reason-icon">
                                            <Icon size={16} />
                                        </span>
                                        <span className="rmo-reason-label">{label}</span>
                                        {selected && (
                                            <span className="rmo-reason-check">
                                                <Check size={13} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rmo-footer">
                            <button className="rmo-btn-cancel" onClick={handleClose}>
                                Скасувати
                            </button>
                            <button
                                className="rmo-btn-next"
                                disabled={!reason}
                                onClick={() => setStep('detail')}
                            >
                                Далі <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ══ КРОК 2 — Деталі (опціонально) ══════════════════════ */}
                {step === 'detail' && (
                    <div className="rmo-body">
                        <textarea
                            className="rmo-textarea"
                            placeholder="Опишіть ситуацію детальніше... (необов'язково)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={4}
                            autoFocus
                        />
                        <p className="rmo-char-count">{description.length}/500</p>

                        <div className="rmo-footer">
                            <button className="rmo-btn-cancel" onClick={() => setStep('reason')}>
                                ← Назад
                            </button>
                            <button
                                className="rmo-btn-submit"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? (
                                    <span className="rmo-spinner" />
                                ) : (
                                    'Надіслати скаргу'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ══ КРОК 3 — Успіх ══════════════════════════════════════ */}
                {step === 'done' && (
                    <div className="rmo-done">
                        <div className="rmo-done-icon">
                            <Check size={28} />
                        </div>
                        <h2 className="rmo-done-title">Скаргу надіслано</h2>
                        <p className="rmo-done-text">
                            Дякуємо! Наша команда розгляне її найближчим часом.
                            Якщо контент порушує наші правила — ми вживемо заходів.
                        </p>
                        <button className="rmo-btn-submit" onClick={handleClose}>
                            Зрозуміло
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

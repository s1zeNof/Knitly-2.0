import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="nf-container">
            {/* Animated background blobs */}
            <div className="nf-blob nf-blob-1" />
            <div className="nf-blob nf-blob-2" />

            <div className="nf-content">
                <div className="nf-code-group">
                    <span className="nf-4">4</span>
                    <div className="nf-vinyl">
                        <div className="nf-vinyl-disc">
                            <div className="nf-vinyl-label">0</div>
                        </div>
                    </div>
                    <span className="nf-4">4</span>
                </div>

                <h1 className="nf-title">Сторінку не знайдено</h1>
                <p className="nf-desc">
                    Схоже, цей трек зник зі сцени. Можливо, URL хибний або сторінка була видалена.
                </p>

                <div className="nf-actions">
                    <button className="nf-btn nf-btn-primary" onClick={() => navigate('/')}>
                        На головну
                    </button>
                    <button className="nf-btn nf-btn-ghost" onClick={() => navigate(-1)}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;

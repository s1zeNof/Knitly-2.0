import React from 'react';
import './AppCard.css';

const AppCard = ({ app, onOpen }) => {
    return (
        <div className="app-card-container" onClick={() => onOpen(app.url)}>
            <img src={app.iconUrl} alt={`${app.name} icon`} className="app-card-icon" />
            <div className="app-card-info">
                <h4 className="app-card-name">{app.name}</h4>
                <p className="app-card-description">{app.description}</p>
            </div>
        </div>
    );
};

export default AppCard;
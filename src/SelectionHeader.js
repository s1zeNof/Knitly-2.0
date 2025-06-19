import React from 'react';
import './SelectionHeader.css';

const CloseIcon = () => <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24"><path d="M20 12l-7.5-7.5v4.5H4v6h8.5v4.5L20 12z"/></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24"><path d="M3 6h18m-2 19H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6"/></svg>;

const SelectionHeader = ({ selectedCount, onCancel, onForward, onDelete }) => {
    return (
        <div className="selection-header">
            <button className="selection-action-btn" onClick={onCancel}>
                <CloseIcon />
            </button>
            <span className="selection-count">{selectedCount}</span>
            <div className="selection-actions">
                <button className="selection-action-btn" onClick={onForward} title="Переслати">
                    <ForwardIcon />
                </button>
                <button className="selection-action-btn" onClick={onDelete} title="Видалити">
                    <DeleteIcon />
                </button>
            </div>
        </div>
    );
};

export default SelectionHeader;
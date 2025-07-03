import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExpandableMenu.css';

// <<< ПОЧАТОК ЗМІН: Додано "currentColor" до кожної іконки >>>

const PlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const MusicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const MediaIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const PollIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
const EmojiIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
const GifIcon = () => <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2.5"><path d="M9 10v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"/><path d="M11 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M7 14h10v2a3 3 0 0 1 -3 3h-4a3 3 0 0 1 -3 -3v-2z"/></svg>;

// <<< КІНЕЦЬ ЗМІН >>>


const ExpandableMenu = ({ onAction }) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'music', icon: <MusicIcon />, title: 'Музика' },
        { id: 'media', icon: <MediaIcon />, title: 'Медіа' },
        { id: 'poll', icon: <PollIcon />, title: 'Опитування' },
        { id: 'emoji', icon: <EmojiIcon />, title: 'Emoji' },
        { id: 'gif', icon: <GifIcon />, title: 'GIF' },
    ];

    const listVariants = {
        hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0 } },
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 },
    };

    const handleAction = (actionId) => {
        onAction(actionId);
        setIsOpen(false);
    };

    return (
        <div className="expandable-menu-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="menu-items-wrapper"
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {menuItems.map(item => (
                            <motion.button
                                key={item.id}
                                type="button"
                                className="menu-item-btn"
                                title={item.title}
                                variants={itemVariants}
                                onClick={() => handleAction(item.id)}
                            >
                                {item.icon}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                type="button"
                className="main-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <PlusIcon />
            </motion.button>
        </div>
    );
};

export default ExpandableMenu;
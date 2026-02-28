import React, { useState, useEffect, useRef } from 'react';
import { useUserContext } from '../contexts/UserContext';
import MusicAnalyticsTab from '../components/studio/MusicAnalyticsTab';
import PostsAnalyticsTab from '../components/studio/PostsAnalyticsTab';
import './CreatorStudio.css';

const MusicIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const PostsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;


const CreatorStudio = () => {
    const { user } = useUserContext();
    const [activeTab, setActiveTab] = useState('music');
    const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const shouldShrink = scrollContainer.scrollTop > 50;
            if (shouldShrink !== isHeaderShrunk) {
                setIsHeaderShrunk(shouldShrink);
            }
        };
        
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [isHeaderShrunk]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'music':
                return <MusicAnalyticsTab />;
            case 'posts':
                return <PostsAnalyticsTab />;
            default:
                return null;
        }
    };
    
    if (!user) return null;

    return (
        <div ref={scrollContainerRef} className="studio-page-container">
            <header className={`studio-page-header ${isHeaderShrunk ? 'shrunk' : ''}`}>
                <h1>Творча студія</h1>
                <p>Ваша персональна статистика та аналітика, {user.displayName}.</p>
            </header>
            
            <div className="studio-layout">
                <aside className="studio-sidebar">
                    <button className={activeTab === 'music' ? 'active' : ''} onClick={() => setActiveTab('music')}>
                        <MusicIcon /> Аналітика Музики
                    </button>
                    <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
                        <PostsIcon /> Аналітика Дописів
                    </button>
                </aside>
                <main className="studio-main-content">
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
};

export default CreatorStudio;
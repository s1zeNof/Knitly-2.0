import React from 'react';
import { useQuery } from 'react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import AppCard from '../components/apps/AppCard';
import './AppsMarketplace.css';

// Приймаємо функцію openBrowser, яку нам передасть App.js
const AppsMarketplace = ({ openBrowser }) => {
    const { data: apps, isLoading } = useQuery('apps', () => 
        getDocs(collection(db, 'apps')).then(snap => 
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        )
    );

    // Перед використанням цього коду, не забудьте вручну додати
    // колекцію 'apps' у вашому Firestore та додати туди хоча б один документ
    // з полями: name, description, iconUrl, url.

    if (isLoading) {
        return <div className="apps-marketplace-loader">Завантаження додатків...</div>;
    }

    return (
        <div className="apps-marketplace-container">
            <header className="apps-marketplace-header">
                <h1>Міні-додатки</h1>
                <p>Відкривайте нові можливості всередині Knitly.</p>
            </header>
            <div className="apps-grid">
                {apps && apps.length > 0 ? (
                    apps.map(app => (
                        <AppCard key={app.id} app={app} onOpen={openBrowser} />
                    ))
                ) : (
                    <p>Наразі немає доступних додатків.</p>
                )}
            </div>
        </div>
    );
};

export default AppsMarketplace;
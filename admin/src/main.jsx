import React    from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster }       from 'react-hot-toast';
import { AdminAuthProvider } from './contexts/AdminAuthContext.jsx';
import App from './App.jsx';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AdminAuthProvider>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1a1825',
                            color:      '#f4f4f5',
                            border:     '1px solid rgba(255,255,255,0.1)',
                            fontFamily: 'Urbanist, sans-serif',
                        },
                    }}
                />
            </AdminAuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);

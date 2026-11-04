import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {AppProviders} from './providers/AppProviders';

import App from './App';
import './index.css';
import {AuthProvider} from "./providers/AuthProvider.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppProviders>
            <AuthProvider>
                <App />
            </AuthProvider>
        </AppProviders>
    </StrictMode>,
);
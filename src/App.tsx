// App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './features/auth/pages/LoginPage';
import {RequireAuth} from "./features/auth/pages/RequireAuth.tsx";
import {RequireRole} from "./features/auth/pages/RequireRole.tsx";

const ObjectsPage = lazy(() => import('./features/objects/pages/ObjectsPage'));
const ObjectDetailsPage = lazy(() => import('./features/objects/pages/ObjectDetailsPage'));
const TaskDetailsPage = lazy(() => import('./features/tasks/pages/TaskDetailsPage'));
const MyTasksPage = lazy(() => import('./features/tasks/pages/MyTasksPage'));

export default function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
            <Suspense fallback={<div className="p-6">Loading…</div>}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<RequireAuth />}>
                        <Route element={<AppLayout />}>
                            <Route index element={<Navigate to="/objects" replace />} />
                            <Route path="/objects" element={<ObjectsPage />} />
                            <Route path="/objects/:objectId" element={<ObjectDetailsPage />} />
                            <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />

                            <Route element={<RequireRole role="executor" />}>
                                <Route path="/my-tasks" element={<MyTasksPage />} />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
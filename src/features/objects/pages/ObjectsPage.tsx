
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import {useState} from "react";
import {SiteFormModal} from "../components/SiteFromModal.tsx";

interface ConstructionObject {
    id: string;
    name: string;
    address: string;
}

export default function ObjectsPage() {
    const {
        data: objects = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<ConstructionObject[]>({
        queryKey: ['objects'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('objects')
                .select('id, name, address')
                .order('name', { ascending: true });

            if (error) throw error;

            return data ?? [];
        },
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="min-h-full bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Construction Sites
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your construction projects and track their progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Add Site
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Sites</p>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {objects.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            All Construction Sites
                        </h2>
                        <span className="text-sm text-slate-500">
              {objects.length} sites
            </span>
                    </div>

                    {isLoading && (
                        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            Loading construction sites...
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
                            <p className="text-sm text-red-600">
                                {error instanceof Error ? error.message : 'Failed to load construction sites.'}
                            </p>

                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <RefreshCw size={16} />
                                Try again
                            </button>
                        </div>
                    )}

                    {!isLoading && !isError && objects.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <Building2 className="mx-auto text-slate-400" size={40} />

                            <h3 className="mt-4 font-semibold text-slate-900">
                                No construction sites yet
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Construction sites will appear here once they are created.
                            </p>
                        </div>
                    )}

                    {!isLoading && !isError && objects.length > 0 && (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {objects.map((object) => (
                                <Link
                                    key={object.id}
                                    to={`/objects/${object.id}`}
                                    className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                                            <Building2 size={23} />
                                        </div>

                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                                    </div>

                                    <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                                        {object.name}
                                    </h3>

                                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                                        <MapPin size={17} className="mt-0.5 shrink-0" />
                                        <span>{object.address}</span>
                                    </div>

                                    <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-medium text-blue-600">
                                        View details →
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {isModalOpen && (
                <SiteFormModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}


import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase/client';

interface Props {
    onClose: () => void;
}

export function SiteFormModal({ onClose }: Props) {
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    const createSite = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase
                .from('objects')
                .insert({
                    name: name.trim(),
                    address: address.trim(),
                })
                .select('id, name, address')
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Construction site created');
            queryClient.invalidateQueries({ queryKey: ['objects'] });
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create construction site');
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim() || !address.trim()) return;

        createSite.mutate();
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        New Construction Site
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Enter the construction site details.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="site-name"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Site name
                        </label>
                        <input
                            id="site-name"
                            required
                            autoFocus
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Residential Complex A"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="site-address"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Address
                        </label>
                        <input
                            id="site-address"
                            required
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="Enter site address"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={createSite.isPending}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={createSite.isPending || !name.trim() || !address.trim()}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createSite.isPending ? 'Creating...' : 'Create Site'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

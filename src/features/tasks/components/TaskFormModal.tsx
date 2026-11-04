// features/tasks/components/TaskFormModal.tsx
import { useState, type FormEvent } from 'react';

import { useCreateTask, useExecutors, useUpdateTask } from '../hooks/useTasks';
import type { Task } from '../model/types';
import {useAuth} from "../../auth/hooks/useAuth.ts";
import {Modal} from "../../../components/ui/Modal.tsx";
import {Button, inputClass} from "../../../components/ui/Button.tsx";

interface Props {
    objectId: string;
    task?: Task; // if passed, edit mode
    onClose: () => void;
}

export function TaskFormModal({ objectId, task, onClose }: Props) {
    const { profile } = useAuth();
    const { data: executors = [] } = useExecutors();
    const create = useCreateTask();
    const update = useUpdateTask();

    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');
    const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '');

    const isPending = create.isPending || update.isPending;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!profile) return;

        const input = {
            title: title.trim(),
            description: description.trim() || null,
            assignee_id: assigneeId || null,
        };

        if (task) {
            update.mutate({ id: task.id, input }, { onSuccess: onClose });
        } else {
            create.mutate(
                { ...input, object_id: objectId },
                { onSuccess: onClose },
            );
        }
    }

    return (
        <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label htmlFor="t-title" className="text-sm font-medium text-slate-700">Title</label>
                    <input id="t-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                    <label htmlFor="t-desc" className="text-sm font-medium text-slate-700">Description</label>
                    <textarea id="t-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                    <label htmlFor="t-assignee" className="text-sm font-medium text-slate-700">Assignee</label>
                    <select id="t-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputClass}>
                        <option value="">Unassigned</option>
                        {executors.map((u) => (
                            <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isPending || !title.trim()}>
                        {task ? 'Save' : 'Create'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
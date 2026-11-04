// features/tasks/model/transitions.ts

export type Role = 'manager' | 'executor';

export type TaskStatus =
    | 'new'
    | 'in_progress'
    | 'in_review'
    | 'accepted'
    | 'rework';

export const STATUS_LABEL: Record<TaskStatus, string> = {
    new: 'New',
    in_progress: 'In Progress',
    in_review: 'In Review',
    accepted: 'Accepted',
    rework: 'Needs Rework',
};

interface Transition {
    from: TaskStatus;
    to: TaskStatus;
    actor: 'manager' | 'assignee';
    label: string;
    commentRequired?: boolean;
    variant?: 'primary' | 'danger';
}

const TRANSITIONS: Transition[] = [
    {
        from: 'new',
        to: 'in_progress',
        actor: 'assignee',
        label: 'Start Working',
    },
    {
        from: 'in_progress',
        to: 'in_review',
        actor: 'assignee',
        label: 'Submit for Review',
    },
    {
        from: 'in_review',
        to: 'accepted',
        actor: 'manager',
        label: 'Accept',
    },
    {
        from: 'in_review',
        to: 'rework',
        actor: 'manager',
        label: 'Request Rework',
        commentRequired: true,
        variant: 'danger',
    },
    {
        from: 'rework',
        to: 'in_progress',
        actor: 'assignee',
        label: 'Start Working',
    },
];

interface Ctx {
    status: TaskStatus;
    assigneeId: string | null;
    userId: string;
    role: Role;
}

export function getAvailableTransitions({
                                            status,
                                            assigneeId,
                                            userId,
                                            role,
                                        }: Ctx): Transition[] {
    return TRANSITIONS.filter((t) => {
        if (t.from !== status) return false;
        if (t.actor === 'manager') return role === 'manager';

        return role === 'executor' && assigneeId === userId;
    });
}
import { AbilityBuilder, createMongoAbility, ExtractSubjectType, InferSubjects } from '@casl/ability';

type Subject = InferSubjects<'JobOrder'| 'SelectSupplier'| 'ReceiveTooling'| 'User'>;

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'approve'|'submit'|'reject';

export function defineAbilitiesFor(user: { userId: number, role?: string | string[] }) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    
    // แปลง role ให้เป็น array เสมอเพื่อความง่ายในการเช็ค
    const roles = Array.isArray(user.role) 
        ? user.role 
        : user.role ? [user.role] : [];

    if (roles.includes('admin')) {
        can('manage', 'all');
    } else {
        can('read', 'all');
    }

    if (roles.includes('Manager')) {
        can('approve', 'JobOrder');
        can('reject', 'JobOrder');
        can('approve', 'SelectSupplier');
        can('reject', 'SelectSupplier');
        can('approve', 'ReceiveTooling');
        can('reject', 'ReceiveTooling');
    }

    return build();
}
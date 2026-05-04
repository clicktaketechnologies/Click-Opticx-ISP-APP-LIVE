import { Role } from './types';

// Mocking the check logic from roleRouter.ts
const ALL_ROLE_ROUTES = [
  { path: '/finance', requiredRoles: [Role.SUPER_ADMIN] },
];

function canRoleAccessPath(role: string, path: string): boolean {
  console.log(`Checking access for Role: "${role}", Path: "${path}"`);
  const route = ALL_ROLE_ROUTES.find(r => r.path === path);
  if (!route) {
    console.log('Route not found');
    return false;
  }
  const included = route.requiredRoles.includes(role as Role);
  console.log(`Included: ${included}`);
  return included;
}

const roleFromDB = 'SuperAdmin'; // Value of Role.SUPER_ADMIN
const roleFromAuth = 'SuperAdmin'; 

canRoleAccessPath(roleFromAuth, '/finance');
canRoleAccessPath('Admin', '/finance');

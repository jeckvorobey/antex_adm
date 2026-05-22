export type UserRoleOption = {
  label: string;
  value: number;
};

type RoleOptionsInput = {
  editedUserRole: number;
  hasAssignedManager: boolean;
};

const baseRoleOptions: UserRoleOption[] = [
  { label: 'Пользователь', value: 9 },
  { label: 'Менеджер', value: 2 },
  { label: 'Администратор', value: 1 },
];

export function getRoleOptionsForUser({
  editedUserRole,
  hasAssignedManager,
}: RoleOptionsInput): UserRoleOption[] {
  if (!hasAssignedManager || editedUserRole === 2) {
    return baseRoleOptions;
  }

  return baseRoleOptions.filter((option) => option.value !== 2);
}

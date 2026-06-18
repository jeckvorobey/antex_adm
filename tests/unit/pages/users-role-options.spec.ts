import { describe, it, expect } from 'vitest';

import { getRoleOptionsForUser } from '@pages/users/role-options';

describe('getRoleOptionsForUser', () => {
  it('скрывает роль менеджера для других пользователей, если менеджер уже назначен', () => {
    const options = getRoleOptionsForUser({
      editedUserRole: 9,
      hasAssignedManager: true,
    });

    expect(options).toEqual([
      { label: 'Пользователь', value: 9 },
    ]);
  });

  it('оставляет роль менеджера доступной для текущего менеджера', () => {
    const options = getRoleOptionsForUser({
      editedUserRole: 2,
      hasAssignedManager: true,
    });

    expect(options).toEqual([
      { label: 'Пользователь', value: 9 },
      { label: 'Менеджер', value: 2 },
    ]);
  });
});

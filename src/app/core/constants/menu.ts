import { MenuItem } from '../models/menu.model';

export class Menu {
  public static pages: MenuItem[] = [
    {
      group: 'Dashboard',
      separator: false,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          label: 'Dashboard',
          route: '/dashboard/admin',
        },
      ],
    },

    {
      group: 'Automation Policies',
      separator: false,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          label: 'Automation Policy',
          route: 'policy/policy-list',
        },
      ],
    },
    {
      group: 'Master',
      separator: true,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/user.svg',
          label: 'Accounts',
          route: '/account/account-list',
        },
        {
          icon: 'assets/icons/heroicons/outline/user-circle.svg',
          label: 'Role',
          route: '/master/role',
        },
        {
          icon: 'assets/icons/heroicons/outline/cube.svg',
          label: 'Lookup',
          route: '/master/lookup',
        },
        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Module',
          route: '/master/module',
        },
      ],
    },
    {
      group: 'Report',
      separator: false,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          label: 'Report',
          route: '/reports',
        },
      ],
    },
  ];
}

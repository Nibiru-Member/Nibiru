import { Injectable, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Menu } from 'src/app/core/constants/menu';
import { MenuItem, SubMenuItem } from 'src/app/core/models/menu.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService implements OnDestroy {
  private _showSidebar = signal(true);
  private _showMobileMenu = signal(false);
  private _pagesMenu = signal<MenuItem[]>([]);
  private _subscription = new Subscription();
  
  // Sidebar width management
  private readonly DEFAULT_SIDEBAR_WIDTH = 280; // Default width in pixels
  private readonly MIN_SIDEBAR_WIDTH = 210; // Minimum width in pixels
  private readonly MAX_SIDEBAR_WIDTH = 500; // Maximum width in pixels
  private _sidebarWidth = signal<number>(this.getStoredWidth());

  constructor(private router: Router) {
    /** Set dynamic menu */
    this._pagesMenu.set(Menu.pages);

    let sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        /** Expand menu base on active route */
        this._pagesMenu().forEach((menu) => {
          let activeGroup = false;
          console.log(menu);
          menu.items.forEach((subMenu) => {
            const active = this.isActive(subMenu.route);
            subMenu.expanded = active;
            subMenu.active = active;
            if (active) activeGroup = true;
            if (subMenu.children) {
              this.expand(subMenu.children);
            }
          });
          menu.active = activeGroup;
        });
      }
    });
    this._subscription.add(sub);
  }

  get showSideBar() {
    return this._showSidebar();
  }

  get sidebarWidth() {
    return this._sidebarWidth();
  }

  get minSidebarWidth() {
    return this.MIN_SIDEBAR_WIDTH;
  }

  get maxSidebarWidth() {
    return this.MAX_SIDEBAR_WIDTH;
  }

  private getStoredWidth(): number {
    const stored = localStorage.getItem('sidebarWidth');
    if (stored) {
      const width = parseInt(stored, 10);
      if (width >= this.MIN_SIDEBAR_WIDTH && width <= this.MAX_SIDEBAR_WIDTH) {
        return width;
      }
    }
    return this.DEFAULT_SIDEBAR_WIDTH;
  }

  public setSidebarWidth(width: number): void {
    // Clamp width between min and max
    const clampedWidth = Math.max(this.MIN_SIDEBAR_WIDTH, Math.min(this.MAX_SIDEBAR_WIDTH, width));
    this._sidebarWidth.set(clampedWidth);
    localStorage.setItem('sidebarWidth', clampedWidth.toString());
  }
  get showMobileMenu() {
    return this._showMobileMenu();
  }
  get pagesMenu() {
    return this._pagesMenu();
  }

  set showSideBar(value: boolean) {
    this._showSidebar.set(value);
  }
  set showMobileMenu(value: boolean) {
    this._showMobileMenu.set(value);
  }

  public toggleSidebar() {
    this._showSidebar.set(!this._showSidebar());
  }

  public toggleMenu(menu: SubMenuItem) {
    this.showSideBar = true;

    /** collapse all submenus except the selected one. */
    const updatedMenu = this._pagesMenu().map((menuGroup) => {
      return {
        ...menuGroup,
        items: menuGroup.items.map((item) => {
          return {
            ...item,
            expanded: item === menu ? !item.expanded : false,
          };
        }),
      };
    });

    this._pagesMenu.set(updatedMenu);
  }

  public toggleSubMenu(submenu: SubMenuItem) {
    submenu.expanded = !submenu.expanded;
  }

  private expand(items: Array<any>) {
    items.forEach((item) => {
      item.expanded = this.isActive(item.route);
      if (item.children) this.expand(item.children);
    });
  }

  public isActive(instruction: any): boolean {
    return this.router.isActive(this.router.createUrlTree([instruction]), {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}

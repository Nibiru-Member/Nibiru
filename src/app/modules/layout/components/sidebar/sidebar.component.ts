import { NgClass, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import packageJson from '../../../../../../package.json';
import { MenuService } from '../../services/menu.service';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [NgClass, AngularSvgIconModule, SidebarMenuComponent],
})
export class SidebarComponent implements OnInit {
  public appJson: any = packageJson;
  public isResizing = false;
  public startX = 0;
  public startWidth = 0;

  constructor(public menuService: MenuService) {}

  ngOnInit(): void {}

  public toggleSidebar() {
    this.menuService.toggleSidebar();
  }

  public onResizeStart(event: MouseEvent): void {
    if (!this.menuService.showSideBar) {
      return; // Don't allow resizing when sidebar is collapsed
    }
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.menuService.sidebarWidth;
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('document:mousemove', ['$event'])
  public onResize(event: MouseEvent): void {
    if (!this.isResizing) {
      return;
    }
    const diff = event.clientX - this.startX;
    const newWidth = this.startWidth + diff;
    this.menuService.setSidebarWidth(newWidth);
  }

  @HostListener('document:mouseup', ['$event'])
  public onResizeEnd(event: MouseEvent): void {
    if (this.isResizing) {
      this.isResizing = false;
    }
  }

  public getSidebarWidth(): string {
    if (!this.menuService.showSideBar) {
      return '70px';
    }
    return `${this.menuService.sidebarWidth}px`;
  }
}

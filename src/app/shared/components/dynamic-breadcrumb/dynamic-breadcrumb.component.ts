import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerStateService } from 'src/app/core/services/server-state.service';

@Component({
  selector: 'app-dynamic-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dynamic-breadcrumb.component.html',
  styleUrls: ['./dynamic-breadcrumb.component.css'],
})
export class DynamicBreadcrumbComponent implements OnInit {
  crumbs: string[] = [];

  constructor(private serverState: ServerStateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // ✅ Subscribe safely to hierarchy changes
    this.serverState.onHierarchyChange().subscribe((parts) => {
      // Schedule update in the next change detection cycle
      Promise.resolve().then(() => {
        this.crumbs = (parts || []).filter((p) => p !== null && p !== undefined && p !== '');
        this.cdr.detectChanges(); // ✅ Manually trigger refresh
      });
    });
  }

  // ✅ When user clicks a breadcrumb
  onCrumbClick(index: number) {
    const current = this.serverState.getHierarchy();
    const newHierarchy = current.slice(0, index + 1);

    this.serverState.setHierarchy(newHierarchy);
    this.serverState.triggerBreadcrumbClick(index);
  }
}

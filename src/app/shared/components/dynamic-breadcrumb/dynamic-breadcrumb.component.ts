import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
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
  fullHierarchy: string[] = []; // Store full hierarchy for mapping
  periods = ['DAILY', 'WEEKLY', 'MONTHLY'];
  @Input() selectedPeriod: string = 'WEEKLY';
  @Output() periodChange = new EventEmitter<string>();

  constructor(private serverState: ServerStateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // ✅ Subscribe safely to hierarchy changes
    this.serverState.onHierarchyChange().subscribe((parts) => {
      // Schedule update in the next change detection cycle
      Promise.resolve().then(() => {
        const filtered = (parts || []).filter((p) => p !== null && p !== undefined && p !== '');
        
        // Store full hierarchy for mapping breadcrumb indices
        this.fullHierarchy = filtered;
        
        // Filter to show only Server Name, Database Name, and Table Name
        // Exclude intermediate folders like "Database Diagrams", "Programmability", "Security", "Tables", etc.
        this.crumbs = this.filterBreadcrumbItems(filtered);
        this.cdr.detectChanges(); // ✅ Manually trigger refresh
      });
    });
  }

  /**
   * Filter hierarchy to show only Server Name, Database Name, and Table Name
   * Excludes intermediate folders like Database Diagrams, Programmability, Security, Tables, etc.
   */
  private filterBreadcrumbItems(parts: string[]): string[] {
    if (!parts || parts.length === 0) {
      return [];
    }

    // Items to exclude (intermediate folders)
    const excludeItems = [
      'database diagrams',
      'programmability',
      'security',
      'tables',
      'views',
      'synonyms',
      'functions',
      'stored procedures',
      'indexes',
      'keys',
      'constraints',
      'triggers',
      'types',
      'rules',
      'defaults',
      'sequences',
      'assemblies',
      'xml schema collections',
      'service broker',
      'storage',
      'system tables',
      'system views'
    ];

    const result: string[] = [];
    
    // Always include Server Name (index 0)
    if (parts.length > 0) {
      result.push(parts[0]);
    }

    // Always include Database Name (index 1)
    if (parts.length > 1) {
      result.push(parts[1]);
    }

    // Find and include Table Name (skip intermediate folders)
    // Look for items after "Tables" folder or items that are not in the exclude list
    let foundTablesFolder = false;
    for (let i = 2; i < parts.length; i++) {
      const part = parts[i].toLowerCase().trim();
      
      if (part === 'tables') {
        foundTablesFolder = true;
        continue; // Skip the "Tables" folder itself
      }
      
      // If we found "Tables" folder, the next item is likely the table name
      if (foundTablesFolder && !excludeItems.includes(part)) {
        result.push(parts[i]); // Add the table name
        break; // Only show the first table name, stop after that
      }
      
      // If we haven't found "Tables" yet, check if this is a table name (not in exclude list)
      if (!foundTablesFolder && !excludeItems.includes(part) && i === 2) {
        // This might be a table name directly after database
        result.push(parts[i]);
        break;
      }
    }

    return result;
  }

  // Check if breadcrumb should be visible
  hasCrumbs(): boolean {
    return this.crumbs.length > 0;
  }

  // Check if item is active (last item)
  isActive(index: number): boolean {
    return index === this.crumbs.length - 1;
  }

  // Check if period is active
  isPeriodActive(period: string): boolean {
    return this.selectedPeriod === period;
  }

  // Handle period selection
  selectPeriod(period: string): void {
    if (this.selectedPeriod !== period) {
      this.selectedPeriod = period;
      this.periodChange.emit(period);
    }
  }

  // ✅ When user clicks a breadcrumb
  onCrumbClick(crumbIndex: number) {
    if (crumbIndex < 0 || crumbIndex >= this.crumbs.length) return;
    
    const clickedCrumb = this.crumbs[crumbIndex];
    if (!clickedCrumb) return;

    // Find the actual index in the full hierarchy
    let hierarchyIndex = -1;
    
    // Map breadcrumb index to hierarchy index
    if (crumbIndex === 0) {
      // Server (always at index 0)
      hierarchyIndex = 0;
    } else if (crumbIndex === 1) {
      // Database (always at index 1)
      hierarchyIndex = 1;
    } else {
      // Table or other item - find its position in full hierarchy
      // Look for the crumb value in the hierarchy, but skip excluded items
      for (let i = 0; i < this.fullHierarchy.length; i++) {
        if (this.fullHierarchy[i] === clickedCrumb) {
          hierarchyIndex = i;
          break;
        }
      }
    }

    if (hierarchyIndex < 0) {
      // Fallback: use the crumb index if mapping fails
      hierarchyIndex = crumbIndex;
    }

    // Get the hierarchy up to the clicked level
    const newHierarchy = this.fullHierarchy.slice(0, hierarchyIndex + 1);
    
    // Update hierarchy and trigger breadcrumb click with the actual hierarchy index
    this.serverState.setHierarchy(newHierarchy);
    this.serverState.triggerBreadcrumbClick(hierarchyIndex);
  }
}

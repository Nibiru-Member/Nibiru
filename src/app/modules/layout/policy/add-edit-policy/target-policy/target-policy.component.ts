/* target-policy.component.ts
   Full rewritten and commented version for clarity and correctness.
   Purpose: hierarchical lazy-loading tree for server -> databases -> folders -> items
            central selectionSet, supports selecting server/db and auto-loading children,
            and exposes getFormData() which returns databaseName: string[] when called.
*/

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Subscription, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { Selection } from 'src/app/core/models/policy.model';
import { SidebarService } from 'src/app/core/services/Sidebar/sidebar.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';

/* ---------------------------
   Interfaces / Types
   ---------------------------
   TreeNode: represents any node in the tree (server, database, folder, item)
   DatabaseObject: shape returned by server for DB objects (folder + item)
*/
interface TreeNode {
  name: string;
  icon: string;
  children: TreeNode[]; // children array (empty array when none)
  expanded?: boolean; // whether the node is expanded in the UI
  isLeaf?: boolean; // whether node is a leaf (no children)
  fullPath?: string; // canonical path like "DB\Folder\Item"
}

interface DatabaseObject {
  folder?: string;
  item?: string;
}

/* ---------------------------
   Component decorator
   ---------------------------
   Using templateUrl to reference separate HTML file (must exist).
   Change to inline `template` if you prefer one-file component.
*/
@Component({
  selector: 'app-target-policy',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './target-policy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetPolicyComponent implements OnInit, OnChanges, OnDestroy {
  // -------------------------
  // Inputs / Outputs
  // -------------------------
  @Input() selectedItems: string[] = []; // mirror from parent (can be PolicyAssignment[] or string[])
  @Output() selectedItemsChange = new EventEmitter<string[]>(); // emit when selection changed
  @Input() serverConnection: any = null; // Server connection from general form (server, username, password)
  @Input() policyObjectTypes: any[] = []; // Policy object types from backend (optional, for edit mode)
  
  // -------------------------
  // Injected services
  // -------------------------
  private sidebarService = inject(SidebarService);
  private serverState = inject(ServerStateService);
  private toast = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);

  // -------------------------
  // Local component state
  // -------------------------
  isLoading = false; // top-level loading flag for root DB list
  treeData: TreeNode[] = []; // root tree nodes (server -> databases -> ...)
  updateStatus: boolean = false; // Update status of the policy target selection

  // Central selection state: a Set of fullPath (or name) strings representing checked nodes.
  private selectionSet = new Set<string>();

  // Track which DBs we've already loaded to avoid duplicate network requests.
  // Key format: `${server}::${dbName}`
  private loadedDatabaseChildren = new Set<string>();

  // Composite subscription container for any Observables we subscribe to.
  private subs = new Subscription();

  // -------------------------
  // Lifecycle: OnInit
  // -------------------------
  ngOnInit(): void {
    // Priority 1: Use serverConnection from general form if available
    if (this.serverConnection && this.serverConnection.server) {
      this.loadRootDatabases(this.serverConnection);
    } else {
      // Priority 2: Fall back to ServerStateService connection
      const conn = this.serverState.getConnection();
      if (conn) {
        this.loadRootDatabases(conn);
      }
    }

    // Subscribe to connection changes: reload / clear state as needed.
    // Note: This is a fallback for when not using serverConnection from general form
    const connSub = this.serverState.onConnectionChange().subscribe((c) => {
      // Only use ServerStateService connection if no serverConnection is provided
      if (!this.serverConnection || !this.serverConnection.server) {
        if (c) {
          // new connection: clear loaded DB tracking and load new root DB list
          this.loadedDatabaseChildren.clear();
          this.loadRootDatabases(c);
        } else {
          // connection removed: clear UI
          this.treeData = [];
          this.isLoading = false;
          this.selectionSet.clear();
          this.emitSelection(false); // notify parent with empty selection
          this.cdr.markForCheck();
        }
      }
    });

    console.log('selectedItems', this.selectedItems);

    this.subs.add(connSub);
  }

  // -------------------------
  // Lifecycle: OnChanges
  // -------------------------
  ngOnChanges(changes: SimpleChanges): void {
    // If parent updated selectedItems input, sync the internal selectionSet and attempt to expand tree
    if (changes['selectedItems']) {
      const serverName = this.getServerNameFromTree();
      if (serverName) {
        this.processSelectedItems(serverName).then(() => {
          this.cdr.markForCheck();
        });
      }
    }

    // If serverConnection input changed (from general form), load databases for that server
    if (changes['serverConnection'] && !changes['serverConnection'].firstChange) {
      const conn = changes['serverConnection'].currentValue;
      if (conn && conn.server) {
        this.loadedDatabaseChildren.clear(); // Clear previous loaded DBs
        this.loadRootDatabases(conn);
      }
    }
  }

  // Helper method to get server name from tree
  private getServerNameFromTree(): string {
    return this.treeData?.[0]?.name || '';
  }

  // Process selectedItems - handle both PolicyAssignment objects and string paths
  private async processSelectedItems(serverName: string): Promise<void> {
    if (!this.selectedItems || !this.selectedItems.length) {
      this.selectionSet.clear();
      this.applySelectionsToTree();
      return;
    }

    // Check if selectedItems is an array of objects (PolicyAssignment) or strings (paths)
    const firstItem = this.selectedItems[0];
    const isObjectArray = typeof firstItem === 'object' && firstItem !== null;

    if (isObjectArray) {
      // Handle PolicyAssignment objects: { databaseName, serverName, assignmentId, ... }
      const newSelectionSet = new Set<string>();
      const expandPromises: Promise<void>[] = [];

      // First, add all matching database names
      this.selectedItems.forEach((item: any) => {
        // Match serverName and databaseName with tree
        if (item.serverName === serverName && item.databaseName) {
          // Add database name to selection set
          newSelectionSet.add(item.databaseName);

          // Find the database node in the tree and expand it
          if (this.treeData && this.treeData.length > 0) {
            const serverNode = this.treeData[0];
            if (serverNode && serverNode.children) {
              const dbNode = serverNode.children.find(
                (child: TreeNode) => child.name === item.databaseName && child.icon === 'database'
              );

              if (dbNode) {
                // Expand the database node
                dbNode.expanded = true;

                // Load children if not already loaded, then collect selected children paths
                const loadPromise = this.lazyLoadDatabaseChildrenIfNeeded(dbNode)
                  .then(() => {
                    // After children are loaded, collect selected children paths based on objectTypes
                    this.collectSelectedChildrenPaths(dbNode, item, newSelectionSet);
                  })
                  .catch((err) => {
                    console.error('Error loading database children:', err);
                  });
                expandPromises.push(loadPromise);
              }
            }
          }
        }
      });

      // Wait for all databases to load their children, then update selectionSet
      await Promise.all(expandPromises);
      this.selectionSet = newSelectionSet;
    } else {
      // Handle string array format (legacy): paths like "DatabaseName\ObjectType\ObjectName"
      this.selectionSet = new Set((this.selectedItems || []).filter(Boolean));
    }

    this.applySelectionsToTree();
  }

  // Helper method to collect selected children paths from a database node based on objectTypes
  private collectSelectedChildrenPaths(node: TreeNode, assignment: any, selectionSet: Set<string>): void {
    if (!node || !node.children || node.children.length === 0) {
      return;
    }

    // Get objectTypes for this assignment
    const assignmentId = assignment.assignmentId?.toString();
    const databaseName = assignment.databaseName;
    const selectedObjectPaths = new Set<string>();

    if (assignmentId && this.policyObjectTypes && this.policyObjectTypes.length > 0) {
      // Find all objectTypes for this assignment
      this.policyObjectTypes.forEach((objType: any) => {
        if (objType.assignmentId?.toString() === assignmentId && objType.objectTypeName) {
          // Build full path: DatabaseName\ObjectTypeName
          // objectTypeName might be "ObjectType\ObjectName" or just "ObjectType"
          const objectTypeName = objType.objectTypeName;
          const fullPath = `${databaseName}\\${objectTypeName}`;
          selectedObjectPaths.add(fullPath);
          
          // Also add partial matches (for folder paths)
          const pathParts = objectTypeName.split('\\');
          if (pathParts.length > 1) {
            // Add intermediate folder paths
            let currentPath = databaseName;
            for (let i = 0; i < pathParts.length - 1; i++) {
              currentPath = `${currentPath}\\${pathParts[i]}`;
              selectedObjectPaths.add(currentPath);
            }
          }
        }
      });
    }

    // If we have selected object paths, only add matching children
    // Otherwise, add all children (fallback behavior)
    const shouldFilter = selectedObjectPaths.size > 0;

    const checkAndAddPath = (child: TreeNode) => {
      if (!child.fullPath) return;

      if (shouldFilter) {
        // Check if this path matches any selected objectType (exact or starts with)
        let shouldAdd = false;
        for (const selectedPath of selectedObjectPaths) {
          if (child.fullPath === selectedPath || child.fullPath.startsWith(selectedPath + '\\')) {
            shouldAdd = true;
            break;
          }
        }
        if (shouldAdd) {
          selectionSet.add(child.fullPath);
        }
      } else {
        // No objectTypes available, add all children
        selectionSet.add(child.fullPath);
      }
    };

    node.children.forEach((child: TreeNode) => {
      checkAndAddPath(child);

      // Recursively collect paths from nested children
      if (child.children && child.children.length > 0) {
        this.collectSelectedChildrenPaths(child, assignment, selectionSet);
      }
    });
  }

  // -------------------------
  // Lifecycle: OnDestroy
  // -------------------------
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ----------------------------------------------------------------
  // 1) Load root DB list for current connection
  // ----------------------------------------------------------------
  private loadRootDatabases(conn: any): void {
    if (!conn || !conn.server) {
      // safety: if no server, clear
      this.treeData = [];
      this.isLoading = false;
      this.selectionSet.clear();
      this.emitSelection(false);
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.treeData = [];
    this.cdr.markForCheck();

    // SidebarService.getDatabases(conn) expected to return { data: { databases: string[] } }
    this.sidebarService
      .getDatabases(conn)
      .pipe(
        take(1),
        catchError((err) => {
          // handle error gracefully
          console.error('getDatabases error', err);
          this.isLoading = false;
          this.toast.error('Unable to load databases.');
          this.cdr.markForCheck();
          return of(null);
        }),
      )
      .subscribe((res: any) => {
        this.isLoading = false;

        // Build tree with server node at root and DB nodes as children
        const dbs: string[] = res?.data?.databases || [];
        if (dbs.length) {
          this.treeData = [
            {
              name: conn.server,
              icon: 'server',
              expanded: true,
              fullPath: conn.server, // server-level fullPath is server name
              isLeaf: false,
              children: dbs.map((db: string) => ({
                name: db,
                icon: 'database',
                expanded: false,
                isLeaf: false,
                // Keep backward-compatibility: database fullPath is db name only
                fullPath: db,
                children: [],
              })),
            } as TreeNode,
          ];
        } else {
          this.treeData = [];
        }
        
        // Process selectedItems - handle both object array (PolicyAssignment) and string array formats
        this.processSelectedItems(conn.server).then(() => {
          this.cdr.markForCheck();
        });

        this.cdr.markForCheck();
      });
  }

  // ----------------------------------------------------------------
  // 2) Expand / collapse UI nodes
  // ----------------------------------------------------------------
  toggleNode(node: TreeNode, event?: MouseEvent) {
    if (event) event.stopPropagation();
    if (!node) return;

    node.expanded = !node.expanded;

    // If expanding a database, ensure its children are lazy-loaded.
    if (node.icon === 'database' && node.expanded) {
      // fire-and-forget; this returns a Promise but UI toggle is immediate.
      this.lazyLoadDatabaseChildrenIfNeeded(node).catch((err) => {
        console.error('lazy load error', err);
      });
    } else {
      this.cdr.markForCheck();
    }
  }

  // ----------------------------------------------------------------
  // 3) Lazy-load database children (returns Promise so callers can await)
  // ----------------------------------------------------------------
  private lazyLoadDatabaseChildrenIfNeeded(dbNode: TreeNode): Promise<void> {
    return new Promise<void>((resolve) => {
      // Priority: Use serverConnection from general form, fall back to ServerStateService
      const conn = this.serverConnection && this.serverConnection.server 
        ? this.serverConnection 
        : this.serverState.getConnection();
      
      if (!conn || !dbNode || dbNode.icon !== 'database') return resolve();

      // Unique key to avoid reloading same DB twice
      const dbKey = `${conn.server}::${dbNode.name}`;
      if (this.loadedDatabaseChildren.has(dbKey)) return resolve();

      this.loadedDatabaseChildren.add(dbKey);

      const params = {
        ServerName: conn.server,
        UserName: conn.username,
        Password: conn.password,
        DatabaseName: dbNode.name,
      };

      this.sidebarService
        .getDatabaseObjectsFromServer(params)
        .pipe(
          take(1),
          catchError((err) => {
            // On error, remove the loaded flag and resolve to keep callers alive
            console.error('Error loading database objects:', err);
            this.loadedDatabaseChildren.delete(dbKey);
            this.toast.error(`Failed to load objects for ${dbNode.name}`);
            resolve();
            return of(null);
          }),
        )
        .subscribe((res: any) => {
          // Convert returned records into nested TreeNode children
          const data: DatabaseObject[] = res?.data || [];

          if (!data.length) {
            dbNode.children = [];
            this.toast.warning(`No objects found in ${dbNode.name}`);
            this.cdr.markForCheck();
            resolve();
            return;
          }

          dbNode.children = this.buildNestedTree(data, dbNode);
          dbNode.expanded = true;

          // After loading children, re-apply selectionSet (in case selections include these paths)
          this.applySelectionsToTree();

          this.cdr.markForCheck();
          resolve();
        });
    });
  }

  // ----------------------------------------------------------------
  // 4) Build nested tree structure from flat DB records
  // ----------------------------------------------------------------
  private buildNestedTree(records: DatabaseObject[], dbNode: TreeNode): TreeNode[] {
    // Build an intermediate nested object representation keyed by folder path parts
    const root: any = {};

    records.forEach((record) => {
      const folderPath = record.folder ?? 'Uncategorized';
      const itemName = record.item ?? 'Unknown Item';
      const parts = folderPath.split('\\').filter((p) => p.trim() !== '');

      let currentLevel = root;
      parts.forEach((part) => {
        if (!currentLevel[part]) currentLevel[part] = { _items: [] };
        currentLevel = currentLevel[part];
      });

      // Push the item into the final folder node's _items array
      currentLevel._items.push({ name: itemName, folder: folderPath });
    });

    // `dbNode.fullPath` should be present; use safe fallback
    const basePath = dbNode.fullPath ?? dbNode.name ?? '';

    return this.convertToTreeNodes(root, basePath);
  }

  // Convert the intermediate object into TreeNode[] recursively
  private convertToTreeNodes(obj: any, currentPath: string = ''): TreeNode[] {
    const nodes: TreeNode[] = [];

    Object.keys(obj).forEach((key) => {
      if (key === '_items') return;

      // Ensure currentPath is non-empty string
      const base = currentPath ?? '';
      const newPath = base ? `${base}\\${key}` : key;

      const currentObj = obj[key];

      // Recursively convert child folders
      const childFolders: TreeNode[] = this.convertToTreeNodes(currentObj, newPath);

      // Convert items inside this folder into leaf nodes
      const itemNodes: TreeNode[] = (currentObj._items || []).map((item: any) => ({
        name: item.name,
        icon: this.getItemIcon(item.name, item.folder),
        children: [],
        isLeaf: true,
        expanded: false,
        fullPath: `${newPath}\\${item.name}`,
      }));

      nodes.push({
        name: key,
        icon: this.getFolderIcon(key, newPath),
        expanded: false,
        isLeaf: false,
        children: [...childFolders, ...itemNodes],
        fullPath: newPath,
      });
    });

    return nodes;
  }

  // ----------------------------------------------------------------
  // 5) Selection handling (single source-of-truth: selectionSet)
  // ----------------------------------------------------------------
  // Check whether node is selected (used by template)
  isNodeSelected(node: TreeNode): boolean {
    const key = node.fullPath ?? node.name;
    return this.selectionSet.has(key);
  }

  // Handler for checkbox changes triggered from template
  // This is async because selecting server/db may require lazy-loading children first.
  async onNodeSelectionChanged(node: TreeNode, checked: boolean) {
    if (!node) return;

    const key = node.fullPath ?? node.name;

    if (checked) {
      // If selecting a database node, ensure its children are loaded (without requiring expand click)
      if (node.icon === 'database') {
        try {
          await this.lazyLoadDatabaseChildrenIfNeeded(node);
        } catch (err) {
          console.error('Error loading DB before selection', err);
        }
      }

      // If selecting the server node, ensure every DB under it is loaded so we can select deep children
      if (node.icon === 'server') {
        const dbNodes = (node.children || []).filter((c) => c.icon === 'database');
        // sequential await to avoid overwhelming server; consider parallelizing if desired
        for (const dbNode of dbNodes) {
          try {
            await this.lazyLoadDatabaseChildrenIfNeeded(dbNode);
          } catch (err) {
            console.error('Error loading DB during server selection', err);
          }
        }
      }

      // After ensuring children exist, collect all keys in subtree and add them to selectionSet
      const toAdd = new Set<string>();
      this.collectSubtreeKeys(node, toAdd);
      toAdd.forEach((k) => this.selectionSet.add(k));
    } else {
      // Un-select node and all currently loaded descendants
      const toRemove = new Set<string>();
      this.collectSubtreeKeys(node, toRemove);
      toRemove.forEach((k) => this.selectionSet.delete(k));
    }

    // Emit selection to parent and update other derived state
    this.emitSelection(true);
  }

  // Recursively collect full path keys under a node
  private collectSubtreeKeys(node: TreeNode, acc: Set<string>): void {
    const key = node.fullPath ?? node.name;
    acc.add(key);
    (node.children || []).forEach((child) => this.collectSubtreeKeys(child, acc));
  }

  // Helper to read checkbox checked state from change event
  getChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  // Emit selection changes to parent; update serverState isAllIndex flag
  emitSelection(updateInput: boolean) {
    // When emitting upstream, filter out pure database nodes if that's your previous behaviour.
    // Here we preserve previous behaviour: exclude DB nodes from selectedItems array.
    const arr = Array.from(this.selectionSet).filter((k) => !this.isDatabaseNode(k));

    if (updateInput) {
      this.selectedItems = arr;
    }

    // Update global flag if everything is selected
    const all = this.isEverythingSelected();
    this.serverState.setIsAllIndex(all);

    // Emit the selected items to the parent
    this.selectedItemsChange.emit(arr);
    this.cdr.markForCheck();
  }

  // Count all nodes under given nodes (utility - not used in core logic but kept available)
  countAllNodes(nodes: TreeNode[]): number {
    let count = 0;
    const traverse = (list: TreeNode[]) => {
      for (const n of list) {
        count++;
        if (n.children?.length) traverse(n.children);
      }
    };
    traverse(nodes);
    return count;
  }

  // Determine whether everything in the tree is selected
  isEverythingSelected(): boolean {
    if (!this.treeData.length) return false;
    const allKeys = new Set<string>();
    const serverNode = this.treeData[0];
    this.collectSubtreeKeys(serverNode, allKeys);
    return Array.from(allKeys).every((k) => this.selectionSet.has(k));
  }

  // ----------------------------------------------------------------
  // 6) Apply incoming selectedItems (Input) to the tree:
  //    expand branches and lazy-load DBs as needed so selected items are visible/active.
  // ----------------------------------------------------------------
  applySelectionsToTree() {
    if (!this.treeData.length || !this.selectionSet.size) {
      this.cdr.markForCheck();
      return;
    }

    const rootServer = this.treeData[0];

    // For each selected key, attempt to expand path to it.
    // We do not await each expansion so UI is responsive; expandPath handles lazy loading internally.
    for (const sel of this.selectionSet) {
      if (!sel) continue;
      const parts = sel.split('\\').filter((p) => p !== '');
      if (!parts.length) continue;

      let startIndex = 0;
      // If selection contains server as first part, skip it because our DB fullPath is DB-only
      if (rootServer && parts[0] === rootServer.name) {
        startIndex = 1;
      }

      // Fire-and-forget expansion (it uses promises internally)
      this.expandPath(parts.slice(startIndex), rootServer).catch((err) => {
        console.error('expandPath error', err);
      });
    }

    this.cdr.markForCheck();
  }

  // Expand nodes along a path (e.g., ["DB","Tables","Users"]) starting at currentNode
  private async expandPath(pathParts: string[], currentNode?: TreeNode): Promise<void> {
    if (!pathParts || !pathParts.length) return;

    let node = currentNode || this.treeData[0];
    if (!node) return;

    for (let i = 0; i < pathParts.length; i++) {
      const label = pathParts[i];

      // If current node is a DB and children are not loaded, wait for lazy-load
      if (node.icon === 'database' && (!node.children || node.children.length === 0)) {
        await this.lazyLoadDatabaseChildrenIfNeeded(node);
      }

      const children = node.children || [];
      const foundChild = children.find((c) => c.name === label);

      if (!foundChild) {
        // Try to match leaf by fullPath (in case node naming differs)
        const rootServer = this.treeData[0];
        const candidateFull = [rootServer?.name, node.fullPath ?? node.name, label].filter(Boolean).join('\\');
        const leaf = children.find((c) => c.fullPath === candidateFull || (c.isLeaf && c.name === label));
        if (leaf) {
          // nothing else to do
          return;
        }
        // Could not find a match: stop
        return;
      }

      // Expand found child and continue down the path
      foundChild.expanded = true;
      this.cdr.markForCheck();

      if (i === pathParts.length - 1) {
        // reached the target
        return;
      } else {
        node = foundChild;
      }
    }
  }

  // ----------------------------------------------------------------
  // 7) New: produce list of explicitly selected database names
  //    This is per your requested behavior: only DBs whose checkbox is checked
  // ----------------------------------------------------------------
  private getSelectedDatabases(): string[] {
    const dbSet = new Set<string>();

    for (const key of this.selectionSet) {
      const parts = key.split('\\');

      // database is always the first part
      const dbName = parts[0];

      // skip server name
      if (dbName === this.treeData[0]?.name) continue;

      dbSet.add(dbName);
    }

    return Array.from(dbSet);
  }

  // ----------------------------------------------------------------
  // 8) Public API: getFormData() returns the object structure you can submit
  //    Important: databaseName is an array of strings per your new requirement
  // ----------------------------------------------------------------
  getFormData() {
    const dbMap: Record<string, Selection[]> = {};

    for (const key of this.selectionSet) {
      const parts = key.split('\\');
      const dbName = parts[0];

      // Skip if it's the server node
      if (dbName === this.treeData[0]?.name) continue;

      // Skip folders (objectType === objectName)
      if (parts.length < 3) continue;

      const objectType = parts[1];
      const objectName = parts[parts.length - 1];

      if (!dbMap[dbName]) dbMap[dbName] = [];
      dbMap[dbName].push({ objectType, objectName });
    }

    const databases = Object.keys(dbMap).map((db) => ({
      databaseName: db,
      selections: dbMap[db],
    }));

    return {
      databases: databases,
      serverConnection: this.serverConnection,
    };
  }

  // Validate there's at least one selection
  validate(): boolean {
    return this.selectionSet.size > 0;
  }

  // Database nodes have no backslash in the original fullPath convention
  isDatabaseNode(key: string): boolean {
    return !key.includes('\\');
  }

  // ----------------------------------------------------------------
  // 9) UI helpers: trackBy for ngFor and icon mapping helpers
  // ----------------------------------------------------------------
  trackByName(_: number, item: TreeNode) {
    return item?.fullPath ?? item?.name;
  }

  private getFolderIcon(folder: string, fullPath: string): string {
    const lowerPath = (fullPath ?? folder ?? '').toLowerCase();

    if (lowerPath.includes('database diagrams')) return 'diagram';
    if (lowerPath.includes('programmability')) return 'function';
    if (lowerPath.includes('security')) return 'key';
    if (lowerPath.includes('tables')) return 'table';
    return 'folder';
  }

  private getItemIcon(itemName: string, folderPath: string): string {
    const lowerItem = (itemName ?? '').toLowerCase();
    const lowerFolder = (folderPath ?? '').toLowerCase();

    if (lowerFolder.includes('function')) {
      if (lowerFolder.includes('scalar-valued')) return 'function';
      if (lowerFolder.includes('table-valued')) return 'table';
      return 'function';
    }

    if (lowerFolder.includes('stored procedure') || lowerItem.startsWith('sp_')) return 'stored-procedure';
    if (lowerFolder.includes('table') || lowerItem.startsWith('tbl_')) return 'table';
    if (lowerFolder.includes('view') || lowerItem.startsWith('vw_')) return 'view';

    // default
    return 'document-duplicate';
  }

  getSvgIcon(icon: string): string {
    const svgIcons: Record<string, string> = {
      server: 'server.svg',
      database: 'circle-stack.svg',
      folder: 'folder.svg',
      table: 'table-cells.svg',
      diagram: 'chart-pie.svg',
      view: 'eye.svg',
      function: 'code-bracket.svg',
      'stored-procedure': 'cpu-chip.svg',
      key: 'key.svg',
      constraint: 'link.svg',
      user: 'user.svg',
      'document-duplicate': 'document-duplicate.svg',
    };
    return `assets/icons/heroicons/outline/${svgIcons[icon] || 'folder.svg'}`;
  }

  getIconColor(icon: string): string {
    switch (icon) {
      case 'database':
        return 'text-blue-400';
      case 'table':
        return 'text-green-400';
      case 'view':
        return 'text-yellow-400';
      case 'stored-procedure':
        return 'text-purple-400';
      case 'function':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  }
}

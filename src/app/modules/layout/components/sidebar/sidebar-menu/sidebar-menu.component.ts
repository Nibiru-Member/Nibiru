// sidebar-menu.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, of } from 'rxjs';
import { take, finalize, catchError } from 'rxjs/operators';

import { MenuService } from '../../../services/menu.service';
import { SidebarService } from 'src/app/core/services/Sidebar/sidebar.service';
import { ServerComponent } from 'src/app/shared/dialogs/server/server.component';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerConnection, ServerStateService } from 'src/app/core/services/server-state.service';

interface TreeNode {
  name: string;
  icon: string;
  children: TreeNode[];
  expanded?: boolean;
  isLeaf?: boolean;
  fullPath?: string;
}

interface DatabaseObject {
  folder?: string;
  item?: string;
}

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuComponent implements OnInit, OnDestroy {
  // DI
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private sidebarService = inject(SidebarService);
  private serverState = inject(ServerStateService);
  private toast = inject(ToasterService);
  public menuService = inject(MenuService);

  // lifecycle
  private destroy$ = new Subject<void>();

  // UI & data
  showTree = false;
  treeData: TreeNode[] = [];
  isLoading = false;
  errorMessage = '';
  currentConnection: ServerConnection | null = null;
  private loadedDatabaseChildren = new Set<string>();
  private subs = new Subscription();

  ngOnInit(): void {
    // Listen for connection changes
    const connSub = this.serverState
      .onConnectionChange()
      .pipe()
      .subscribe((conn) => {
        this.currentConnection = conn;
        // Reset internal caches
        this.loadedDatabaseChildren.clear();
        if (conn) {
          this.loadDatabases(conn);
        } else {
          this.resetSidebar();
          this.cdr.markForCheck();
        }
      });

    // Breadcrumb clicks: expand tree to hierarchy index
    const bcSub = this.serverState
      .onBreadcrumbClick()
      .pipe()
      .subscribe((index) => {
        if (index === null || index === undefined) return;
        this.expandToHierarchy(index);
      });

    this.subs.add(connSub);
    this.subs.add(bcSub);
  }

  // ----------------------------
  // 1) Databases loader (lazy + safe)
  // ----------------------------
  loadDatabases(conn: ServerConnection): void {
    if (!conn) {
      this.resetSidebar();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.sidebarService
      .getDatabases(conn)
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error('getDatabases error', err);
          this.errorMessage = 'Unable to load databases.';
          this.serverState.setDatabaseListLoaded(false);
          this.cdr.markForCheck();
          return of(null);
        }),
      )
      .subscribe((res: any) => {
        const dbs = res?.data?.databases || [];
        if (dbs.length) {
          this.treeData = [
            {
              name: conn.server,
              icon: 'server',
              expanded: true,
              children: dbs.map((db: string) => ({
                name: db,
                icon: 'database',
                expanded: false,
                children: [],
                isLeaf: false,
                fullPath: db,
              })),
            } as TreeNode,
          ];
          this.serverState.setDatabaseListLoaded(true);
        } else {
          this.treeData = [];
          this.serverState.setDatabaseListLoaded(false);
        }
        this.cdr.markForCheck();
      });
  }

  // ----------------------------
  // 2) Toggle node (expand/collapse + controlled hierarchy updates)
  // ----------------------------
  toggleNode(node: TreeNode, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!node) return;

    // Leaf selection
    if (node.isLeaf) {
      const full = node.fullPath || node.name;
      const parts = full.split('\\').filter((p) => p !== '');
      const serverName = this.currentConnection?.server;
      const dbName = this.serverState.getSelectedDatabase();

      if (serverName) {
        if (parts[0] !== serverName) parts.unshift(serverName);
        if (dbName && !parts.includes(dbName)) parts.splice(1, 0, dbName);
      }

      this.serverState.setHierarchy(parts);
      if (parts.length >= 2) {
        this.serverState.setSelectedDatabase(parts[1], { updateHierarchy: false });
      }

      // === NEW: determine type (table or index) by analyzing fullPath structure
      // Assumed structure: ...\Tables\{TableName}\Indexes\{IndexName}
      let tableName: string | null = null;
      let indexName: string | null = null;

      const normalizedParts = parts.map((p) => p.trim());
      const lcParts = normalizedParts.map((p) => p.toLowerCase());

      // Detect "tables" folder position
      const tablesPos = lcParts.findIndex((p) => p === 'tables');
      if (tablesPos >= 0 && normalizedParts.length > tablesPos + 1) {
        // Tables is the token after "Tables"
        tableName = normalizedParts[tablesPos + 1];

        // If there's an "indexes" folder after the table, set indexName from next token
        const indexesPos = lcParts.findIndex((p, idx) => idx > tablesPos && (p === 'indexes' || p === 'index'));
        if (indexesPos >= 0 && normalizedParts.length > indexesPos + 1) {
          indexName = normalizedParts[indexesPos + 1];
        } else {
          // If the leaf itself is the table row (i.e., clicking table item), indexName stays null
          indexName = null;
        }
      } else {
        // Fallback: if path contains "indexes" directly, find nearest table by scanning left
        const idxPos = lcParts.findIndex((p) => p === 'indexes' || p === 'index');
        if (idxPos >= 0) {
          if (normalizedParts.length > idxPos + 1) {
            indexName = normalizedParts[idxPos + 1];
          }
          // try to locate table name as token immediately left of 'indexes' (or earlier)
          if (idxPos - 1 >= 0) {
            // typical structure: ...\Tables\{TableName}\Indexes\{IndexName}
            // attempt to find 'Tables' earlier and use the token after it
            const earlierTables = lcParts.findIndex((p) => p === 'tables');
            if (earlierTables >= 0 && normalizedParts.length > earlierTables + 1) {
              tableName = normalizedParts[earlierTables + 1];
            } else if (idxPos - 1 >= 0) {
              // fallback: take the token left of 'indexes' as table
              tableName = normalizedParts[idxPos - 1];
            }
          }
        } else {
          // final fallback heuristics:
          // If parts look like [server, db, table, ...] assume parts[2] is table
          if (normalizedParts.length >= 3) {
            tableName = normalizedParts[2];
          }
        }
      }

      // Persist values correctly:
      // - If we detected an index (indexName present) save both tableName and indexName.
      // - If only tableName detected, save tableName and clear index.
      // - Otherwise clear both to avoid stale data.
      if (tableName) {
        this.serverState.setSelectedTableName(tableName);
      } else {
        this.serverState.setSelectedTableName(null);
      }

      if (indexName) {
        this.serverState.setSelectedIndexName(indexName);
      } else {
        this.serverState.setSelectedIndexName(null);
      }

      // === TRIGGER INDEX REFRESH IF INDEX SELECTED ===
      // Only fire when user clicked a real index leaf (indexName exists)
      if (indexName) {
        const db = this.serverState.getSelectedDatabase();
        if (db) {
          // trigger NFT to call index-related APIs
          this.serverState.triggerIndexRefresh();
        }
      } else {
        // If user clicked a table (not index), clear index selection and do not trigger index APIs
        // (The above setSelectedIndexName(null) already handled clearing state)
      }

      this.cdr.markForCheck();
      return;
    }

    // Toggle expansion state
    node.expanded = !node.expanded;

    // If collapsed a database node, clear selected database & reset breadcrumb to server root
    if (node.icon === 'database' && !node.expanded) {
      this.serverState.setSelectedDatabase(null, { updateHierarchy: true });
      this.serverState.setHierarchy([this.currentConnection?.server || '']);
      this.cdr.markForCheck();
      return;
    }

    // Compute node full path (build path to this node)
    const nodeFullPath = node.fullPath || this.computeFullPathForNode(node);
    const parts = nodeFullPath ? nodeFullPath.split('\\').filter((p) => p !== '') : [];

    // ensure server and db are present in parts
    const serverName = this.currentConnection?.server;
    const dbName = this.serverState.getSelectedDatabase();
    if (serverName) {
      if (parts[0] !== serverName) parts.unshift(serverName);
      if (dbName && !parts.includes(dbName)) parts.splice(1, 0, dbName);
    }

    // If a database node got expanded, we want to explicitly select that DB and update hierarchy together
    if (node.icon === 'database' && node.expanded) {
      this.serverState.setSelectedDatabase(null, { updateHierarchy: false });
      setTimeout(() => {
        this.serverState.setSelectedDatabase(node.name, { updateHierarchy: true });
        this.serverState.setHierarchy(parts);
        this.lazyLoadDatabaseChildrenIfNeeded(node);
        this.cdr.markForCheck();
      });
      return;
    }

    // For regular folder expansion, update hierarchy only (do not change selected database)
    this.serverState.setHierarchy(parts);

    // For folder expansions under a database, lazy load children if needed
    if (this.currentConnection && node.icon === 'database' && node.expanded) {
      this.lazyLoadDatabaseChildrenIfNeeded(node);
    } else {
      this.cdr.markForCheck();
    }
  }

  // ----------------------------
  // 3) Lazy-load DB objects only once per DB node
  // ----------------------------
  private lazyLoadDatabaseChildrenIfNeeded(dbNode: TreeNode) {
    if (!this.currentConnection || !dbNode || dbNode.icon !== 'database') return;
    const dbKey = `${this.currentConnection.server}::${dbNode.name}`;
    if (this.loadedDatabaseChildren.has(dbKey)) return;

    this.loadedDatabaseChildren.add(dbKey);

    const params = {
      ServerName: this.currentConnection.server,
      UserName: this.currentConnection.username,
      Password: this.currentConnection.password,
      DatabaseName: dbNode.name,
    };

    this.sidebarService
      .getDatabaseObjectsFromServer(params)
      .pipe(
        take(1),
        catchError((err) => {
          console.error('Error loading database objects:', err);
          this.toast.error(`Failed to load objects for ${dbNode.name}`);
          this.loadedDatabaseChildren.delete(dbKey);
          return of(null);
        }),
      )
      .subscribe((res: any) => {
        const data: DatabaseObject[] = res?.data || [];
        if (!data.length) {
          dbNode.children = [];
          this.toast.warning(`No objects found in ${dbNode.name}`);
          this.cdr.markForCheck();
          return;
        }
        dbNode.children = this.buildNestedTree(data);
        dbNode.expanded = true;
        this.toast.success(`${data.length} objects loaded for ${dbNode.name}`);
        this.cdr.markForCheck();
      });
  }

  // ----------------------------
  // 4) Build nested tree from DB objects
  // ----------------------------
  buildNestedTree(records: DatabaseObject[]): TreeNode[] {
    const root: any = {};
    records.forEach((record) => {
      const folderPath = record.folder || 'Uncategorized';
      const itemName = record.item || 'Unknown Item';
      const parts = folderPath.split('\\').filter((p) => p.trim() !== '');
      let currentLevel = root;
      parts.forEach((part) => {
        if (!currentLevel[part]) currentLevel[part] = { _items: [] };
        currentLevel = currentLevel[part];
      });
      currentLevel._items.push({ name: itemName, folder: folderPath });
    });
    return this.convertToTreeNodes(root);
  }

  private convertToTreeNodes(obj: any, currentPath: string = ''): TreeNode[] {
    const nodes: TreeNode[] = [];
    Object.keys(obj).forEach((key) => {
      if (key === '_items') return;
      const currentObj = obj[key];
      const newPath = currentPath ? `${currentPath}\\${key}` : key;
      const childFolders = this.convertToTreeNodes(currentObj, newPath);

      const itemNodes: TreeNode[] = currentObj._items
        ? currentObj._items.map((item: any) => ({
            name: item.name,
            icon: this.getItemIcon(item.name, item.folder),
            children: [],
            isLeaf: true,
            fullPath: `${newPath}\\${item.name}`,
          }))
        : [];

      nodes.push({
        name: key,
        icon: this.getFolderIcon(key, newPath),
        expanded: false,
        children: [...childFolders, ...itemNodes],
        isLeaf: false,
        fullPath: newPath,
      });
    });
    return nodes;
  }

  // ----------------------------
  // 5) Path computation (DFS)
  // ----------------------------
  private computeFullPathForNode(target: TreeNode): string {
    const serverNode = this.treeData?.[0];
    if (!serverNode) return target.name;
    const path: string[] = [];
    let found = false;

    const dfs = (node: TreeNode, stack: string[]) => {
      if (found) return;
      stack.push(node.name);
      if (node === target || (node.fullPath && target.fullPath && node.fullPath === target.fullPath)) {
        path.push(...stack);
        found = true;
        stack.pop();
        return;
      }
      (node.children || []).forEach((child) => !found && dfs(child, stack));
      stack.pop();
    };

    dfs(serverNode, []);
    if (path[0] === this.currentConnection?.server) path.shift();
    return path.join('\\');
  }

  // ----------------------------
  // 6) Expand tree to breadcrumb hierarchy index
  // ----------------------------
  expandToHierarchy(levelIndex: number): void {
    const hierarchy = this.serverState.getHierarchy();
    if (!hierarchy?.length || !this.treeData.length) return;

    const serverNode = this.treeData[0];
    let currentNode: TreeNode | undefined = serverNode;

    for (let i = 1; i <= levelIndex; i++) {
      const label = hierarchy[i];
      if (!label) break;
      const child: any = (currentNode?.children || []).find((c) => c.name === label);
      if (!child) {
        if (currentNode?.icon === 'database' && (!currentNode.children || currentNode.children.length === 0)) {
          const params: any = {
            ServerName: this.currentConnection?.server,
            UserName: this.currentConnection?.username,
            Password: this.currentConnection?.password,
            DatabaseName: currentNode.name,
          };
          this.sidebarService
            .getDatabaseObjectsFromServer(params)
            .pipe(take(1))
            .subscribe({
              next: (res: any) => {
                const data: DatabaseObject[] = res?.data || [];
                if (data.length) {
                  currentNode!.children = this.buildNestedTree(data);
                  currentNode!.expanded = true;
                  const foundChild = currentNode!.children.find((c) => c.name === label);
                  if (foundChild) {
                    foundChild.expanded = true;
                    currentNode = foundChild;
                  }
                }
                this.cdr.markForCheck();
              },
              error: () => this.cdr.markForCheck(),
            });
          return;
        }
        break;
      }
      child.expanded = true;
      currentNode = child;
    }
    this.cdr.markForCheck();
  }

  // ----------------------------
  // 7) Icon mapping helpers
  // ----------------------------
  private getFolderIcon(folder: string, fullPath: string): string {
    const lowerPath = fullPath.toLowerCase();
    if (lowerPath.includes('database diagrams')) return 'diagram';
    if (lowerPath.includes('programmability')) {
      if (lowerPath.includes('functions')) {
        if (lowerPath.includes('scalar-valued')) return 'function';
        if (lowerPath.includes('table-valued')) return 'table';
        return 'function';
      }
      if (lowerPath.includes('stored procedures')) return 'stored-procedure';
      return 'function';
    }
    if (lowerPath.includes('security')) {
      if (lowerPath.includes('users')) return 'user';
      return 'key';
    }
    if (lowerPath.includes('tables')) {
      if (lowerPath.includes('columns')) return 'document-duplicate';
      return 'table';
    }
    const lower = folder.toLowerCase();
    if (lower.includes('diagram')) return 'diagram';
    if (lower.includes('function')) return 'function';
    if (lower.includes('procedure')) return 'stored-procedure';
    if (lower.includes('table')) return 'table';
    if (lower.includes('view')) return 'view';
    if (lower.includes('security')) return 'key';
    if (lower.includes('user')) return 'user';
    return 'folder';
  }

  private getItemIcon(itemName: string, folderPath: string): string {
    const lowerItem = itemName.toLowerCase();
    const lowerFolder = folderPath.toLowerCase();
    if (lowerFolder.includes('function')) {
      if (lowerFolder.includes('scalar-valued')) return 'function';
      if (lowerFolder.includes('table-valued')) return 'table';
      return 'function';
    }
    if (lowerFolder.includes('stored procedure')) return 'stored-procedure';
    if (lowerFolder.includes('table')) return 'table';
    if (lowerFolder.includes('view')) return 'view';
    if (lowerFolder.includes('diagram')) return 'diagram';
    if (lowerFolder.includes('user')) return 'user';
    if (lowerItem.startsWith('sp_') || lowerItem.startsWith('usp_')) return 'stored-procedure';
    if (lowerItem.startsWith('fn_') || lowerItem.includes('function')) return 'function';
    if (lowerItem.startsWith('vw_') || lowerItem.includes('view')) return 'view';
    if (lowerItem.includes('constraint')) return 'link';
    if (lowerItem.includes('key')) return 'key';
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
      case 'diagram':
        return 'text-pink-400';
      case 'key':
        return 'text-red-400';
      case 'constraint':
        return 'text-indigo-400';
      case 'user':
        return 'text-teal-400';
      default:
        return 'text-gray-400';
    }
  }

  // ----------------------------
  // 8) Helpers, disconnect, dialogs
  // ----------------------------
  toggleSidebar(): void {
    this.showTree = !this.showTree;
  }

  disconnectServer(): void {
    if (!this.currentConnection) return;
    const authUser = localStorage.getItem('authObj');
    const parsedUser = authUser ? JSON.parse(authUser) : null;
    const userId = parsedUser?.userId;
    const storedConn = this.serverState.getConnection();
    const connectionId = storedConn?.connectionID || storedConn?.innerConnectionID;
    if (!userId || !connectionId) {
      this.toast.error('Missing user or connection details.');
      return;
    }

    this.sidebarService.disconnectedServerConnection(userId, connectionId).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.serverState.clearConnection();
          this.resetSidebar();
          this.toast.success('Disconnected successfully');
          this.cdr.markForCheck();
        } else {
          this.toast.warning(res?.message || 'Server disconnect failed.');
        }
      },
      error: (err) => {
        console.error('Disconnect API Error:', err);
        this.toast.error('Failed to disconnect server.');
      },
    });
  }

  openServerDialog(): void {
    this.dialog.open(ServerComponent, { disableClose: true });
  }

  resetSidebar(): void {
    this.treeData = [];
    this.isLoading = false;
    this.errorMessage = '';
    this.showTree = false;
    this.loadedDatabaseChildren.clear();
    this.serverState.setDatabaseListLoaded(false);
    this.cdr.markForCheck();
  }

  // trackBy for ngFor performance
  trackByName(_: number, item: TreeNode) {
    return item?.fullPath || item?.name;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subs.unsubscribe();
  }
}

// server-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ServerConnection {
  server: string;
  username: string;
  password: string;
  connectionID?: string;
  innerConnectionID?: string;
}

const STORAGE_KEY = 'lastServerConnection';
const STORAGE_DB_KEY = 'lastSelectedDatabase';
const STORAGE_HIER_KEY = 'lastHierarchy';
const STORAGE_IS_ALL_INDEX = 'lastIsAllIndex';
// NEW: storage keys for selected table name and index name
const STORAGE_SELECTED_TABLE_NAME = 'lastSelectedTableName';
const STORAGE_SELECTED_INDEX_NAME = 'lastSelectedIndexName';

@Injectable({ providedIn: 'root' })
export class ServerStateService {
  private connection$ = new BehaviorSubject<ServerConnection | null>(this.loadConnectionFromStorage());
  private selectedDatabase$ = new BehaviorSubject<string | null>(this.loadDbFromStorage());

  // suggested: explicit flag to indicate that the *list* of databases has been loaded
  private databaseListLoaded$ = new BehaviorSubject<boolean>(false);
  private isAllIndex$ = new BehaviorSubject<boolean>(this.loadIsAllIndexFromStorage());

  // whole hierarchy for breadcrumbs (e.g. [server, db, folder, ...])
  private hierarchy$ = new BehaviorSubject<string[]>(this.loadHierarchyFromStorage() || []);
  // breadcrumb click events (emit index)
  private breadcrumbClick$ = new BehaviorSubject<number | null>(null);

  // NEW: BehaviorSubjects for selected table name & selected index name
  private selectedTableName$ = new BehaviorSubject<string | null>(this.loadSelectedTableNameFromStorage());
  private selectedIndexName$ = new BehaviorSubject<string | null>(this.loadSelectedIndexNameFromStorage());

  // NEW: event for index refresh trigger (when user explicitly clicks an index in Sidebar)
  private indexRefresh$ = new BehaviorSubject<boolean>(false);

  setConnection(conn: ServerConnection): void {
    this.connection$.next(conn);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conn));
    } catch {}
  }

  clearConnection(): void {
    this.connection$.next(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    this.setSelectedDatabase(null, { updateHierarchy: true });
    this.setHierarchy([]);
    this.setDatabaseListLoaded(false);

    // Optionally clear selected table/index when connection clears
    // Keep this behavior to ensure no stale table/index remain after disconnect.
    this.setSelectedTableName(null);
    this.setSelectedIndexName(null);
  }

  getConnection(): ServerConnection | null {
    return this.connection$.value;
  }

  onConnectionChange() {
    return this.connection$.asObservable();
  }
  setIsAllIndex(value: boolean): void {
    this.isAllIndex$.next(value);
    try {
      localStorage.setItem(STORAGE_IS_ALL_INDEX, JSON.stringify(value));
    } catch {}
  }

  getIsAllIndex(): boolean {
    return this.isAllIndex$.value;
  }

  onIsAllIndexChange() {
    return this.isAllIndex$.asObservable();
  }
  loadIsAllIndexFromStorage(): boolean {
    try {
      const val = localStorage.getItem(STORAGE_IS_ALL_INDEX);
      return val ? JSON.parse(val) : false;
    } catch {
      return false;
    }
  }

  /**
   * Set selected database. options.updateHierarchy (default true) controls whether
   * this call should also mutate the hierarchy array. This prevents accidental
   * overwrites coming from different UI pieces.
   */
  setSelectedDatabase(dbName: string | null, options: { updateHierarchy?: boolean } = { updateHierarchy: true }): void {
    this.selectedDatabase$.next(dbName);
    try {
      if (dbName) localStorage.setItem(STORAGE_DB_KEY, dbName);
      else localStorage.removeItem(STORAGE_DB_KEY);
    } catch {}

    if (options.updateHierarchy) {
      // also update hierarchy root db if present
      let h = (this.hierarchy$.value || []).slice();
      if (dbName) {
        // ensure server exists at index 0
        if (!h || h.length === 0) h = [this.connection$.value?.server || '', dbName];
        else if (h.length === 1) h.push(dbName);
        else h[1] = dbName;
      } else {
        // remove all after server (keep server if exists)
        h = h.length ? [h[0]] : [];
      }
      this.setHierarchy(h);
    }
  }

  getSelectedDatabase(): string | null {
    return this.selectedDatabase$.value;
  }

  onSelectedDatabaseChange() {
    return this.selectedDatabase$.asObservable();
  }

  // DATABASE LIST LOADED FLAG
  setDatabaseListLoaded(loaded: boolean) {
    this.databaseListLoaded$.next(loaded);
  }

  isDatabaseListLoaded(): boolean {
    return this.databaseListLoaded$.value;
  }

  onDatabaseListLoaded() {
    return this.databaseListLoaded$.asObservable();
  }

  // set/get whole hierarchy (array of labels)
  setHierarchy(parts: string[]): void {
    this.hierarchy$.next(parts || []);
    try {
      localStorage.setItem(STORAGE_HIER_KEY, JSON.stringify(parts || []));
    } catch {}
  }

  getHierarchy(): string[] {
    return this.hierarchy$.value;
  }

  onHierarchyChange() {
    return this.hierarchy$.asObservable();
  }

  triggerBreadcrumbClick(index: number) {
    this.breadcrumbClick$.next(index);
  }

  onBreadcrumbClick() {
    return this.breadcrumbClick$.asObservable();
  }

  // ----------------------------
  // NEW: Selected Tables Name
  // ----------------------------
  setSelectedTableName(name: string | null): void {
    this.selectedTableName$.next(name);
    try {
      if (name) localStorage.setItem(STORAGE_SELECTED_TABLE_NAME, name);
      else localStorage.removeItem(STORAGE_SELECTED_TABLE_NAME);
    } catch {}
  }

  getSelectedTableName(): any | null {
    return this.selectedTableName$.value;
  }

  onSelectedTableNameChange() {
    return this.selectedTableName$.asObservable();
  }

  private loadSelectedTableNameFromStorage(): string | null {
    try {
      return localStorage.getItem(STORAGE_SELECTED_TABLE_NAME) || null;
    } catch {
      return null;
    }
  }

  // ----------------------------
  // NEW: Selected Index Name
  // ----------------------------
  setSelectedIndexName(name: string | null): void {
    this.selectedIndexName$.next(name);
    try {
      if (name) localStorage.setItem(STORAGE_SELECTED_INDEX_NAME, name);
      else localStorage.removeItem(STORAGE_SELECTED_INDEX_NAME);
    } catch {}
  }

  getSelectedIndexName(): any | null {
    return this.selectedIndexName$.value;
  }

  onSelectedIndexNameChange() {
    return this.selectedIndexName$.asObservable();
  }

  private loadSelectedIndexNameFromStorage(): string | null {
    try {
      return localStorage.getItem(STORAGE_SELECTED_INDEX_NAME) || null;
    } catch {
      return null;
    }
  }

  // ----------------------------
  // NEW: Index refresh trigger (fired by Sidebar when user clicks an Index)
  // ----------------------------
  triggerIndexRefresh() {
    try {
      this.indexRefresh$.next(true);
    } catch {}
  }

  onIndexRefresh() {
    return this.indexRefresh$.asObservable();
  }

  private loadConnectionFromStorage(): ServerConnection | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private loadDbFromStorage(): string | null {
    try {
      return localStorage.getItem(STORAGE_DB_KEY) || null;
    } catch {
      return null;
    }
  }

  private loadHierarchyFromStorage(): string[] | null {
    try {
      const saved = localStorage.getItem(STORAGE_HIER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
}

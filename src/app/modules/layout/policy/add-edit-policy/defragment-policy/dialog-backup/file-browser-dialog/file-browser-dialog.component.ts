import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';

interface FolderNode {
  name: string;
  fullPath: string;
  expanded: boolean;
  children: FolderNode[];
  loaded: boolean;
  hasChildren: boolean; // Indicates if this node has children (for showing expand indicator)
  isDrive?: boolean; // Optional flag to identify drives
}

@Component({
  selector: 'app-file-browser-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './file-browser-dialog.component.html',
  styleUrl: './file-browser-dialog.component.css',
})
export class FileBrowserDialogComponent {
  private dialogRef = inject(MatDialogRef<FileBrowserDialogComponent>);
  private serverState = inject(ServerStateService);
  private serverApi = inject(ServerService);
  private toast = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  data = inject(MAT_DIALOG_DATA, { optional: true });

  drives: any[] = [];
  folderTree: FolderNode[] = [];
  selectedPath = '';
  selectedFileName = '';
  fileFilter = 'Backup Files(*.bak;*.tm)';
  loading = false;
  errorMessage = '';
  serverName = '';

  constructor() {
    if (this.data?.serverName) {
      this.serverName = this.data.serverName;
    }
    if (this.data?.initialPath) {
      this.selectedPath = this.data.initialPath;
    }
  }

  ngOnInit() {
    this.loadDrives();
  }

  loadDrives() {
    const conn = this.serverState.getConnection();
    if (!conn || !this.serverName) return;

    this.loading = true;
    this.cdr.detectChanges();
    this.serverApi.GetDiskDriveListForDropdown(this.serverName, conn.username, conn.password).subscribe({
      next: (resp: any) => {
        this.drives = resp?.data || [];
        this.loading = false;
        this.buildInitialTree();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Unable to load drives.';
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  buildInitialTree() {
    this.folderTree = this.drives.map((drive) => ({
      name: drive.driveLetter,
      fullPath: drive.driveLetter + '\\',
      expanded: false,
      children: [],
      loaded: false,
      hasChildren: false, // Will be set after checking
      isDrive: true,
    }));
    
    // After building tree, check each drive for children (without expanding)
    this.folderTree.forEach((drive) => {
      this.checkForChildren(drive);
    });
  }

  toggleFolder(node: FolderNode) {
    if (!node.expanded) {
      node.expanded = true;
      this.cdr.detectChanges();
      // Only load if not already loaded
      if (!node.loaded && node.hasChildren) {
        this.loadFolderContents(node);
      }
    } else {
      node.expanded = false;
      this.cdr.detectChanges();
    }
  }

  // Check if a node has children (without loading them or expanding)
  // This only sets hasChildren flag, does NOT set loaded=true
  checkForChildren(node: FolderNode) {
    const conn = this.serverState.getConnection();
    if (!conn || !this.serverName) return;

    // Normalize path to "C:\" format (single backslash)
    let pathToLoad = node.fullPath.replace(/\\+/g, '\\');
    if (!pathToLoad.endsWith('\\')) {
      pathToLoad = pathToLoad + '\\';
    }
    
    this.serverApi
      .GetBasicDriveFolderTreeForDropdown(this.serverName, conn.username, conn.password, pathToLoad)
      .subscribe({
        next: (resp: any) => {
          // Check for errors
          if (resp?.statusCode !== 200 || (resp?.message && resp.message.toLowerCase().includes('error'))) {
            node.hasChildren = false;
            this.cdr.detectChanges();
            return;
          }
          
          const folders = resp?.data || [];
          
          // Check if data contains error messages
          if (folders.length > 0 && folders[0]?.fullPath?.startsWith('ERROR:')) {
            node.hasChildren = false;
            this.cdr.detectChanges();
            return;
          }
          
          // Filter to get direct children only
          const parentPath = node.fullPath.endsWith('\\') ? node.fullPath : node.fullPath + '\\';
          const childFolders = folders.filter((f: any) => {
            const folderPath = (f.fullPath || f.path || '').toString();
            return folderPath.toLowerCase().startsWith(parentPath.toLowerCase()) && 
                   folderPath.toLowerCase() !== node.fullPath.toLowerCase();
          });
          
          // Set hasChildren flag (but don't set loaded=true - that's only for when children are actually loaded)
          node.hasChildren = childFolders.length > 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          node.hasChildren = false;
          this.cdr.detectChanges();
          console.error('Error checking for children:', err);
        },
      });
  }

  loadFolderContents(node: FolderNode) {
    const conn = this.serverState.getConnection();
    if (!conn || !this.serverName) return;

    // Set loading state for this specific node
    node.loaded = false;
    this.cdr.detectChanges();
    
    // Normalize path to "C:\" format (single backslash)
    let pathToLoad = node.fullPath.replace(/\\+/g, '\\');
    if (!pathToLoad.endsWith('\\')) {
      pathToLoad = pathToLoad + '\\';
    }
    
    this.serverApi
      .GetBasicDriveFolderTreeForDropdown(this.serverName, conn.username, conn.password, pathToLoad)
      .subscribe({
        next: (resp: any) => {
          // Check for errors in response
          if (resp?.statusCode !== 200 || (resp?.message && resp.message.toLowerCase().includes('error'))) {
            this.errorMessage = resp?.message || 'Unable to load folder contents.';
            node.loaded = true;
            node.children = [];
            node.hasChildren = false;
            this.cdr.detectChanges();
            return;
          }
          
          const folders = resp?.data || [];
          
          // Check if data contains error messages
          if (folders.length > 0 && folders[0]?.fullPath?.startsWith('ERROR:')) {
            this.errorMessage = folders[0].fullPath.replace('ERROR: ', '');
            node.loaded = true;
            node.children = [];
            node.hasChildren = false;
            this.cdr.detectChanges();
            return;
          }
          
          // Filter to get direct children only
          const parentPath = node.fullPath.endsWith('\\') ? node.fullPath : node.fullPath + '\\';
          const childFolders = folders.filter((f: any) => {
            const folderPath = (f.fullPath || f.path || '').toString();
            return folderPath.toLowerCase().startsWith(parentPath.toLowerCase()) && 
                   folderPath.toLowerCase() !== node.fullPath.toLowerCase();
          });
          
          // Create child nodes
          node.children = childFolders.map((f: any) => {
            const fullPath = (f.fullPath || f.path || f.FullPath || '').toString();
            let name = (f.name || f.folderName || f.Name || '').toString();
            
            // If no name, extract from fullPath
            if (!name && fullPath) {
              const parts = fullPath.split('\\').filter((p: string) => p && p.trim());
              name = parts[parts.length - 1] || fullPath;
            }
            
            return {
              name: name || fullPath || 'Unknown',
              fullPath: fullPath || '',
              expanded: false,
              children: [],
              loaded: false,
              hasChildren: false, // Will be checked when user expands
              isDrive: false,
            };
          });

          // After loading children, check each child for its own children
          node.children.forEach((child) => {
            this.checkForChildren(child);
          });

          node.loaded = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = 'Unable to load folder contents.';
          node.loaded = true;
          node.hasChildren = false;
          this.cdr.detectChanges();
          console.error(err);
        },
      });
  }


  selectFolder(node: FolderNode) {
    this.selectedPath = node.fullPath;
    this.selectedFileName = '';
  }

  onFileNameChange() {
    // Update selected path when user types filename
    if (this.selectedPath && this.selectedFileName) {
      const basePath = this.selectedPath.includes('.') ? this.selectedPath.substring(0, this.selectedPath.lastIndexOf('\\') + 1) : this.selectedPath;
      const path = basePath.endsWith('\\') ? basePath : basePath + '\\';
      this.selectedPath = path + this.selectedFileName;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  save() {
    if (!this.selectedPath) {
      this.errorMessage = 'Please select a path.';
      return;
    }

    // Ensure .bak extension if it's a file
    if (this.selectedFileName && !this.selectedPath.toLowerCase().endsWith('.bak')) {
      this.selectedPath = this.selectedPath + '.bak';
    }

    this.dialogRef.close({ fileName: this.selectedPath });
  }

  // Recursive function to render folder tree
  renderFolderTree(nodes: FolderNode[], level: number = 0): void {
    // This is handled in the template with recursive component or ngFor
  }
}


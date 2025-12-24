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
  loading?: boolean; // Flag to prevent multiple simultaneous loads
  checking?: boolean; // Flag to prevent multiple simultaneous checks
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
  baseFolderPath = ''; // Store the base folder path separately
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
      // Extract base folder path from initial path if it contains a filename
      const path = this.data.initialPath;
      const lastBackslash = path.lastIndexOf('\\');
      if (lastBackslash !== -1) {
        const afterBackslash = path.substring(lastBackslash + 1);
        // Check if it looks like a filename (has extension)
        if (afterBackslash.includes('.') && (afterBackslash.toLowerCase().endsWith('.bak') || afterBackslash.toLowerCase().endsWith('.tm'))) {
          this.baseFolderPath = path.substring(0, lastBackslash + 1);
          this.selectedFileName = afterBackslash;
        } else {
          this.baseFolderPath = path.endsWith('\\') ? path : path + '\\';
        }
      } else {
        this.baseFolderPath = path.endsWith('\\') ? path : path + '\\';
      }
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
      loading: false,
      checking: false,
    }));
    
  }

  toggleFolder(node: FolderNode) {
    if (!node.expanded) {
      node.expanded = true;
      this.cdr.detectChanges();
      // Always try to load when expanding if not already loaded
      if (!node.loaded && !node.loading) {
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
    // Prevent multiple simultaneous checks
    if (node.checking) return;
    
    const conn = this.serverState.getConnection();
    if (!conn || !this.serverName) return;

    node.checking = true;

    // Normalize path to "C:\" format (single backslash)
    let pathToLoad = node.fullPath.replace(/\\+/g, '\\');
    if (!pathToLoad.endsWith('\\')) {
      pathToLoad = pathToLoad + '\\';
    }
    
    this.serverApi
      .GetBasicDriveFolderTreeForDropdown(this.serverName, conn.username, conn.password, pathToLoad)
      .subscribe({
        next: (resp: any) => {
          node.checking = false;
          
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
          node.checking = false;
          node.hasChildren = false;
          this.cdr.detectChanges();
          console.error('Error checking for children:', err);
        },
      });
  }

  loadFolderContents(node: FolderNode) {
    // Prevent multiple simultaneous loads
    if (node.loading || node.loaded) return;
    
    const conn = this.serverState.getConnection();
    if (!conn || !this.serverName) return;

    // Set loading state for this specific node
    node.loading = true;
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
          node.loading = false;
          
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
          
          // Use all folders returned by the API directly (no filtering needed)
          // Create child nodes
          node.children = folders.map((f: any) => {
            const fullPath = (f.fullPath || f.path || f.FullPath || '').toString().trim();
            let name = (f.name || f.folderName || f.Name || '').toString().trim();
            
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
              loading: false,
              checking: false,
            };
          });

          // Set hasChildren based on actual children loaded
          node.hasChildren = node.children.length > 0;

          node.loaded = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          node.loading = false;
          this.errorMessage = 'Unable to load folder contents.';
          node.loaded = true;
          node.hasChildren = false;
          this.cdr.detectChanges();
          console.error(err);
        },
      });
  }


  selectFolder(node: FolderNode) {
    this.baseFolderPath = node.fullPath.endsWith('\\') ? node.fullPath : node.fullPath + '\\';
    this.selectedPath = this.baseFolderPath;
    this.selectedFileName = '';
    this.errorMessage = ''; // Clear error when selecting new folder
  }

  onFileNameChange() {
    // Clear error message when user types
    this.errorMessage = '';
    
    // Ensure baseFolderPath is set (fallback to selectedPath if not set)
    if (!this.baseFolderPath && this.selectedPath) {
      // Extract base path from current selectedPath if it contains a filename
      const lastBackslash = this.selectedPath.lastIndexOf('\\');
      if (lastBackslash !== -1) {
        const potentialBase = this.selectedPath.substring(0, lastBackslash + 1);
        // Check if the part after last backslash looks like a filename (has extension)
        const afterBackslash = this.selectedPath.substring(lastBackslash + 1);
        if (afterBackslash.includes('.') && (afterBackslash.toLowerCase().endsWith('.bak') || afterBackslash.toLowerCase().endsWith('.tm'))) {
          this.baseFolderPath = potentialBase;
        } else {
          this.baseFolderPath = this.selectedPath.endsWith('\\') ? this.selectedPath : this.selectedPath + '\\';
        }
      } else {
        this.baseFolderPath = this.selectedPath.endsWith('\\') ? this.selectedPath : this.selectedPath + '\\';
      }
    }

    // Update selected path based on filename
    if (this.selectedFileName && this.selectedFileName.trim()) {
      // User is typing a filename - append it to base path
      const fileName = this.selectedFileName.trim();
      this.selectedPath = this.baseFolderPath + fileName;
    } else {
      // User deleted the filename - reset to base folder path
      this.selectedPath = this.baseFolderPath;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  save() {
    // Clear previous error messages
    this.errorMessage = '';

    // Validation 1: Check if path is selected
    if (!this.selectedPath || this.selectedPath.trim() === '') {
      this.errorMessage = 'Please select a path.';
      this.cdr.detectChanges();
      return;
    }

    const trimmedPath = this.selectedPath.trim();
    const trimmedFileName = (this.selectedFileName || '').trim();

    // Determine the actual filename to validate
    // Check if selectedPath already contains a filename (has an extension)
    let fileNameToValidate = '';
    let finalPath = trimmedPath;

    // Check if path ends with .bak or .tm (filename already in path)
    const lowerPath = trimmedPath.toLowerCase();
    if (lowerPath.endsWith('.bak') || lowerPath.endsWith('.tm')) {
      // Extract filename from path
      const lastBackslash = trimmedPath.lastIndexOf('\\');
      if (lastBackslash !== -1) {
        fileNameToValidate = trimmedPath.substring(lastBackslash + 1);
      } else {
        fileNameToValidate = trimmedPath;
      }
    } else if (trimmedFileName) {
      // Use the filename from input field
      fileNameToValidate = trimmedFileName;
      // Build full path
      const basePath = trimmedPath.endsWith('\\') ? trimmedPath : trimmedPath + '\\';
      finalPath = basePath + trimmedFileName;
    } else {
      // No filename provided
      this.errorMessage = 'Please enter a file name.';
      this.cdr.detectChanges();
      return;
    }

    // Validation 2: Check file extension (.bak or .tm)
    const lowerFileName = fileNameToValidate.toLowerCase();
    if (!lowerFileName.endsWith('.bak') && !lowerFileName.endsWith('.tm')) {
      this.errorMessage = 'File name extension must be .bak or .tm';
      this.cdr.detectChanges();
      return;
    }

    // All validations passed, close dialog with the result
    console.log('FileBrowserDialog closing with result:', { fileName: finalPath });
    this.dialogRef.close({ fileName: finalPath });
  }

  // Recursive function to render folder tree
  renderFolderTree(nodes: FolderNode[], level: number = 0): void {
    // This is handled in the template with recursive component or ngFor
  }
}


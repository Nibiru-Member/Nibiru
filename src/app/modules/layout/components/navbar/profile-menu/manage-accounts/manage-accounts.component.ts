import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { catchError, EMPTY, take } from 'rxjs';
import { AuthResponse } from 'src/app/core/models/auth.model';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { UserService } from 'src/app/core/services/user/user.service';

interface User {
  name: string;
  email: string;
  avatar: string;
  role?: string;
  servers?: string[];
  database?: string;
}

@Component({
  selector: 'app-manage-accounts',
  imports: [CommonModule, AngularSvgIconModule],
  templateUrl: './manage-accounts.component.html',
  styleUrl: './manage-accounts.component.css',
})
export class ManageAccountsComponent {
  expandedIndex: number | null = null;

  users: User[] = [
    { name: 'Manuel Velazquez', email: 'mvelazquez@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Efrén Corona', email: 'msanchez@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Miguel Angel Villa', email: 'mvilla@itexico.com', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Rishwan Muneer', email: 'rmuneer@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Getsemaní Anzar', email: 'ganzar@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Alejandro Villa', email: 'avilla@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Martino Liu', email: 'mliu@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Christian Díaz', email: 'cdiaz@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Cristina Vázquez', email: 'cvazquez@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Victor Medina', email: 'mliu@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
    { name: 'Roxana Rodriguez', email: 'cdiaz@itexico.net', avatar: 'assets/logo/dummy-avatar.jpg' },
  ];

  toggleExpand(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  // action handlers (example)
  onEdit(user: User): void {
    // implement edit behavior
  }

  onDelete(user: User): void {
    // implement delete behavior
  }
}

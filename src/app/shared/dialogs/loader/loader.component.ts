import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  imports: [CommonModule],
  styleUrls: ['./loader.component.css'],
})
export class LoaderComponent {
  @Input() isLoading = true;
  @Input() message = 'Loading...';
} 
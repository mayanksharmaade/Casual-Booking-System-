import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminStore } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Stores</h1>
    <p class="lead">Store status is preserved historically; operational stores are deactivated rather than hard-deleted.</p>
    <div class="panel">
      <table *ngIf="rows.length">
        <thead><tr><th>Code</th><th>Store</th><th>City</th><th>Zone</th><th>Approval</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let s of rows">
            <td>{{ s.code }}</td><td>{{ s.name }}</td><td>{{ s.city }}</td><td>{{ s.zoneName }}</td>
            <td>{{ approval(s.registrationStatus) }}</td><td>{{ s.isActive ? 'Active' : 'Inactive' }}</td>
            <td><button type="button" (click)="toggle(s)" [disabled]="processingId === s.id || s.registrationStatus !== 2">{{ s.isActive ? 'Deactivate' : 'Activate' }}</button></td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!loading && !rows.length">No stores found.</div>
      <div class="error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styleUrls: ['../page.scss']
})
export class StoresComponent implements OnInit {
  rows: AdminStore[] = [];
  loading = false;
  processingId: number | null = null;
  error = '';
  constructor(private api: AdminApiService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.api.stores().pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); })).subscribe({
      next: rows => { this.rows = rows; this.cdr.detectChanges(); },
      error: e => { this.error = e?.error?.message ?? 'Unable to load stores.'; this.cdr.detectChanges(); }
    });
  }
  toggle(s: AdminStore): void {
    if (this.processingId !== null || s.registrationStatus !== 2) return;
    const nextState = !s.isActive;
    this.processingId = s.id; this.error = '';
    this.api.setStoreActive(s.id, nextState).pipe(finalize(() => { this.processingId = null; this.cdr.detectChanges(); })).subscribe({
      next: () => { this.rows = this.rows.map(x => x.id === s.id ? { ...x, isActive: nextState } : x); this.cdr.detectChanges(); },
      error: e => { this.error = e?.error?.message ?? 'Unable to update store status.'; this.cdr.detectChanges(); }
    });
  }
  approval(v: number) { return ({1:'Pending',2:'Approved',3:'Rejected'} as any)[v] || v; }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../services/admin-api.service';
import { UserAccount } from '../../models/api.models';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Users</h1>
    <p class="lead">Activate or deactivate approved platform accounts without deleting history.</p>
    <div class="panel">
      <table *ngIf="rows.length">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Approval</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let u of rows">
            <td>{{ u.firstName }} {{ u.lastName }}</td><td>{{ u.email }}</td><td>{{ role(u.role) }}</td>
            <td>{{ approval(u.approvalStatus) }}</td>
            <td><span class="badge" [class.good]="u.isActive">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
            <td><button type="button" (click)="toggle(u)" [disabled]="processingId === u.userId || u.approvalStatus !== 2">{{ u.isActive ? 'Deactivate' : 'Activate' }}</button></td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!loading && !rows.length">No users found.</div>
      <div class="error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styleUrls: ['../page.scss']
})
export class UsersComponent implements OnInit {
  rows: UserAccount[] = [];
  loading = false;
  processingId: string | null = null;
  error = '';
  constructor(private api: AdminApiService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.api.users().pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); })).subscribe({
      next: rows => { this.rows = rows; this.cdr.detectChanges(); },
      error: e => { this.error = e?.error?.message ?? 'Unable to load users.'; this.cdr.detectChanges(); }
    });
  }
  toggle(u: UserAccount): void {
    if (this.processingId || u.approvalStatus !== 2) return;
    const nextState = !u.isActive;
    this.processingId = u.userId; this.error = '';
    this.api.setUserActive(u.userId, nextState).pipe(finalize(() => { this.processingId = null; this.cdr.detectChanges(); })).subscribe({
      next: () => { this.rows = this.rows.map(x => x.userId === u.userId ? { ...x, isActive: nextState } : x); this.cdr.detectChanges(); },
      error: e => { this.error = e?.error?.message ?? 'Unable to update user status.'; this.cdr.detectChanges(); }
    });
  }
  role(v: number) { return ({1:'Super Admin',2:'Store Manager',3:'Assistant Manager',4:'Casual',5:'Area Manager'} as any)[v] || v; }
  approval(v: number) { return ({1:'Pending',2:'Approved',3:'Rejected'} as any)[v] || v; }
}

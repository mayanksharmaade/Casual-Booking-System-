import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CasualApiService } from '../../services/casual-api.service';
import { Availability } from '../../models/api.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Availability</h1>
    <p class="lead">Changing availability does not automatically cancel already accepted bookings.</p>

    <div class="panel form-row">
      <input type="datetime-local" [(ngModel)]="start" [disabled]="saving">
      <input type="datetime-local" [(ngModel)]="end" [disabled]="saving">
      <button type="button" (click)="add()" [disabled]="saving || !start || !end">
        {{ saving ? 'Adding...' : 'Add availability' }}
      </button>
    </div>

    <div class="panel">
      <table *ngIf="rows.length">
        <tr *ngFor="let a of rows">
          <td>{{ a.startDateTime | date:'medium' }}</td>
          <td>{{ a.endDateTime | date:'medium' }}</td>
          <td><button type="button" class="danger" (click)="remove(a)" [disabled]="deletingId === a.id">Remove</button></td>
        </tr>
      </table>

      <div class="empty" *ngIf="!loading && !rows.length">No availability added.</div>
      <div class="error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styleUrls: ['../page.scss']
})
export class CasualAvailabilityComponent implements OnInit {
  rows: Availability[] = [];
  start = '';
  end = '';
  loading = false;
  saving = false;
  deletingId: number | null = null;
  error = '';

  constructor(private api: CasualApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.availability().pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: rows => {
        this.rows = [...rows].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        this.cdr.detectChanges();
      },
      error: e => {
        console.error('Failed to load availability', e);
        this.error = e?.error?.message ?? 'Unable to load availability.';
        this.cdr.detectChanges();
      }
    });
  }

  add(): void {
    if (!this.start || !this.end || this.saving) return;
    this.saving = true;
    this.error = '';
    this.api.addAvailability({ startDateTime: this.start, endDateTime: this.end })
      .pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: created => {
          this.rows = [...this.rows.filter(x => x.id !== created.id), created]
            .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
          this.start = '';
          this.end = '';
          this.cdr.detectChanges();
        },
        error: e => {
          console.error('Failed to add availability', e);
          this.error = e?.error?.message ?? 'Unable to add availability.';
          this.cdr.detectChanges();
        }
      });
  }

  remove(a: Availability): void {
    if (this.deletingId !== null) return;
    this.deletingId = a.id;
    this.error = '';
    this.api.deleteAvailability(a.id)
      .pipe(finalize(() => { this.deletingId = null; this.cdr.detectChanges(); }))
      .subscribe({
        next: () => {
          this.rows = this.rows.filter(x => x.id !== a.id);
          this.cdr.detectChanges();
        },
        error: e => {
          console.error('Failed to remove availability', e);
          this.error = e?.error?.message ?? 'Unable to remove availability.';
          this.cdr.detectChanges();
        }
      });
  }
}

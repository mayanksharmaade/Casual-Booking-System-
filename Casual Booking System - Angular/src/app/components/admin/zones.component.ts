import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Zone } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Zones</h1>

    <p class="lead">
      Super Admin controls the geographic/operational zones used by Stores.
    </p>

    <div class="panel form-row">
      <input
        [(ngModel)]="name"
        placeholder="New zone name"
        (keyup.enter)="add()"
        [disabled]="saving">

      <button
        type="button"
        (click)="add()"
        [disabled]="saving || !name.trim()">
        {{ saving ? 'Adding...' : 'Add zone' }}
      </button>
    </div>

    <div class="panel">
      <table>
        <tr *ngFor="let z of zones">
          <td>{{ z.name }}</td>

          <td>
            <span
              class="badge"
              [class.good]="z.isActive">
              {{ z.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>

          <td>#{{ z.id }}</td>
          <td>
            <button type="button" (click)="toggle(z)" [disabled]="processingId === z.id">
              {{ z.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </td>
        </tr>
      </table>

      <p *ngIf="zones.length === 0 && !loading">
        No zones found.
      </p>
    </div>
  `,
  styleUrls: ['../page.scss']
})
export class ZonesComponent implements OnInit {

  name = '';
  zones: Zone[] = [];

  loading = false;
  saving = false;
  processingId: number | null = null;
  error = '';

  constructor(
    private api: AdminApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;

    this.api.zones()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: zones => {
          this.zones = zones;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Failed to load zones', err);
        }
      });
  }

  toggle(zone: Zone): void {
    if (this.processingId !== null) return;
    const nextState = !zone.isActive;
    this.processingId = zone.id;
    this.error = '';

    this.api.setZoneActive(zone.id, nextState)
      .pipe(finalize(() => {
        this.processingId = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.zones = this.zones.map(x => x.id === zone.id ? { ...x, isActive: nextState } : x);
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Failed to update zone status', err);
          this.error = err?.error?.message ?? 'Unable to update zone status.';
          this.cdr.detectChanges();
        }
      });
  }

  add(): void {
    const zoneName = this.name.trim();

    if (!zoneName || this.saving) {
      return;
    }

    this.saving = true;

    this.api.createZone(zoneName)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: createdZone => {
          this.name = '';

          // Immediately update screen - no second click required
          this.zones = [
            ...this.zones.filter(z => z.id !== createdZone.id),
            createdZone
          ].sort((a, b) => a.name.localeCompare(b.name));

          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Failed to create zone', err);
        }
      });
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AreaManagerDashboard } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone: true,
  imports: [CommonModule, KpiComponent],
  template: `
    <h1>Area Manager Dashboard</h1>

    <p class="lead">
      Staffing, bookings, casual capacity and budget exceptions for your assigned zone.
    </p>

    <div class="grid" *ngIf="d">
      <app-kpi
        label="Assigned Zone"
        [value]="d.zoneName || 'Not assigned'">
      </app-kpi>

      <app-kpi
        label="Stores"
        [value]="d.stores">
      </app-kpi>

      <app-kpi
        label="Staffing Gaps"
        [value]="d.staffingGaps">
      </app-kpi>

      <app-kpi
        label="Pending Bookings"
        [value]="d.pendingBookings">
      </app-kpi>

      <app-kpi
        label="Accepted Bookings"
        [value]="d.acceptedBookings">
      </app-kpi>

      <app-kpi
        label="Available Casuals"
        [value]="d.availableCasuals">
      </app-kpi>

      <app-kpi
        label="Over-Budget Stores"
        [value]="d.overBudgetStores">
      </app-kpi>

      <app-kpi
        label="Scheduled Labour"
        [value]="(d.totalScheduledLabourCost | currency) || ''">
      </app-kpi>
    </div>

    <div
      class="callout warn"
      *ngIf="d?.staffingGaps">
      Staffing gaps in your assigned zone need attention.
      Use Staffing Gaps and Casuals to coordinate coverage.
    </div>
  `,
  styleUrls: ['../page.scss']
})
export class AreaDashboardComponent implements OnInit {

  d?: AreaManagerDashboard;

  constructor(
    private api: AreaManagerApiService
  ) {}

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: x => this.d = x,
      error: err => console.error(
        'Failed to load Area Manager dashboard.',
        err
      )
    });
  }
}
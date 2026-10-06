import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AreaManagerDashboard } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,KpiComponent],
  template:`
    <h1>Area Manager Dashboard</h1>
    <p class="lead">Cross-store staffing, bookings, casual capacity and budget exceptions for assigned zones.</p>
    <div class="grid" *ngIf="d">
      <app-kpi label="Assigned Zones" [value]="d.assignedZones"/>
      <app-kpi label="Stores" [value]="d.stores"/>
      <app-kpi label="Staffing Gaps" [value]="d.staffingGaps"/>
      <app-kpi label="Pending Bookings" [value]="d.pendingBookings"/>
      <app-kpi label="Accepted Bookings" [value]="d.acceptedBookings"/>
      <app-kpi label="Available Casuals" [value]="d.availableCasuals"/>
      <app-kpi label="Over-Budget Stores" [value]="d.overBudgetStores"/>
      <app-kpi label="Scheduled Labour" [value]="(d.totalScheduledLabourCost|currency)||''"/>
    </div>
    <div class="callout warn" *ngIf="d?.staffingGaps">Cross-store staffing gaps need attention. Use Staffing Gaps and Casuals to coordinate coverage.</div>
  `,
  styleUrls:['../page.scss']
})
export class AreaDashboardComponent implements OnInit {
  d?:AreaManagerDashboard;
  constructor(private api:AreaManagerApiService){}
  ngOnInit(){this.api.dashboard().subscribe(x=>this.d=x);}
}

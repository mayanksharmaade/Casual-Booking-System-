import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminDashboard } from '../../models/api.models';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,KpiComponent],
  template:`
    <h1>Super Admin Dashboard</h1>
    <p class="lead">Platform-wide administration, activity and exception overview.</p>
    <div class="grid" *ngIf="data">
      <app-kpi label="Stores" [value]="data.stores" [hint]="data.pendingStores+' pending'"/>
      <app-kpi label="Casuals" [value]="data.casuals" [hint]="data.pendingCasuals+' pending'"/>
      <app-kpi label="Area Managers" [value]="data.areaManagers"/>
      <app-kpi label="Active Bookings" [value]="data.activeBookings"/>
      <app-kpi label="Staffing Alerts" [value]="data.staffingAlerts"/>
      <app-kpi label="Pending Registrations" [value]="data.pendingRegistrations"/>
      <app-kpi label="Active Users" [value]="data.activeUsers"/>
      <app-kpi label="Zones" [value]="data.zones"/>
    </div>
    <div class="callout warn" *ngIf="data?.staffingAlerts">
      Staffing alerts are active across the platform. Area Managers can use the cross-store gap view to intervene.
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AdminDashboardComponent implements OnInit {
  data?:AdminDashboard;
  constructor(private api:AdminApiService){}
  ngOnInit(){this.api.dashboard().subscribe(x=>this.data=x);}
}

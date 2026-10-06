import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreReport } from '../../models/api.models';
import { StoreApiService } from '../../services/store-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,KpiComponent],
  template:`
    <h1>Store Reports</h1>
    <p class="lead">Review staffing gaps, bookings, labour cost and budget variance for a selected period.</p>
    <div class="panel form-row">
      <input type="date" [(ngModel)]="from">
      <input type="date" [(ngModel)]="to">
      <button (click)="run()">Run report</button>
    </div>
    <div class="grid" *ngIf="r">
      <app-kpi label="Roster Entries" [value]="r.rosteredEntries"/>
      <app-kpi label="Staffing Gaps" [value]="r.staffingGaps"/>
      <app-kpi label="Booking Requests" [value]="r.bookingRequests"/>
      <app-kpi label="Completed" [value]="r.completedBookings"/>
      <app-kpi label="Total Labour" [value]="(r.totalLabourCost|currency)||''"/>
      <app-kpi label="Budget Variance" [value]="(r.budgetVariance|currency)||''"/>
    </div>
    <div class="panel" *ngIf="r">
      <div class="metric-row"><span>Roster labour</span><strong>{{r.rosterLabourCost|currency}}</strong></div>
      <div class="metric-row"><span>Casual labour</span><strong>{{r.casualLabourCost|currency}}</strong></div>
      <div class="metric-row"><span>Budget allocated</span><strong>{{r.budgetAllocated|currency}}</strong></div>
      <div class="metric-row"><span>Cancelled bookings</span><strong>{{r.cancelledBookings}}</strong></div>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class StoreReportsComponent {
  from=this.dateDaysAgo(30);
  to=this.dateDaysAgo(0);
  r?:StoreReport;
  constructor(private api:StoreApiService){}
  run(){this.api.report(`${this.from}T00:00:00`,`${this.to}T23:59:59`).subscribe(x=>this.r=x);}
  dateDaysAgo(days:number){const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}
}

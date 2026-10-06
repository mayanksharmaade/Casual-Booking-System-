import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaReport } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,KpiComponent],
  template:`
    <h1>Area Reports</h1>
    <p class="lead">Cross-store booking, staffing-gap, override and labour-cost summary.</p>
    <div class="panel form-row">
      <input type="date" [(ngModel)]="from">
      <input type="date" [(ngModel)]="to">
      <button (click)="run()">Run report</button>
    </div>
    <div class="grid" *ngIf="r">
      <app-kpi label="Stores" [value]="r.stores"/>
      <app-kpi label="Staffing Gaps" [value]="r.staffingGapEvents"/>
      <app-kpi label="Booking Requests" [value]="r.bookingRequests"/>
      <app-kpi label="Completed" [value]="r.completedBookings"/>
      <app-kpi label="Cancelled" [value]="r.cancelledBookings"/>
      <app-kpi label="Overrides" [value]="r.managerOverrides"/>
      <app-kpi label="Casual Labour" [value]="(r.estimatedLabourCost|currency)||''"/>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AreaReportsComponent {
  from=this.dateDaysAgo(30);
  to=this.dateDaysAgo(0);
  r?:AreaReport;
  constructor(private api:AreaManagerApiService){}
  run(){this.api.report(`${this.from}T00:00:00`,`${this.to}T23:59:59`).subscribe(x=>this.r=x);}
  dateDaysAgo(days:number){const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CasualReport } from '../../models/api.models';
import { CasualApiService } from '../../services/casual-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,KpiComponent],
  template:`
    <h1>My Work Report</h1>
    <p class="lead">A simple history of accepted hours, completed work, cancellations and rating.</p>
    <div class="panel form-row">
      <input type="date" [(ngModel)]="from">
      <input type="date" [(ngModel)]="to">
      <button (click)="run()">Run report</button>
    </div>
    <div class="grid" *ngIf="r">
      <app-kpi label="Paid Hours" [value]="r.acceptedHours|number:'1.1-1'"/>
      <app-kpi label="Accepted" [value]="r.acceptedBookings"/>
      <app-kpi label="Completed" [value]="r.completedBookings"/>
      <app-kpi label="Cancelled" [value]="r.cancelledBookings"/>
      <app-kpi label="Declined" [value]="r.declinedBookings"/>
      <app-kpi label="Rating" [value]="r.rating|number:'1.1-1'" [hint]="r.ratingCount+' ratings'"/>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class CasualReportsComponent {
  from=this.dateDaysAgo(30);
  to=this.dateDaysAgo(0);
  r?:CasualReport;
  constructor(private api:CasualApiService){}
  run(){this.api.report(`${this.from}T00:00:00`,`${this.to}T23:59:59`).subscribe(x=>this.r=x);}
  dateDaysAgo(days:number){const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}
}

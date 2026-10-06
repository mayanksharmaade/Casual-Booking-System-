import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditLog, SystemReport } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,KpiComponent],
  template:`
    <h1>System Reports & Audit</h1>
    <p class="lead">Portfolio-ready operational reporting without external analytics dependencies.</p>
    <div class="panel form-row">
      <input type="date" [(ngModel)]="from">
      <input type="date" [(ngModel)]="to">
      <button (click)="run()">Run report</button>
    </div>

    <div class="grid" *ngIf="report">
      <app-kpi label="Bookings" [value]="report.totalBookings"/>
      <app-kpi label="Completed" [value]="report.completedBookings"/>
      <app-kpi label="Cancelled" [value]="report.cancelledBookings"/>
      <app-kpi label="Staffing Gaps" [value]="report.staffingGapEvents"/>
      <app-kpi label="Manager Overrides" [value]="report.managerOverrides"/>
      <app-kpi label="Casual Labour" [value]="(report.estimatedCasualLabourCost|currency)||''"/>
    </div>

    <div class="panel">
      <h3>Recent audit activity</h3>
      <table>
        <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>
          <tr *ngFor="let a of audit">
            <td>{{a.createdAtUtc|date:'short'}}</td>
            <td>{{a.action}}</td>
            <td>{{a.entityName}} {{a.entityId||''}}</td>
            <td>{{a.details||'-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AdminReportsComponent implements OnInit {
  from=this.dateDaysAgo(30);
  to=this.dateDaysAgo(0);
  report?:SystemReport;
  audit:AuditLog[]=[];

  constructor(private api:AdminApiService){}
  ngOnInit(){ this.api.audit().subscribe(x=>this.audit=x); this.run(); }
  run(){ this.api.systemReport(this.start(this.from),this.end(this.to)).subscribe(x=>this.report=x); }
  start(v:string){return `${v}T00:00:00`;}
  end(v:string){return `${v}T23:59:59`;}
  dateDaysAgo(days:number){const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10);}
}

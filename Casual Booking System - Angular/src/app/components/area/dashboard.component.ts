import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaManagerDashboard, AreaStoreSummary } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,KpiComponent],
  template:`
    <div class="page-head">
      <div>
        <h1>Area Manager Dashboard</h1>
        <p class="lead">Daily and weekly operational view for your managed zone.</p>
      </div>
      <div class="controls">
        <label><span>Date</span><input type="date" [(ngModel)]="date" (change)="load()"></label>
        <div class="segmented">
          <button type="button" [class.active]="period==='day'" (click)="setPeriod('day')">Day</button>
          <button type="button" [class.active]="period==='week'" (click)="setPeriod('week')">Week</button>
        </div>
      </div>
    </div>

    <div class="zone-banner" *ngIf="d">
      <div><span class="eyebrow">Managed zone</span><strong>{{d.zoneCity}} · {{d.zoneName}}</strong></div>
      <div><span class="eyebrow">Period</span><strong>{{d.periodFrom|date:'mediumDate'}} – {{d.periodTo|date:'mediumDate'}}</strong></div>
    </div>

    <div class="grid" *ngIf="d">
      <app-kpi label="Stores in Zone" [value]="d.stores"/>
      <app-kpi label="Coverage Gaps" [value]="d.staffingGaps"/>
      <app-kpi label="Pending Requests" [value]="d.pendingBookings"/>
      <app-kpi label="Accepted Casuals" [value]="d.acceptedBookings"/>
      <app-kpi label="Available Casuals" [value]="d.availableCasuals"/>
      <app-kpi label="Over-Budget Stores" [value]="d.overBudgetStores"/>
      <app-kpi label="Scheduled Labour" [value]="(d.totalScheduledLabourCost|currency:'AUD':'symbol':'1.0-0')||''"/>
    </div>

    <div class="panel" *ngIf="stores.length">
      <div class="section-title"><div><h2>Stores in your zone</h2><span>{{period==='day'?'Selected day':'Selected week'}} operational snapshot</span></div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Store</th><th>Coverage gaps</th><th>Pending</th><th>Accepted</th><th>Labour</th><th>Budget</th><th>Status</th></tr></thead>
          <tbody><tr *ngFor="let s of stores">
            <td><strong>{{s.storeCode}}</strong><br>{{s.storeName}}</td>
            <td><span class="badge" [class.good]="s.staffingGaps===0">{{s.staffingGaps}}</span></td>
            <td>{{s.pendingBookings}}</td><td>{{s.acceptedBookings}}</td>
            <td>{{s.scheduledLabourCost|currency:'AUD':'symbol':'1.0-0'}}</td>
            <td>{{s.dailyBudget|currency:'AUD':'symbol':'1.0-0'}}</td>
            <td><span class="badge" [class.good]="s.budgetStatus!=='Over Budget'">{{s.budgetStatus}}</span></td>
          </tr></tbody>
        </table>
      </div>
    </div>

    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`
    .page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:18px}.controls{display:flex;gap:12px;align-items:end}.controls label{display:flex;flex-direction:column;gap:5px}.controls label span,.eyebrow{font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b}.segmented{display:flex;border:1px solid #dbe3ee;border-radius:10px;padding:3px;background:white}.segmented button{background:transparent;color:#334155;border:0;padding:9px 15px}.segmented button.active{background:#2563eb;color:white}.zone-banner{display:flex;justify-content:space-between;gap:20px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:15px 18px;margin-bottom:18px}.zone-banner div{display:flex;flex-direction:column;gap:4px}.section-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.section-title h2{margin:0}.section-title span{color:#64748b;font-size:13px}.table-wrap{overflow:auto}@media(max-width:800px){.page-head,.zone-banner{flex-direction:column}.controls{width:100%;flex-wrap:wrap}}
  `]
})
export class AreaDashboardComponent implements OnInit{
  d?:AreaManagerDashboard; stores:AreaStoreSummary[]=[]; error='';
  date=this.today(); period:'day'|'week'='day';
  constructor(private api:AreaManagerApiService){}
  ngOnInit(){this.load();}
  setPeriod(p:'day'|'week'){this.period=p;this.load();}
  load(){this.error='';this.api.dashboard(this.date,this.period).subscribe({next:x=>this.d=x,error:e=>this.error=e?.error?.message??'Unable to load dashboard.'});this.api.stores(this.date,this.period).subscribe({next:x=>this.stores=x,error:e=>this.error=e?.error?.message??'Unable to load store summary.'});}
  private today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
}

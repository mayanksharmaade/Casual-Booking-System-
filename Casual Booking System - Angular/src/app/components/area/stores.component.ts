import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaStoreSummary } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({standalone:true,imports:[CommonModule,FormsModule],template:`
  <div class="page-head"><div><h1>Store Comparison</h1><p class="lead">Compare stores in your assigned zone by day, week or month.</p></div>
    <div class="controls"><input type="date" [(ngModel)]="date" (change)="load()"><select [(ngModel)]="period" (change)="load()"><option value="day">Date</option><option value="week">Week</option><option value="month">Month</option></select></div>
  </div>
  <div class="panel"><div class="table-wrap"><table><thead><tr><th>Store</th><th>Zone</th><th>Coverage gaps</th><th>Pending</th><th>Accepted</th><th>Labour</th><th>Budget</th><th>Variance</th><th>Status</th></tr></thead><tbody>
    <tr *ngFor="let s of rows"><td><strong>{{s.storeCode}}</strong> {{s.storeName}}<br><small>{{s.city}}</small></td><td>{{s.zoneName}}</td><td><span class="badge" [class.good]="s.staffingGaps===0">{{s.staffingGaps}}</span></td><td>{{s.pendingBookings}}</td><td>{{s.acceptedBookings}}</td><td>{{s.scheduledLabourCost|currency}}</td><td>{{s.dailyBudget|currency}}</td><td>{{s.budgetVariance|currency}}</td><td><span class="badge" [class.good]="s.budgetStatus!=='Over Budget'">{{s.budgetStatus}}</span></td></tr>
  </tbody></table></div><div class="empty" *ngIf="!rows.length&&!error">No stores found in this zone.</div></div>
  <div class="callout error-box" *ngIf="error">{{error}}</div>
`,styleUrls:['../page.scss'],styles:[`.page-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.controls{display:flex;gap:10px}.table-wrap{overflow:auto}@media(max-width:700px){.page-head{flex-direction:column}}`]})
export class AreaStoresComponent implements OnInit{rows:AreaStoreSummary[]=[];date=this.today();period:'day'|'week'|'month'='day';error='';constructor(private api:AreaManagerApiService){}ngOnInit(){this.load();}load(){this.error='';this.api.stores(this.date,this.period).subscribe({next:x=>this.rows=x,error:e=>this.error=e?.error?.message??'Unable to load stores.'});}private today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { StoreDashboard } from '../../models/api.models';
import { StoreApiService } from '../../services/store-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Daily Budget</h1>
    <p class="lead">Store sets only the daily budget. Labour cost is calculated automatically from the people rostered/booked for that day.</p>

    <div class="panel form-row">
      <input type="date" [(ngModel)]="date" (change)="load()">
      <input type="number" min="0" step="10" [(ngModel)]="amount" placeholder="Budget amount">
      <button type="button" (click)="save()" [disabled]="saving">{{saving?'Saving...':'Save budget'}}</button>
    </div>

    <div class="grid" *ngIf="d">
      <div class="panel"><small>Daily Budget</small><h2>{{d.dailyBudget|currency:'AUD'}}</h2></div>
      <div class="panel"><small>Calculated Labour</small><h2>{{d.scheduledLabourCost|currency:'AUD'}}</h2></div>
      <div class="panel"><small>Status</small><h2>{{d.budgetStatus}}</h2><p>{{d.budgetVariance|currency:'AUD'}} variance</p></div>
    </div>

    <div class="panel" *ngIf="d">
      <h3>Today's Labour Calculation</h3>
      <p class="lead">Shifts over 5 hours include a 30-minute unpaid meal break. Maximum scheduled shift is 8 hours.</p>
      <table *ngIf="d.labourItems.length">
        <thead><tr><th>Worker</th><th>Type</th><th>Scheduled</th><th>Unpaid break</th><th>Paid hours</th><th>Base rate</th><th>Loadings</th><th>Effective rate</th><th>Cost</th></tr></thead>
        <tbody>
          <tr *ngFor="let x of d.labourItems">
            <td><strong>{{x.workerName}}</strong></td>
            <td>{{typeLabel(x.workerType)}}</td>
            <td>{{x.scheduledHours|number:'1.1-2'}} h</td>
            <td>{{x.unpaidBreakHours|number:'1.1-2'}} h</td>
            <td>{{x.paidHours|number:'1.1-2'}} h</td>
            <td>{{x.baseHourlyRate|currency:'AUD':'symbol':'1.2-2'}}</td>
            <td>
              <span *ngIf="x.casualLoadingPercent">Casual +{{x.casualLoadingPercent}}%</span>
              <span *ngIf="x.casualLoadingPercent && x.saturdayLoadingPercent"> · </span>
              <span *ngIf="x.saturdayLoadingPercent">Saturday +{{x.saturdayLoadingPercent}}%</span>
              <span *ngIf="!x.casualLoadingPercent && !x.saturdayLoadingPercent">—</span>
            </td>
            <td>{{x.effectiveHourlyRate|currency:'AUD':'symbol':'1.2-2'}}</td>
            <td><strong>{{x.cost|currency:'AUD':'symbol':'1.2-2'}}</strong></td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!d.labourItems.length">No rostered/accepted paid work for this date.</div>
    </div>

    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss']
})
export class BudgetComponent {
  date=new Date().toISOString().slice(0,10);
  amount=0;
  d?:StoreDashboard;
  saving=false;
  message='';
  error='';

  constructor(private api:StoreApiService,private cdr:ChangeDetectorRef){this.load();}
  typeLabel(value:string){return value.replace('PartTime','Part-Time').replace('FullTime','Full-Time').replace('StoreManager','Store Manager').replace('AssistantManager','Assistant Manager');}

  load(){
    this.error='';
    this.api.dashboard(this.date).subscribe({
      next:x=>{this.d=x;this.amount=x.dailyBudget;this.cdr.detectChanges();},
      error:e=>{this.error=e?.error?.message??'Unable to load budget.';this.cdr.detectChanges();}
    });
  }

  save(){
    if(this.saving)return;
    this.saving=true;this.message='';this.error='';
    this.api.setBudget(this.date,this.amount)
      .pipe(finalize(()=>{this.saving=false;this.cdr.detectChanges();}))
      .subscribe({
        next:()=>{this.message='Daily budget updated.';this.load();},
        error:e=>{this.error=e?.error?.message??'Unable to save budget.';this.cdr.detectChanges();}
      });
  }
}

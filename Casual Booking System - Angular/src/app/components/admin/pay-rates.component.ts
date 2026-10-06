import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PayRate } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Individual Pay Rates</h1>
    <p class="lead">Super Admin sets each paid worker's base hourly rate. Casual loading (25%) and Saturday loading (25%) are automatic.</p>

    <div class="callout warn">
      Volunteers are unpaid. Store users cannot edit pay rates. Saturday and Casual loadings are calculated when a shift is costed.
    </div>

    <div class="panel">
      <table>
        <thead><tr><th>Worker</th><th>Type</th><th>Store</th><th>Base Rate</th><th>Automatic Loadings</th><th>Update</th></tr></thead>
        <tbody>
          <tr *ngFor="let x of rows; trackBy:trackRow">
            <td><strong>{{x.workerName}}</strong></td>
            <td>{{typeLabel(x.workerType)}}</td>
            <td>{{x.storeName||'—'}}</td>
            <td>{{x.baseHourlyRate==null?'Not set':(x.baseHourlyRate|currency:'AUD':'symbol':'1.2-2')}}</td>
            <td>
              <span *ngIf="x.casualLoadingPercent">Casual +{{x.casualLoadingPercent}}%</span>
              <span *ngIf="x.casualLoadingPercent && x.saturdayLoadingPercent"> · </span>
              <span>Saturday +{{x.saturdayLoadingPercent}}%</span>
            </td>
            <td class="rate-edit">
              <input type="number" min="0.01" step="0.01" [(ngModel)]="drafts[key(x)]" placeholder="Base rate">
              <button type="button" (click)="save(x)" [disabled]="savingKey===key(x)">
                {{savingKey===key(x)?'Saving...':'Save'}}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!loading && !rows.length">No paid workers found.</div>
    </div>

    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`.rate-edit{display:flex;gap:8px;align-items:center}.rate-edit input{max-width:130px}`]
})
export class PayRatesComponent implements OnInit {
  rows:PayRate[]=[];
  drafts:Record<string,number|null>={};
  loading=false;
  savingKey='';
  message='';
  error='';

  constructor(private api:AdminApiService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.load();}

  key(x:PayRate){return `${x.workerKind}-${x.workerId}`;}
  trackRow=(_:number,x:PayRate)=>this.key(x);
  typeLabel(value:string){return value.replace('PartTime','Part-Time').replace('FullTime','Full-Time').replace('StoreManager','Store Manager').replace('AssistantManager','Assistant Manager');}

  load(){
    this.loading=true; this.error='';
    this.api.payRates().pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();})).subscribe({
      next:rows=>{
        this.rows=rows;
        const next:Record<string,number|null>={};
        for(const x of rows) next[this.key(x)]=x.baseHourlyRate??null;
        this.drafts=next;
        this.cdr.detectChanges();
      },
      error:e=>{this.error=e?.error?.message??'Unable to load pay rates.';this.cdr.detectChanges();}
    });
  }

  save(x:PayRate){
    const k=this.key(x);
    const rate=Number(this.drafts[k]);
    if(!rate || rate<=0 || this.savingKey)return;
    this.savingKey=k; this.message=''; this.error='';
    this.api.setPayRate({workerKind:x.workerKind,workerId:x.workerId,baseHourlyRate:rate})
      .pipe(finalize(()=>{this.savingKey='';this.cdr.detectChanges();}))
      .subscribe({
        next:updated=>{
          this.rows=this.rows.map(r=>this.key(r)===k?updated:r);
          this.drafts[k]=updated.baseHourlyRate??rate;
          this.message=`Pay rate updated for ${updated.workerName}.`;
          this.cdr.detectChanges();
        },
        error:e=>{this.error=e?.error?.message??'Unable to update pay rate.';this.cdr.detectChanges();}
      });
  }
}

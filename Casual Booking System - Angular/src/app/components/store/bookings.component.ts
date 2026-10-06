import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Booking, bookingStatusLabel } from '../../models/api.models';
import { StoreApiService } from '../../services/store-api.service';

@Component({
  standalone:true,
  imports:[CommonModule],
  template:`
    <h1>Store Bookings</h1>
    <p class="lead">Pending, accepted and historical Casual booking requests.</p>

    <div class="panel" *ngIf="loading"><div class="empty">Loading bookings...</div></div>

    <div class="panel" *ngIf="!loading && confirmed.length">
      <div class="section-head"><div><h3>Confirmed / Upcoming Shifts</h3><p>Bookings accepted by Casuals.</p></div><span class="badge good">{{confirmed.length}}</span></div>
      <ng-container *ngTemplateOutlet="bookingTable; context:{rows:confirmed}"></ng-container>
    </div>

    <div class="panel" *ngIf="!loading && pending.length">
      <div class="section-head"><div><h3>Pending Requests</h3><p>Waiting for Casual response.</p></div><span class="badge">{{pending.length}}</span></div>
      <ng-container *ngTemplateOutlet="bookingTable; context:{rows:pending}"></ng-container>
    </div>

    <div class="panel" *ngIf="!loading && history.length">
      <div class="section-head"><div><h3>Booking History</h3><p>Completed, declined, expired and cancelled bookings.</p></div></div>
      <ng-container *ngTemplateOutlet="bookingTable; context:{rows:history}"></ng-container>
    </div>

    <div class="panel" *ngIf="!loading && !rows.length"><div class="empty">No bookings found.</div></div>

    <ng-template #bookingTable let-items="rows">
      <table>
        <thead><tr><th>Casual</th><th>Shift</th><th>Status</th><th>Flags</th><th>Cost</th><th>Reason</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let b of items">
            <td><b>{{b.casualName}}</b></td>
            <td>{{b.startDateTime|date:'EEE, d MMM y'}} · {{b.startDateTime|date:'shortTime'}} → {{b.endDateTime|date:'shortTime'}}</td>
            <td><span class="badge" [class.good]="b.status===2||b.status===6">{{label(b.status)}}</span></td>
            <td><span class="badge" *ngIf="b.requiredSkillName">{{b.requiredSkillName}}</span><span class="badge" *ngIf="b.isEmergency">Emergency</span><span class="badge" *ngIf="b.hasManagerOverride">AM Override</span></td>
            <td>{{b.estimatedCost|currency:'AUD':'symbol':'1.2-2'}}</td>
            <td>{{b.cancellationReason || b.declineReason || '—'}}</td>
            <td class="actions">
              <button *ngIf="b.status===2 && isPast(b)" (click)="complete(b)" [disabled]="processingId===b.id">Complete</button>
              <button *ngIf="b.status===6" (click)="rate(b)" [disabled]="processingId===b.id">Rate</button>
              <button class="danger" *ngIf="b.status===1||b.status===2" (click)="cancel(b)" [disabled]="processingId===b.id">Cancel</button>
            </td>
          </tr>
        </tbody>
      </table>
    </ng-template>

    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`.section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}.section-head h3{margin:0 0 4px}.section-head p{margin:0;color:#64748b;font-size:14px}`]
})
export class StoreBookingsComponent implements OnInit {
  rows:Booking[]=[];
  confirmed:Booking[]=[];
  pending:Booking[]=[];
  history:Booking[]=[];
  loading=false;
  processingId:number|null=null;
  error='';
  message='';
  label=bookingStatusLabel;

  constructor(private api:StoreApiService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.load();}

  load(){
    this.loading=true; this.error='';
    this.api.bookings().pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();})).subscribe({
      next:rows=>{
        const now=Date.now();
        this.rows=[...rows];
        this.confirmed=rows.filter(x=>x.status===2 && new Date(x.endDateTime).getTime()>=now).sort(this.byStartAsc);
        this.pending=rows.filter(x=>x.status===1).sort(this.byStartAsc);
        this.history=rows.filter(x=>x.status!==1 && !(x.status===2 && new Date(x.endDateTime).getTime()>=now)).sort(this.byStartDesc);
        this.cdr.detectChanges();
      },
      error:e=>{this.error=e?.error?.message??'Unable to load Store bookings.';this.cdr.detectChanges();}
    });
  }

  isPast(b:Booking){return new Date(b.endDateTime)<new Date();}

  complete(b:Booking){
    this.processingId=b.id; this.error=''; this.message='';
    this.api.completeBooking(b.id).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.message='Booking completed.';this.load();},error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}});
  }

  rate(b:Booking){
    const score=Number(prompt('Rating 1-5'));
    if(score<1||score>5)return;
    const comment=prompt('Optional comment')||undefined;
    this.processingId=b.id; this.error=''; this.message='';
    this.api.rateBooking(b.id,score,comment).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.message='Rating saved.';this.load();},error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}});
  }

  cancel(b:Booking){
    const reason=prompt('Cancellation reason');
    if(!reason?.trim())return;
    this.processingId=b.id; this.error=''; this.message='';
    this.api.cancelBooking(b.id,reason.trim()).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.message='Booking cancelled.';this.load();},error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}});
  }

  private byStartAsc=(a:Booking,b:Booking)=>new Date(a.startDateTime).getTime()-new Date(b.startDateTime).getTime();
  private byStartDesc=(a:Booking,b:Booking)=>new Date(b.startDateTime).getTime()-new Date(a.startDateTime).getTime();
}

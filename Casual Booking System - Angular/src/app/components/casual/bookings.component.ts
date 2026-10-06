import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Booking, bookingStatusLabel } from '../../models/api.models';
import { CasualApiService } from '../../services/casual-api.service';

@Component({
  standalone:true,
  imports:[CommonModule],
  template:`
    <h1>My Bookings</h1>
    <p class="lead">View pending requests, upcoming shifts and booking history.</p>

    <div class="panel" *ngIf="loading">
      <div class="empty">Loading bookings...</div>
    </div>

    <ng-container *ngIf="!loading">
      <div class="panel" *ngIf="pending.length">
        <div class="section-head"><div><h3>Pending Requests</h3><p>Requests waiting for your response.</p></div><span class="badge">{{pending.length}}</span></div>
        <ng-container *ngTemplateOutlet="bookingTable; context:{rows:pending, actions:'pending'}"></ng-container>
      </div>

      <div class="panel" *ngIf="upcoming.length">
        <div class="section-head"><div><h3>Upcoming Shifts</h3><p>Accepted future shifts.</p></div><span class="badge good">{{upcoming.length}}</span></div>
        <ng-container *ngTemplateOutlet="bookingTable; context:{rows:upcoming, actions:'accepted'}"></ng-container>
      </div>

      <div class="panel" *ngIf="declined.length">
        <div class="section-head"><div><h3>Rejected / Declined Requests</h3><p>Requests you declined.</p></div><span class="badge">{{declined.length}}</span></div>
        <ng-container *ngTemplateOutlet="bookingTable; context:{rows:declined, actions:'history'}"></ng-container>
      </div>

      <div class="panel" *ngIf="cancelled.length">
        <div class="section-head"><div><h3>Cancelled Shifts</h3><p>Bookings cancelled by you, the Store or an Area Manager.</p></div><span class="badge">{{cancelled.length}}</span></div>
        <ng-container *ngTemplateOutlet="bookingTable; context:{rows:cancelled, actions:'history'}"></ng-container>
      </div>

      <div class="panel" *ngIf="completed.length">
        <div class="section-head"><div><h3>Completed Shifts</h3><p>Your completed booking history.</p></div><span class="badge good">{{completed.length}}</span></div>
        <ng-container *ngTemplateOutlet="bookingTable; context:{rows:completed, actions:'history'}"></ng-container>
      </div>

      <div class="panel" *ngIf="!rows.length">
        <div class="empty">No bookings found.</div>
      </div>
    </ng-container>

    <ng-template #bookingTable let-items="rows" let-actions="actions">
      <table>
        <thead><tr><th>Store</th><th>Shift</th><th>Status</th><th>Skill / Flags</th><th>Reason</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let b of items">
            <td>{{b.storeName}}</td>
            <td>{{b.startDateTime|date:'EEE, d MMM y'}} · {{b.startDateTime|date:'shortTime'}} → {{b.endDateTime|date:'shortTime'}}</td>
            <td><span class="badge" [class.good]="b.status===2||b.status===6">{{label(b.status)}}</span></td>
            <td>
              <span class="badge" *ngIf="b.requiredSkillName">{{b.requiredSkillName}}</span>
              <span class="badge" *ngIf="b.isEmergency">Emergency</span>
              <span class="badge" *ngIf="b.hasManagerOverride">Manager override</span>
            </td>
            <td>{{b.cancellationReason || b.declineReason || '—'}}</td>
            <td class="actions">
              <ng-container *ngIf="actions==='pending'">
                <button type="button" (click)="accept(b)" [disabled]="processingId===b.id">Accept</button>
                <button type="button" class="danger" (click)="decline(b)" [disabled]="processingId===b.id">Decline</button>
              </ng-container>
              <button type="button" class="danger" *ngIf="actions==='accepted'" (click)="cancel(b)" [disabled]="processingId===b.id">Cancel</button>
            </td>
          </tr>
        </tbody>
      </table>
    </ng-template>

    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`
    .section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}.section-head h3{margin:0 0 4px}.section-head p{margin:0;color:#64748b;font-size:14px}
  `]
})
export class CasualBookingsComponent implements OnInit {
  rows:Booking[]=[];
  pending:Booking[]=[];
  upcoming:Booking[]=[];
  declined:Booking[]=[];
  cancelled:Booking[]=[];
  completed:Booking[]=[];
  loading=false;
  processingId:number|null=null;
  error='';
  message='';
  label=bookingStatusLabel;

  constructor(private api:CasualApiService,private cdr:ChangeDetectorRef){}

  ngOnInit(){this.load();}

  load(){
    this.loading=true; this.error='';
    this.api.bookings().pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();})).subscribe({
      next:rows=>{
        this.rows=[...rows];
        const now=Date.now();
        this.pending=rows.filter(x=>x.status===1).sort(this.byStartAsc);
        this.upcoming=rows.filter(x=>x.status===2 && new Date(x.endDateTime).getTime()>=now).sort(this.byStartAsc);
        this.declined=rows.filter(x=>x.status===3).sort(this.byStartDesc);
        this.cancelled=rows.filter(x=>x.status===5).sort(this.byStartDesc);
        this.completed=rows.filter(x=>x.status===6).sort(this.byStartDesc);
        this.cdr.detectChanges();
      },
      error:e=>{this.error=e?.error?.message??'Unable to load bookings.';this.cdr.detectChanges();}
    });
  }

  accept(b:Booking){
    this.processingId=b.id; this.error=''; this.message='';
    this.api.accept(b.id).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>{this.message='Shift accepted.';this.load();},
      error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}
    });
  }

  decline(b:Booking){
    const reason=prompt('Optional decline reason')||undefined;
    this.processingId=b.id; this.error=''; this.message='';
    this.api.decline(b.id,reason).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>{this.message='Shift declined.';this.load();},
      error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}
    });
  }

  cancel(b:Booking){
    const reason=prompt('Cancellation reason');
    if(!reason?.trim()) return;
    this.processingId=b.id; this.error=''; this.message='';
    this.api.cancel(b.id,reason.trim()).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>{this.message='Shift cancelled.';this.load();},
      error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}
    });
  }

  private byStartAsc=(a:Booking,b:Booking)=>new Date(a.startDateTime).getTime()-new Date(b.startDateTime).getTime();
  private byStartDesc=(a:Booking,b:Booking)=>new Date(b.startDateTime).getTime()-new Date(a.startDateTime).getTime();
}

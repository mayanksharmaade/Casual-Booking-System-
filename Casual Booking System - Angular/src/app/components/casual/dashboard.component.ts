import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { Booking, bookingStatusLabel, CasualDashboard } from '../../models/api.models';
import { CasualApiService } from '../../services/casual-api.service';
import { KpiComponent } from '../../shared/ui/kpi.component';

@Component({
  standalone:true,
  imports:[CommonModule,KpiComponent],
  template:`
    <h1>Casual Dashboard</h1>
    <p class="lead">Booking requests, confirmed work, hours and availability at a glance.</p>

    <div class="zone-chip" *ngIf="d">Current zone: {{d.currentZoneName}}</div>

    <div class="grid" *ngIf="d">
      <app-kpi label="Pending Requests" [value]="d.pendingRequests"/>
      <app-kpi label="Upcoming Shifts" [value]="d.upcomingShifts"/>
      <app-kpi label="Previous Shifts" [value]="d.previousShifts"/>
      <app-kpi label="Weekly Hours" [value]="d.weeklyHours+' / '+d.weeklyLimit" hint="Monday–Sunday paid-hour cap"/>
      <app-kpi label="Rating" [value]="d.rating|number:'1.1-1'"/>
      <app-kpi label="Unread Notifications" [value]="d.unreadNotifications"/>
    </div>

    <div class="panel requests" *ngIf="pending.length">
      <div class="section-head"><div><h3>Pending Shift Requests</h3><p>Review Store, date, time and skill requirement before accepting.</p></div><span class="badge">{{pending.length}} pending</span></div>
      <div class="request-grid">
        <div class="request-card" *ngFor="let b of pending">
          <div class="request-title"><strong>{{b.storeName}}</strong><span class="badge">{{label(b.status)}}</span></div>
          <div class="detail"><span>Date</span><b>{{b.startDateTime|date:'EEE, d MMM y'}}</b></div>
          <div class="detail"><span>Time</span><b>{{b.startDateTime|date:'shortTime'}} – {{b.endDateTime|date:'shortTime'}}</b></div>
          <div class="detail"><span>Required skill</span><b>{{b.requiredSkillName || 'No specific skill'}}</b></div>
          <div class="detail" *ngIf="b.expiresAtUtc"><span>Respond by</span><b>{{b.expiresAtUtc|date:'short'}}</b></div>
          <div class="request-flags"><span class="badge" *ngIf="b.isEmergency">Emergency</span><span class="badge" *ngIf="b.hasManagerOverride">Manager override</span></div>
          <div class="request-actions"><button type="button" (click)="accept(b)" [disabled]="processingId===b.id">Accept</button><button type="button" class="danger" (click)="decline(b)" [disabled]="processingId===b.id">Reject</button></div>
        </div>
      </div>
    </div>

    <div class="panel" *ngIf="upcoming.length">
      <div class="section-head"><div><h3>Upcoming Shifts</h3><p>Your accepted future shifts. Pay is intentionally hidden here.</p></div><span class="badge good">{{upcoming.length}} confirmed</span></div>
      <table>
        <thead><tr><th>Store</th><th>Date</th><th>Time</th><th>Required Skill</th><th>Status</th></tr></thead>
        <tbody><tr *ngFor="let b of upcoming"><td><b>{{b.storeName}}</b></td><td>{{b.startDateTime|date:'EEE, d MMM y'}}</td><td>{{b.startDateTime|date:'shortTime'}} – {{b.endDateTime|date:'shortTime'}}</td><td>{{b.requiredSkillName || '—'}}</td><td><span class="badge good">{{label(b.status)}}</span></td></tr></tbody>
      </table>
    </div>

    <div class="panel" *ngIf="!loading && !pending.length && !upcoming.length"><div class="empty">No pending requests or upcoming shifts.</div></div>
    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`
    .requests{margin-top:22px}.section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.section-head h3{margin:0 0 4px}.section-head p{margin:0;color:#64748b;font-size:14px}.request-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.request-card{border:1px solid #dbe3ee;border-radius:14px;padding:16px;background:#fff}.request-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.detail{display:flex;justify-content:space-between;gap:20px;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.detail span{color:#64748b}.request-flags{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.request-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media(max-width:850px){.request-grid{grid-template-columns:1fr}}
  `]
})
export class CasualDashboardComponent implements OnInit {
  d?:CasualDashboard;
  pending:Booking[]=[];
  upcoming:Booking[]=[];
  loading=false;
  processingId:number|null=null;
  error='';
  message='';
  label=bookingStatusLabel;

  constructor(private api:CasualApiService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.load();}

  load(){
    this.loading=true; this.error='';
    forkJoin({dashboard:this.api.dashboard(),bookings:this.api.bookings()})
      .pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();}))
      .subscribe({
        next:({dashboard,bookings})=>{
          const now=Date.now();
          this.d=dashboard;
          this.pending=bookings.filter(x=>x.status===1).sort(this.byStartAsc);
          this.upcoming=bookings.filter(x=>x.status===2 && new Date(x.endDateTime).getTime()>=now).sort(this.byStartAsc);
          this.cdr.detectChanges();
        },
        error:e=>{this.error=e?.error?.message??'Unable to load dashboard.';this.cdr.detectChanges();}
      });
  }

  accept(b:Booking){
    this.processingId=b.id; this.error=''; this.message='';
    this.api.accept(b.id).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.message='Shift accepted.';this.load();},error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}});
  }

  decline(b:Booking){
    const reason=prompt('Optional decline reason')||undefined;
    this.processingId=b.id; this.error=''; this.message='';
    this.api.decline(b.id,reason).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.message='Shift rejected.';this.load();},error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}});
  }

  private byStartAsc=(a:Booking,b:Booking)=>new Date(a.startDateTime).getTime()-new Date(b.startDateTime).getTime();
}

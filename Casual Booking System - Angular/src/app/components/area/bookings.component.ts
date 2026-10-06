import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Booking, AreaStoreSummary, bookingStatusLabel } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Area Bookings & Overrides</h1>
    <p class="lead">View assigned-store bookings and create audited zone/skill exceptions. Hard safety rules remain enforced.</p>

    <div class="panel">
      <h3>Manager override booking</h3>
      <div class="form-grid">
        <select [(ngModel)]="form.storeId">
          <option [ngValue]="0">Select store</option>
          <option *ngFor="let s of stores" [ngValue]="s.storeId">{{s.storeName}} ({{s.zoneName}})</option>
        </select>
        <input type="number" [(ngModel)]="form.casualProfileId" placeholder="Casual profile ID">
        <input type="datetime-local" [(ngModel)]="form.startDateTime">
        <input type="datetime-local" [(ngModel)]="form.endDateTime">
        <select [(ngModel)]="form.requiredSkillId">
          <option [ngValue]="null">No required skill</option>
          <option *ngFor="let s of skills" [ngValue]="s.id">{{s.name}}</option>
        </select>
        <input [(ngModel)]="form.overrideReason" placeholder="Override reason">
        <button (click)="createOverride()">Create audited override</button>
      </div>
      <div class="callout good" *ngIf="message">{{message}}</div>
      <div class="callout error-box" *ngIf="error">{{error}}</div>
    </div>

    <div class="panel">
      <table>
        <thead><tr><th>Store</th><th>Casual</th><th>Shift</th><th>Status</th><th>Flags</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let b of rows">
            <td>{{b.storeName}}</td>
            <td>{{b.casualName}}</td>
            <td>{{b.startDateTime|date:'short'}} → {{b.endDateTime|date:'shortTime'}}</td>
            <td><span class="badge">{{label(b.status)}}</span></td>
            <td>
              <span class="badge" *ngIf="b.isEmergency">Emergency</span>
              <span class="badge" *ngIf="b.hasManagerOverride">Override</span>
            </td>
            <td><button class="danger" *ngIf="b.status===1||b.status===2" (click)="cancel(b)">Cancel</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AreaBookingsComponent implements OnInit {
  rows:Booking[]=[];
  stores:AreaStoreSummary[]=[];
  skills:{id:number,name:string}[]=[];
  label=bookingStatusLabel;
  message='';error='';
  form={storeId:0,casualProfileId:0,startDateTime:'',endDateTime:'',requiredSkillId:null as number|null,overrideReason:''};

  constructor(private api:AreaManagerApiService,private auth:AuthService){}
  ngOnInit(){
    this.api.stores().subscribe(x=>this.stores=x);
    this.auth.lookupSkills().subscribe(x=>this.skills=x);
    this.load();
  }
  load(){this.api.bookings().subscribe(x=>this.rows=x);}
  createOverride(){
    this.message='';this.error='';
    this.api.createOverrideBooking(this.form).subscribe({
      next:()=>{this.message='Override booking request created and audited.';this.load();},
      error:e=>this.error=e?.error?.message??e.message
    });
  }
  cancel(b:Booking){
    const reason=prompt('Cancellation reason');
    if(reason)this.api.cancelBooking(b.id,reason).subscribe(()=>this.load());
  }
}

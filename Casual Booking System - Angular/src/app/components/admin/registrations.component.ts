import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Registration } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone:true,
  imports:[CommonModule],
  template:`
    <h1>Pending Registrations</h1>
    <p class="lead">Review profile details before approving or rejecting an account.</p>

    <div class="registration-grid" *ngIf="rows.length">
      <div class="panel registration-card" *ngFor="let x of rows">
        <div class="card-head">
          <div>
            <h3>{{x.firstName}} {{x.lastName}}</h3>
            <span>{{x.email}}</span>
          </div>
          <span class="badge">{{x.role}}</span>
        </div>

        <div class="details">
          <div><span>Role</span><b>{{x.role}}</b></div>
          <div *ngIf="x.phone"><span>Phone</span><b>{{x.phone}}</b></div>
          <div *ngIf="x.city"><span>City</span><b>{{x.city}}</b></div>
          <div *ngIf="x.zoneName"><span>Zone</span><b>{{x.zoneName}}</b></div>
          <div *ngIf="x.storeName"><span>Store</span><b>{{x.storeName}}</b></div>
          <div *ngIf="x.storeCode"><span>Store code</span><b>{{x.storeCode}}</b></div>
          <div *ngIf="x.storeAddress"><span>Address</span><b>{{x.storeAddress}}</b></div>
        </div>

        <div class="skills" *ngIf="x.skills?.length">
          <span class="skill" *ngFor="let s of x.skills">{{s}}</span>
        </div>

        <div class="actions">
          <button type="button" (click)="approve(x)" [disabled]="processingId===x.userId">Approve</button>
          <button type="button" class="danger" (click)="reject(x)" [disabled]="processingId===x.userId">Reject</button>
        </div>
      </div>
    </div>

    <div class="panel empty" *ngIf="!loading && !rows.length">No pending registrations.</div>
    <div class="error" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`
    .registration-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.registration-card{margin:0}.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.card-head h3{margin:0 0 4px}.card-head span{color:#64748b}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;margin-top:16px}.details div{display:flex;flex-direction:column;gap:3px}.details span{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.03em}.details b{font-size:14px}.skills{display:flex;gap:7px;flex-wrap:wrap;margin-top:16px}.skill{padding:6px 9px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}@media(max-width:850px){.registration-grid{grid-template-columns:1fr}.details{grid-template-columns:1fr}}
  `]
})
export class RegistrationsComponent implements OnInit{
  rows:Registration[]=[]; loading=false; processingId:string|null=null; error='';
  constructor(private api:AdminApiService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.load();}
  load(){this.loading=true;this.error='';this.api.registrations().pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();})).subscribe({next:x=>{this.rows=x;this.cdr.detectChanges();},error:e=>{this.error=e?.error?.message??'Unable to load registrations.';this.cdr.detectChanges();}});}
  approve(x:Registration){if(this.processingId)return;this.processingId=x.userId;this.api.approve(x.userId).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.rows=this.rows.filter(r=>r.userId!==x.userId);this.cdr.detectChanges();},error:e=>{this.error=e?.error?.message??'Unable to approve registration.';this.cdr.detectChanges();}});}
  reject(x:Registration){if(this.processingId)return;this.processingId=x.userId;this.api.reject(x.userId).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({next:()=>{this.rows=this.rows.filter(r=>r.userId!==x.userId);this.cdr.detectChanges();},error:e=>{this.error=e?.error?.message??'Unable to reject registration.';this.cdr.detectChanges();}});}
}

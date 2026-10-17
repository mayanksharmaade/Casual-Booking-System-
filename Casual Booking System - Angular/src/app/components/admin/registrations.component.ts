import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Registration } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Pending Registrations</h1>
    <p class="lead">Search by Employee ID, Store ID, name or email, then approve or reject.</p>

    <div class="panel search-panel">
      <input [(ngModel)]="search" (keyup.enter)="applySearch()" placeholder="Employee ID, Store ID, name or email">
      <select [(ngModel)]="pageSize" (change)="changePageSize()">
        <option [ngValue]="10">10 per page</option>
        <option [ngValue]="25">25 per page</option>
        <option [ngValue]="50">50 per page</option>
      </select>
      <button type="button" (click)="applySearch()">Search</button>
      <button type="button" class="secondary" (click)="clearSearch()" *ngIf="search">Clear</button>
    </div>

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
          <div *ngIf="x.employeeId"><span>Employee ID</span><b>{{x.employeeId}}</b></div>
          <div *ngIf="x.storeCode"><span>Store ID</span><b>{{x.storeCode}}</b></div>
          <div><span>Role</span><b>{{x.role}}</b></div>
          <div *ngIf="x.phone"><span>Phone</span><b>{{x.phone}}</b></div>
          <div *ngIf="x.city"><span>City</span><b>{{x.city}}</b></div>
          <div *ngIf="x.zoneName"><span>Zone</span><b>{{x.zoneName}}</b></div>
          <div *ngIf="x.storeName"><span>Store</span><b>{{x.storeName}}</b></div>
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

    <div class="panel empty" *ngIf="!loading && !rows.length">No pending registrations found.</div>
    <div class="error" *ngIf="error">{{error}}</div>

    <div class="pager" *ngIf="totalCount > 0">
      <button type="button" (click)="go(page-1)" [disabled]="page<=1 || loading">Previous</button>
      <span>Page {{page}} of {{totalPages}} · {{totalCount}} records</span>
      <button type="button" (click)="go(page+1)" [disabled]="page>=totalPages || loading">Next</button>
    </div>
  `,
  styleUrls:['../page.scss'],
  styles:[`
    .search-panel{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.search-panel input{min-width:280px;flex:1}.registration-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.registration-card{margin:0}.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.card-head h3{margin:0 0 4px}.card-head span{color:#64748b}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;margin-top:16px}.details div{display:flex;flex-direction:column;gap:3px}.details span{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.03em}.details b{font-size:14px}.skills{display:flex;gap:7px;flex-wrap:wrap;margin-top:16px}.skill{padding:6px 9px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.pager{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:18px}.secondary{background:#64748b}@media(max-width:850px){.registration-grid{grid-template-columns:1fr}.details{grid-template-columns:1fr}}
  `]
})
export class RegistrationsComponent implements OnInit{
  rows:Registration[]=[];
  loading=false;
  processingId:string|null=null;
  error='';
  search='';
  page=1;
  pageSize=10;
  totalCount=0;
  totalPages=1;

  constructor(private api:AdminApiService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.load();}

  load(){
    this.loading=true;this.error='';
    this.api.registrations(this.search.trim(),this.page,this.pageSize)
      .pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();}))
      .subscribe({
        next:x=>{this.rows=x.items;this.page=x.page;this.pageSize=x.pageSize;this.totalCount=x.totalCount;this.totalPages=x.totalPages;this.cdr.detectChanges();},
        error:e=>{this.error=e?.error?.message??'Unable to load registrations.';this.cdr.detectChanges();}
      });
  }

  applySearch(){this.page=1;this.load();}
  clearSearch(){this.search='';this.page=1;this.load();}
  changePageSize(){this.page=1;this.load();}
  go(page:number){if(page<1||page>this.totalPages)return;this.page=page;this.load();}

  approve(x:Registration){
    if(this.processingId)return;
    this.processingId=x.userId;
    this.api.approve(x.userId).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>this.load(),
      error:e=>{this.error=e?.error?.message??'Unable to approve registration.';this.cdr.detectChanges();}
    });
  }

  reject(x:Registration){
    if(this.processingId)return;
    this.processingId=x.userId;
    this.api.reject(x.userId).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>this.load(),
      error:e=>{this.error=e?.error?.message??'Unable to reject registration.';this.cdr.detectChanges();}
    });
  }
}

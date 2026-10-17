import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../services/admin-api.service';
import { UserAccount } from '../../models/api.models';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Users</h1>
    <p class="lead">Find people by Employee ID, name, email or linked Store ID.</p>

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

    <div class="panel">
      <table *ngIf="rows.length">
        <thead><tr><th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th><th>Approval</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let u of rows">
            <td>{{u.employeeId||'—'}}</td>
            <td>{{u.firstName}} {{u.lastName}}</td>
            <td>{{u.email}}</td>
            <td>{{role(u.role)}}</td>
            <td>{{approval(u.approvalStatus)}}</td>
            <td><span class="badge" [class.good]="u.isActive">{{u.isActive?'Active':'Inactive'}}</span></td>
            <td><button type="button" (click)="toggle(u)" [disabled]="processingId===u.userId || u.approvalStatus!==2">{{u.isActive?'Deactivate':'Activate'}}</button></td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!loading && !rows.length">No users found.</div>
      <div class="error" *ngIf="error">{{error}}</div>
    </div>

    <div class="pager" *ngIf="totalCount>0">
      <button type="button" (click)="go(page-1)" [disabled]="page<=1 || loading">Previous</button>
      <span>Page {{page}} of {{totalPages}} · {{totalCount}} records</span>
      <button type="button" (click)="go(page+1)" [disabled]="page>=totalPages || loading">Next</button>
    </div>
  `,
  styleUrls:['../page.scss'],
  styles:[`.search-panel{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.search-panel input{min-width:280px;flex:1}.pager{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:18px}.secondary{background:#64748b}`]
})
export class UsersComponent implements OnInit{
  rows:UserAccount[]=[];
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
    this.api.users(this.search.trim(),this.page,this.pageSize).pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();})).subscribe({
      next:x=>{this.rows=x.items;this.page=x.page;this.pageSize=x.pageSize;this.totalCount=x.totalCount;this.totalPages=x.totalPages;this.cdr.detectChanges();},
      error:e=>{this.error=e?.error?.message??'Unable to load users.';this.cdr.detectChanges();}
    });
  }

  applySearch(){this.page=1;this.load();}
  clearSearch(){this.search='';this.page=1;this.load();}
  changePageSize(){this.page=1;this.load();}
  go(page:number){if(page<1||page>this.totalPages)return;this.page=page;this.load();}

  toggle(u:UserAccount){
    if(this.processingId||u.approvalStatus!==2)return;
    const nextState=!u.isActive;
    this.processingId=u.userId;this.error='';
    this.api.setUserActive(u.userId,nextState).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>{this.rows=this.rows.map(x=>x.userId===u.userId?{...x,isActive:nextState}:x);this.cdr.detectChanges();},
      error:e=>{this.error=e?.error?.message??'Unable to update user status.';this.cdr.detectChanges();}
    });
  }

  role(v:number){return ({1:'Super Admin',2:'Store Manager',3:'Assistant Manager',4:'Casual',5:'Area Manager'} as any)[v]||v;}
  approval(v:number){return ({1:'Pending',2:'Approved',3:'Rejected'} as any)[v]||v;}
}

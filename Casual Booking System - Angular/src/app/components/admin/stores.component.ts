import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminStore } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Stores</h1>
    <p class="lead">Find stores by Store ID, store name, city or zone.</p>

    <div class="panel search-panel">
      <input [(ngModel)]="search" (keyup.enter)="applySearch()" placeholder="Store ID, name, city or zone">
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
        <thead><tr><th>Store ID</th><th>Store</th><th>City</th><th>Zone</th><th>Approval</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let s of rows">
            <td>{{s.code}}</td><td>{{s.name}}</td><td>{{s.city}}</td><td>{{s.zoneName}}</td>
            <td>{{approval(s.registrationStatus)}}</td><td>{{s.isActive?'Active':'Inactive'}}</td>
            <td><button type="button" (click)="toggle(s)" [disabled]="processingId===s.id || s.registrationStatus!==2">{{s.isActive?'Deactivate':'Activate'}}</button></td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!loading && !rows.length">No stores found.</div>
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
export class StoresComponent implements OnInit{
  rows:AdminStore[]=[];
  loading=false;
  processingId:number|null=null;
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
    this.api.stores(this.search.trim(),this.page,this.pageSize).pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();})).subscribe({
      next:x=>{this.rows=x.items;this.page=x.page;this.pageSize=x.pageSize;this.totalCount=x.totalCount;this.totalPages=x.totalPages;this.cdr.detectChanges();},
      error:e=>{this.error=e?.error?.message??'Unable to load stores.';this.cdr.detectChanges();}
    });
  }

  applySearch(){this.page=1;this.load();}
  clearSearch(){this.search='';this.page=1;this.load();}
  changePageSize(){this.page=1;this.load();}
  go(page:number){if(page<1||page>this.totalPages)return;this.page=page;this.load();}

  toggle(s:AdminStore){
    if(this.processingId!==null||s.registrationStatus!==2)return;
    const nextState=!s.isActive;
    this.processingId=s.id;this.error='';
    this.api.setStoreActive(s.id,nextState).pipe(finalize(()=>{this.processingId=null;this.cdr.detectChanges();})).subscribe({
      next:()=>{this.rows=this.rows.map(x=>x.id===s.id?{...x,isActive:nextState}:x);this.cdr.detectChanges();},
      error:e=>{this.error=e?.error?.message??'Unable to update store status.';this.cdr.detectChanges();}
    });
  }

  approval(v:number){return ({1:'Pending',2:'Approved',3:'Rejected'} as any)[v]||v;}
}

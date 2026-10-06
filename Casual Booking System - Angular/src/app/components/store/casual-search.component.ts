import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CasualSearch, CasualSearchFilters } from '../../models/api.models';
import { StoreApiService } from '../../services/store-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Find Casuals</h1>
    <p class="lead">Filter approved Casuals by city, zone and multiple skills. Availability and booking rules are rechecked server-side.</p>

    <div class="panel">
      <div class="form-grid search-grid">
        <label>
          <span>City</span>
          <select [(ngModel)]="city">
            <option value="">All cities</option>
            <option *ngFor="let c of filters.cities" [value]="c">{{c}}</option>
          </select>
        </label>

        <label>
          <span>Zone</span>
          <select [(ngModel)]="zoneId">
            <option [ngValue]="null">All zones</option>
            <option *ngFor="let z of filters.zones" [ngValue]="z.id">{{z.name}}</option>
          </select>
        </label>

        <label>
          <span>Name / phone</span>
          <input [(ngModel)]="search" placeholder="Search Casual">
        </label>

        <label>
          <span>Shift start</span>
          <input type="datetime-local" [(ngModel)]="start">
        </label>

        <label>
          <span>Shift end</span>
          <input type="datetime-local" [(ngModel)]="end">
        </label>

        <label>
          <span>Required skill for booking</span>
          <select [(ngModel)]="requiredSkillId">
            <option [ngValue]="null">No single required skill</option>
            <option *ngFor="let s of filters.skills" [ngValue]="s.id">{{s.name}}</option>
          </select>
        </label>
      </div>

      <div class="skill-filter" *ngIf="filters.skills.length">
        <div class="filter-heading">
          <strong>Filter by skills</strong>
          <span>{{selectedSkillIds.size}} selected</span>
        </div>

        <div class="skill-grid">
          <label class="skill-chip" *ngFor="let s of filters.skills" [class.selected]="selectedSkillIds.has(s.id)">
            <input type="checkbox" [checked]="selectedSkillIds.has(s.id)" (change)="toggleSkill(s.id,$any($event.target).checked)">
            <span>{{s.name}}</span>
          </label>
        </div>
      </div>

      <div class="search-actions">
        <label class="check"><input type="checkbox" [(ngModel)]="emergency"> Emergency booking</label>
        <button type="button" (click)="run()" [disabled]="loading || !start || !end">
          {{loading ? 'Searching...' : 'Search Casuals'}}
        </button>
      </div>
    </div>

    <div class="cards" *ngIf="rows.length">
      <div class="person casual-card" *ngFor="let c of rows">
        <div class="person-main">
          <div class="title-row">
            <strong>{{c.name}}</strong>
            <span class="badge" [class.good]="c.isAvailable">{{c.isAvailable?'Available':'Unavailable'}}</span>
          </div>
          <span>{{c.city}} · {{c.phone}} · {{c.zoneName||'No zone'}}</span>
          <span>Rating {{c.rating|number:'1.1-1'}}</span>
          <span *ngIf="c.baseHourlyRate!=null">Base rate {{c.baseHourlyRate|currency:'AUD':'symbol':'1.2-2'}}/h · Shift rate {{c.effectiveHourlyRate|currency:'AUD':'symbol':'1.2-2'}}/h</span>
          <span *ngIf="c.baseHourlyRate!=null">Paid hours {{c.paidHours|number:'1.1-2'}} · Estimated store cost {{c.estimatedCost|currency:'AUD':'symbol':'1.2-2'}}</span>
          <span class="muted" *ngIf="c.baseHourlyRate==null">Pay rate not configured by Super Admin</span>

          <div class="skills-wrap">
            <span class="badge" *ngFor="let skill of c.skills">{{skill}}</span>
            <span class="muted" *ngIf="!c.skills.length">No skills listed</span>
          </div>

          <div class="zone-warning" *ngIf="!c.isInStoreZone">
            Outside your Store zone — Area Manager override is required to book.
          </div>
        </div>

        <div class="person-action">
          <button type="button" [disabled]="!c.isAvailable || bookingId===c.casualProfileId" (click)="book(c)">
            {{bookingId===c.casualProfileId ? 'Sending...' : 'Request booking'}}
          </button>
        </div>
      </div>
    </div>

    <div class="empty" *ngIf="searched && !loading && !rows.length">No Casuals matched those filters.</div>
    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>
  `,
  styleUrls:['../page.scss'],
  styles:[`
    .search-grid label{display:flex;flex-direction:column;gap:6px}.search-grid label span{font-size:13px;font-weight:600;color:#475569}
    .skill-filter{margin-top:18px}.filter-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#475569;font-size:13px}
    .skill-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.skill-chip{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #dbe3ee;border-radius:10px;background:#fff;cursor:pointer}.skill-chip.selected{border-color:#2563eb;background:#eff6ff}.skill-chip input{width:16px;height:16px;margin:0}
    .search-actions{display:flex;justify-content:space-between;align-items:center;margin-top:18px;gap:15px}.casual-card{align-items:stretch}.person-main{flex:1}.title-row{display:flex;align-items:center;gap:10px;margin-bottom:4px}.skills-wrap{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.zone-warning{margin-top:9px;font-size:12px;color:#b45309}.person-action{display:flex;align-items:center}.muted{color:#64748b;font-size:13px}
    @media(max-width:1000px){.skill-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.skill-grid{grid-template-columns:1fr}.search-actions{align-items:stretch;flex-direction:column}.search-actions button{width:100%}}
  `]
})
export class CasualSearchComponent implements OnInit {
  rows:CasualSearch[]=[];
  filters:CasualSearchFilters={cities:[],zones:[],skills:[]};
  city='';
  zoneId:number|null=null;
  search='';
  start='';
  end='';
  requiredSkillId:number|null=null;
  selectedSkillIds=new Set<number>();
  emergency=false;
  message='';
  error='';
  loading=false;
  searched=false;
  bookingId:number|null=null;

  constructor(private api:StoreApiService,private cdr:ChangeDetectorRef){}

  ngOnInit(){
    this.api.casualFilters().subscribe({
      next:x=>{this.filters=x;this.cdr.detectChanges();},
      error:e=>{this.error=e?.error?.message??'Unable to load search filters.';this.cdr.detectChanges();}
    });
  }

  toggleSkill(id:number,on:boolean){
    const next=new Set(this.selectedSkillIds);
    on?next.add(id):next.delete(id);
    this.selectedSkillIds=next;
  }

  run(){
    this.message=''; this.error=''; this.searched=true;
    if(!this.start||!this.end)return;
    this.loading=true;
    this.api.searchCasuals(this.city,this.search,this.start,this.end,this.zoneId,[...this.selectedSkillIds])
      .pipe(finalize(()=>{this.loading=false;this.cdr.detectChanges();}))
      .subscribe({
        next:x=>{this.rows=x;this.cdr.detectChanges();},
        error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}
      });
  }

  book(c:CasualSearch){
    this.message=''; this.error=''; this.bookingId=c.casualProfileId;
    this.api.createBooking({
      casualProfileId:c.casualProfileId,
      startDateTime:this.start,
      endDateTime:this.end,
      requiredSkillId:this.requiredSkillId,
      isEmergency:this.emergency
    }).pipe(finalize(()=>{this.bookingId=null;this.cdr.detectChanges();}))
      .subscribe({
        next:()=>{this.message=`Booking request sent to ${c.name}. It will now appear on the Casual dashboard.`;this.cdr.detectChanges();},
        error:e=>{this.error=e?.error?.message??e.message;this.cdr.detectChanges();}
      });
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Employee, EmployeeWorkPattern, employeeTypeLabel } from '../../models/api.models';
import { StoreApiService } from '../../services/store-api.service';

interface VolunteerDayDraft {
  dayOfWeek:number;
  label:string;
  enabled:boolean;
  startTime:string;
  endTime:string;
}

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Store Staff</h1>
    <p class="lead">
      Maintain PT, FT and Volunteers. Store/Assistant Managers are linked automatically.
      Paid staff are rostered manually from the Roster screen. Volunteers can have a simple recurring weekly schedule.
    </p>

    <div class="panel">
      <h3>Add PT / FT / Volunteer</h3>
      <div class="form-grid">
        <input [(ngModel)]="firstName" placeholder="First name">
        <input [(ngModel)]="lastName" placeholder="Last name">
        <select [(ngModel)]="employeeType">
          <option [ngValue]="2">Part-Time</option>
          <option [ngValue]="3">Full-Time</option>
          <option [ngValue]="4">Volunteer</option>
        </select>
        <input [(ngModel)]="phone" placeholder="Phone">
        <input [(ngModel)]="skills" placeholder="Skills">
        <button type="button" (click)="add()" [disabled]="savingStaff">
          {{savingStaff?'Adding...':'Add staff'}}
        </button>
      </div>
    </div>

    <div class="panel">
      <h3>Create Assistant Manager login</h3>
      <div class="form-grid">
        <input [(ngModel)]="amFirst" placeholder="First name">
        <input [(ngModel)]="amLast" placeholder="Last name">
        <input [(ngModel)]="amEmail" placeholder="Email">
        <input type="password" [(ngModel)]="amPassword" placeholder="Temporary password">
        <button type="button" (click)="addAssistant()" [disabled]="savingAssistant">
          {{savingAssistant?'Creating...':'Create Assistant Manager'}}
        </button>
      </div>
    </div>

    <div class="panel">
      <h3>Volunteer Weekly Schedule</h3>
      <p class="lead">
        Set a volunteer's usual weekly days once. Each day can have different hours,
        for example Monday 1:00–4:00 PM and Friday 11:00 AM–4:00 PM.
        Volunteer hours are unpaid and do not affect the 37.5-hour paid-staff limit.
      </p>

      <div class="form-grid">
        <select [(ngModel)]="volunteerId" (change)="loadVolunteerSchedule()">
          <option [ngValue]="0">Select volunteer</option>
          <option *ngFor="let e of volunteers" [ngValue]="e.id">
            {{e.firstName}} {{e.lastName}}
          </option>
        </select>
      </div>

      <div class="volunteer-grid" *ngIf="volunteerId">
        <div class="volunteer-day" *ngFor="let d of volunteerDays">
          <label class="day-check">
            <input type="checkbox" [(ngModel)]="d.enabled">
            <strong>{{d.label}}</strong>
          </label>
          <input type="time" [(ngModel)]="d.startTime" [disabled]="!d.enabled">
          <span>to</span>
          <input type="time" [(ngModel)]="d.endTime" [disabled]="!d.enabled">
        </div>
      </div>

      <button type="button"
              *ngIf="volunteerId"
              (click)="saveVolunteerSchedule()"
              [disabled]="savingPattern">
        {{savingPattern?'Saving...':'Save volunteer schedule'}}
      </button>

      <table *ngIf="patterns.length">
        <thead>
          <tr><th>Day</th><th>Start</th><th>End</th><th>Hours</th><th>Cost</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of patterns">
            <td>{{p.dayName}}</td>
            <td>{{p.startTime}}</td>
            <td>{{p.endTime}}</td>
            <td>{{p.scheduledHours|number:'1.1-2'}} h</td>
            <td>Unpaid</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="callout error-box" *ngIf="error">{{error}}</div>

    <div class="panel">
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Phone</th><th>Skills</th><th>Base Rate</th></tr></thead>
        <tbody>
          <tr *ngFor="let e of rows">
            <td>{{e.firstName}} {{e.lastName}}</td>
            <td>{{label(e.employeeType)}}</td>
            <td>{{e.phone||'—'}}</td>
            <td>{{e.skillSummary||'—'}}</td>
            <td>{{e.employeeType===4?'Unpaid':(e.baseHourlyRate==null?'Set by Super Admin':(e.baseHourlyRate|currency:'AUD':'symbol':'1.2-2'))}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles:[`
    .volunteer-grid{display:grid;gap:.65rem;margin:1rem 0}
    .volunteer-day{display:grid;grid-template-columns:120px 150px auto 150px;align-items:center;gap:.65rem;padding:.7rem;border:1px solid #d7dee8;border-radius:10px;background:#fff}
    .day-check{display:flex;align-items:center;gap:.45rem}
    @media(max-width:720px){.volunteer-day{grid-template-columns:1fr 1fr}.volunteer-day span{display:none}}
  `],
  styleUrls:['../page.scss']
})
export class StaffComponent implements OnInit {
  rows:Employee[]=[];
  firstName='';lastName='';employeeType=2;phone='';skills='';
  amFirst='';amLast='';amEmail='';amPassword='';
  message='';error='';
  savingStaff=false;savingAssistant=false;savingPattern=false;
  label=employeeTypeLabel;

  volunteerId=0;
  patterns:EmployeeWorkPattern[]=[];
  volunteerDays:VolunteerDayDraft[]=[
    {dayOfWeek:1,label:'Monday',enabled:false,startTime:'09:00',endTime:'14:00'},
    {dayOfWeek:2,label:'Tuesday',enabled:false,startTime:'09:00',endTime:'14:00'},
    {dayOfWeek:3,label:'Wednesday',enabled:false,startTime:'09:00',endTime:'14:00'},
    {dayOfWeek:4,label:'Thursday',enabled:false,startTime:'09:00',endTime:'14:00'},
    {dayOfWeek:5,label:'Friday',enabled:false,startTime:'09:00',endTime:'14:00'},
    {dayOfWeek:6,label:'Saturday',enabled:false,startTime:'09:00',endTime:'14:00'}
  ];

  constructor(private api:StoreApiService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.load();}

  get volunteers(){return this.rows.filter(x=>x.employeeType===4 && x.isActive);}

  load(){
    this.api.employees().subscribe({
      next:x=>{
        this.rows=x;
        if(this.volunteerId && !this.volunteers.some(e=>e.id===this.volunteerId)){
          this.volunteerId=0;this.patterns=[];
        }
        this.cdr.detectChanges();
      },
      error:e=>{this.error=e?.error?.message??'Unable to load staff.';this.cdr.detectChanges();}
    });
  }

  add(){
    if(!this.firstName||!this.lastName||this.savingStaff)return;
    this.savingStaff=true;this.error='';this.message='';
    this.api.createEmployee({
      firstName:this.firstName,
      lastName:this.lastName,
      employeeType:this.employeeType,
      phone:this.phone,
      skillSummary:this.skills
    })
    .pipe(finalize(()=>{this.savingStaff=false;this.cdr.detectChanges();}))
    .subscribe({
      next:created=>{
        this.rows=[...this.rows,created].sort((a,b)=>a.firstName.localeCompare(b.firstName));
        this.firstName=this.lastName=this.phone=this.skills='';
        this.message=created.employeeType===4
          ? 'Volunteer added. You can set the volunteer weekly schedule below.'
          : 'Paid staff member added. Add roster dates from the Roster screen.';
        this.cdr.detectChanges();
      },
      error:e=>{this.error=e?.error?.message??'Unable to add staff.';this.cdr.detectChanges();}
    });
  }

  addAssistant(){
    if(!this.amEmail||!this.amPassword||this.savingAssistant)return;
    this.savingAssistant=true;this.error='';this.message='';
    this.api.createAssistantManager({
      email:this.amEmail,password:this.amPassword,
      firstName:this.amFirst,lastName:this.amLast
    })
    .pipe(finalize(()=>{this.savingAssistant=false;this.cdr.detectChanges();}))
    .subscribe({
      next:()=>{
        this.message='Assistant Manager account created and linked to this Store.';
        this.amEmail=this.amPassword=this.amFirst=this.amLast='';
        this.load();
      },
      error:e=>{this.error=e?.error?.message??'Unable to create Assistant Manager.';this.cdr.detectChanges();}
    });
  }

  resetVolunteerDays(){
    this.volunteerDays=this.volunteerDays.map(x=>({
      ...x,enabled:false,startTime:'09:00',endTime:'14:00'
    }));
  }

  loadVolunteerSchedule(){
    this.patterns=[];
    this.error='';this.message='';
    this.resetVolunteerDays();

    if(!this.volunteerId){this.cdr.detectChanges();return;}

    this.api.workPattern(this.volunteerId).subscribe({
      next:x=>{
        this.patterns=x;
        for(const p of x){
          const day=this.volunteerDays.find(d=>d.dayOfWeek===p.dayOfWeek);
          if(day){
            day.enabled=true;
            day.startTime=p.startTime;
            day.endTime=p.endTime;
          }
        }
        this.cdr.detectChanges();
      },
      error:e=>{this.error=e?.error?.message??'Unable to load volunteer schedule.';this.cdr.detectChanges();}
    });
  }

  saveVolunteerSchedule(){
    if(!this.volunteerId||this.savingPattern)return;

    const days=this.volunteerDays
      .filter(x=>x.enabled)
      .map(x=>({dayOfWeek:x.dayOfWeek,startTime:x.startTime,endTime:x.endTime}));

    this.savingPattern=true;this.error='';this.message='';

    this.api.setWorkPattern(this.volunteerId,{days})
      .pipe(finalize(()=>{this.savingPattern=false;this.cdr.detectChanges();}))
      .subscribe({
        next:x=>{
          this.patterns=x;
          this.message='Volunteer weekly schedule saved. It will repeat weekly and can still be overridden with a manual roster entry.';
          this.cdr.detectChanges();
        },
        error:e=>{this.error=e?.error?.message??'Unable to save volunteer schedule.';this.cdr.detectChanges();}
      });
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, retry } from 'rxjs';
import { Zone } from '../../models/api.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector:'app-register-area-manager',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule,RouterLink],
  template:`
    <div class="auth"><div class="card">
      <h1>Area Manager registration</h1>
      <p>One Area Manager manages one Zone. Your account requires Super Admin approval.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Employee ID<input formControlName="employeeId" placeholder="e.g. EMP-30001"></label>
        <label>Email<input formControlName="email"></label>
        <label>Password<input type="password" formControlName="password"></label>
        <div class="two"><label>First name<input formControlName="firstName"></label><label>Last name<input formControlName="lastName"></label></div>
        <label>Assigned Zone
          <select formControlName="zoneId" [disabled]="loadingZones">
            <option [ngValue]="0">{{loadingZones?'Loading zones...':'Select zone'}}</option>
            <option *ngFor="let z of zones" [ngValue]="z.id">{{z.city}} · {{z.name}}</option>
          </select>
        </label>
        <button type="button" *ngIf="zoneError" (click)="loadZones()">Retry loading zones</button>
        <div class="error" *ngIf="zoneError">{{zoneError}}</div>
        <div class="success" *ngIf="done">Registration submitted.</div>
        <div class="error" *ngIf="error">{{error}}</div>
        <button [disabled]="submitting||loadingZones||form.invalid||form.value.zoneId===0">{{submitting?'Registering...':'Register'}}</button>
      </form><a routerLink="/login">Back to login</a>
    </div></div>`,
  styleUrl:'./auth.scss'
})
export class RegisterAreaManagerComponent implements OnInit {
  done=false; error=''; zoneError=''; loadingZones=false; submitting=false; zones:Zone[]=[];
  form=inject(FormBuilder).nonNullable.group({employeeId:['',Validators.required],email:['',[Validators.required,Validators.email]],password:['',Validators.required],firstName:['',Validators.required],lastName:['',Validators.required],zoneId:[0,Validators.min(1)]});
  constructor(private auth:AuthService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.loadZones();}
  loadZones(){
    this.loadingZones=true; this.zoneError='';
    this.auth.lookupZones().pipe(retry({count:2,delay:400}),finalize(()=>{this.loadingZones=false;this.cdr.detectChanges();})).subscribe({
      next:z=>{this.zones=z.filter(x=>x.isActive).sort((a,b)=>(a.city+a.name).localeCompare(b.city+b.name));this.cdr.detectChanges();},
      error:()=>{this.zoneError='Unable to load zones. Please retry.';this.cdr.detectChanges();}
    });
  }
  submit(){if(this.form.invalid||this.form.value.zoneId===0||this.submitting)return;this.error='';this.done=false;this.submitting=true;this.auth.registerAreaManager(this.form.getRawValue()).pipe(finalize(()=>{this.submitting=false;this.cdr.detectChanges();})).subscribe({next:()=>{this.done=true;this.cdr.detectChanges();},error:e=>{this.error=e?.error?.message??e?.message??'Registration failed.';this.cdr.detectChanges();}});}
}

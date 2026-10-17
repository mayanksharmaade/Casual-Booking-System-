import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector:'app-register-area-manager',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule,RouterLink],
  template:`
    <div class="auth">
      <div class="card">
        <h1>Area Manager registration</h1>
        <p>Your account requires Super Admin approval.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Employee ID<input formControlName="employeeId" placeholder="e.g. EMP-30001"></label>
          <label>Email<input formControlName="email"></label>
          <label>Password<input type="password" formControlName="password"></label>
          <div class="two">
            <label>First name<input formControlName="firstName"></label>
            <label>Last name<input formControlName="lastName"></label>
          </div>
          <div class="success" *ngIf="done">Registration submitted.</div>
          <div class="error" *ngIf="error">{{error}}</div>
          <button [disabled]="form.invalid">Register</button>
        </form>
        <a routerLink="/login">Back to login</a>
      </div>
    </div>
  `,
  styleUrl:'./auth.scss'
})
export class RegisterAreaManagerComponent {
  done=false;
  error='';
  form=inject(FormBuilder).nonNullable.group({
    employeeId:['',Validators.required],
    email:['',[Validators.required,Validators.email]],
    password:['',Validators.required],
    firstName:['',Validators.required],
    lastName:['',Validators.required]
  });
  constructor(private auth:AuthService){}
  submit(){
    if(this.form.invalid)return;
    this.error=''; this.done=false;
    this.auth.registerAreaManager(this.form.getRawValue()).subscribe({
      next:()=>this.done=true,
      error:e=>this.error=e?.error?.message??e?.message??'Registration failed.'
    });
  }
}

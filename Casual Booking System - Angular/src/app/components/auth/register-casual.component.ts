import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, retry } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { Zone } from '../../models/api.models';

@Component({
  selector: 'app-register-casual',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <div class="auth">

      <div class="card">

        <h1>Casual registration</h1>

        <p>
          Your account will require Super Admin approval.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <label>
            Email
            <input formControlName="email">
          </label>

          <label>
            Password
            <input
              type="password"
              formControlName="password">
          </label>

          <div class="two">

            <label>
              First name
              <input formControlName="firstName">
            </label>

            <label>
              Last name
              <input formControlName="lastName">
            </label>

          </div>

          <label>
            Employee ID
            <input formControlName="employeeId" placeholder="e.g. EMP-10025">
          </label>

          <label>
            Phone
            <input formControlName="phone">
          </label>

          <label>
            City
            <input formControlName="city">
          </label>

          <label>
            Home / current zone

            <select formControlName="zoneId">

              <option [ngValue]="0">
                Select zone
              </option>

              <option
                *ngFor="let z of zones"
                [ngValue]="z.id">
                {{ z.city }} · {{ z.name }}
              </option>

            </select>
            <small *ngIf="!form.controls.city.value">Enter City first to load matching zones.</small>
            <small *ngIf="form.controls.city.value && !loadingZones && !zones.length">No active zone found for this city.</small>
          </label>
          <button type="button" *ngIf="zoneError" (click)="loadZones()">Retry loading zones</button>
          <div class="error" *ngIf="zoneError">{{zoneError}}</div>

          <div
            class="success"
            *ngIf="done">
            Registration submitted.
          </div>

          <div
            class="error"
            *ngIf="error">
            {{ error }}
          </div>

          <button
            type="submit"
            [disabled]="
              submitting ||
              loadingZones ||
              form.invalid ||
              form.value.zoneId === 0
            ">
            {{ submitting ? 'Registering...' : 'Register' }}
          </button>

        </form>

        <a routerLink="/login">
          Back to login
        </a>

      </div>
    </div>
  `,
  styleUrl: './auth.scss'
})
export class RegisterCasualComponent implements OnInit {

  done = false;
  error = '';
  submitting = false;

  allZones: Zone[] = [];
  zones: Zone[] = [];
  loadingZones = false;
  zoneError = '';

  form = inject(FormBuilder).nonNullable.group({

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    password: [
      '',
      Validators.required
    ],

    firstName: [
      '',
      Validators.required
    ],

    lastName: [
      '',
      Validators.required
    ],

    employeeId: [
      '',
      Validators.required
    ],

    phone: [
      '',
      Validators.required
    ],

    city: [
      '',
      Validators.required
    ],

    zoneId: [
      0,
      Validators.min(1)
    ]
  });

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form.controls.city.valueChanges.subscribe(() => this.filterZonesByCity());
    this.loadZones();
  }

  loadZones(): void {
    this.loadingZones = true; this.zoneError = '';
    this.auth.lookupZones()
      .pipe(retry({ count: 2, delay: 400 }), finalize(() => { this.loadingZones = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: zones => { this.allZones = zones.filter(z => z.isActive); this.filterZonesByCity(); this.cdr.detectChanges(); },
        error: err => { console.error('Failed to load zones', err); this.zoneError = 'Unable to load zones. Please retry.'; this.cdr.detectChanges(); }
      });
  }

  private filterZonesByCity(): void {
    const city = this.form.controls.city.value.trim().toLowerCase();
    this.zones = city ? this.allZones.filter(z => z.city.trim().toLowerCase() === city) : [];
    const selected = this.form.controls.zoneId.value;
    if (selected && !this.zones.some(z => z.id === selected)) this.form.controls.zoneId.setValue(0, { emitEvent: false });
  }

  submit(): void {

    if (
      this.form.invalid ||
      this.form.getRawValue().zoneId === 0 ||
      this.submitting
    ) {
      return;
    }

    this.error = '';
    this.done = false;
    this.submitting = true;

    this.auth
      .registerCasual(
        this.form.getRawValue()
      )
      .pipe(
        finalize(() => {

          this.submitting = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {

          this.done = true;

          this.cdr.detectChanges();
        },

        error: e => {

          this.error =
            e?.error?.message ??
            e?.message ??
            'Registration failed.';

          this.cdr.detectChanges();
        }
      });
  }
}
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
  selector: 'app-register-store',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <div class="auth">
      <div class="card wide">

        <h1>Store registration</h1>

        <p>
          Your Store Manager account and Store will remain Pending
          until Super Admin approval.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <div class="two">

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

            <label>
              Manager Employee ID
              <input formControlName="managerEmployeeId" placeholder="e.g. EMP-20010">
            </label>

            <label>
              Manager first name
              <input formControlName="managerFirstName">
            </label>

            <label>
              Manager last name
              <input formControlName="managerLastName">
            </label>

            <label>
              Store ID
              <input formControlName="storeCode" placeholder="e.g. ST-0012">
            </label>

            <label>
              Store name
              <input formControlName="storeName">
            </label>

            <label>
              City
              <input formControlName="city">
            </label>

            <label>
              Zone

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

          </div>

          <label>
            Address
            <input formControlName="address">
          </label>

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
            {{ submitting ? 'Registering...' : 'Register store' }}
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
export class RegisterStoreComponent implements OnInit {

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

    managerEmployeeId: [
      '',
      Validators.required
    ],

    managerFirstName: [
      '',
      Validators.required
    ],

    managerLastName: [
      '',
      Validators.required
    ],

    storeCode: [
      '',
      Validators.required
    ],

    storeName: [
      '',
      Validators.required
    ],

    city: [
      '',
      Validators.required
    ],

    address: [''],

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
      .registerStore(
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
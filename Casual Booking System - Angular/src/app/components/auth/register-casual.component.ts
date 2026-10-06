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
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

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
                {{ z.name }}
              </option>

            </select>
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

  zones: {
    id: number;
    name: string;
    isActive?: boolean;
  }[] = [];

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

    this.auth.lookupZones()
      .subscribe({
        next: zones => {

          this.zones = zones;

          this.cdr.detectChanges();
        },

        error: err => {

          console.error(
            'Failed to load zones',
            err
          );

          this.error =
            'Unable to load zones.';

          this.cdr.detectChanges();
        }
      });
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
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AreaCasual,
  AreaCasualSearchFilters
} from '../../models/api.models';

import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Find Casuals</h1>

    <p class="lead">
      Search available Casuals from other zones in
      {{ filters.city || 'your city' }}
      and request them for a store in your managed zone.
    </p>

    <div class="panel">
      <div class="form-grid search-grid">

        <label>
          <span>City</span>
          <select [(ngModel)]="city" disabled>
            <option [value]="filters.city">
              {{ filters.city || 'Loading...' }}
            </option>
          </select>
        </label>

        <label>
          <span>Other zone</span>
          <select [(ngModel)]="zoneId">
            <option [ngValue]="null">All other zones</option>

            <option
              *ngFor="let zone of filters.zones"
              [ngValue]="zone.id">
              {{ zone.name }}
            </option>
          </select>
        </label>

        <label>
          <span>Employee ID / name / phone</span>
          <input
            [(ngModel)]="search"
            placeholder="Search Casual">
        </label>

        <label>
          <span>Shift start</span>
          <input
            type="datetime-local"
            [(ngModel)]="start">
        </label>

        <label>
          <span>Shift end</span>
          <input
            type="datetime-local"
            [(ngModel)]="end">
        </label>

        <label>
          <span>
            Store in {{ filters.managedZoneName || 'your zone' }}
          </span>

          <select [(ngModel)]="storeId">
            <option [ngValue]="null">Select store</option>

            <option
              *ngFor="let store of filters.stores"
              [ngValue]="store.storeId">
              {{ store.storeCode }} · {{ store.storeName }}
            </option>
          </select>
        </label>

        <label>
          <span>Required skill for booking</span>

          <select [(ngModel)]="requiredSkillId">
            <option [ngValue]="null">
              No single required skill
            </option>

            <option
              *ngFor="let skill of filters.skills"
              [ngValue]="skill.id">
              {{ skill.name }}
            </option>
          </select>
        </label>

      </div>

      <div
        class="skill-filter"
        *ngIf="filters.skills.length">

        <div class="filter-heading">
          <strong>Filter by skills</strong>
          <span>{{ selectedSkillIds.size }} selected</span>
        </div>

        <div class="skill-grid">
          <label
            class="skill-chip"
            *ngFor="let skill of filters.skills"
            [class.selected]="selectedSkillIds.has(skill.id)">

            <input
              type="checkbox"
              [checked]="selectedSkillIds.has(skill.id)"
              (change)="toggleSkill(
                skill.id,
                $any($event.target).checked
              )">

            <span>{{ skill.name }}</span>
          </label>
        </div>

      </div>

      <div class="search-actions">

        <span class="scope-note">
          Same-city rule: {{ filters.city }} only
        </span>

        <button
          type="button"
          (click)="run()"
          [disabled]="loading || !start || !end">

          {{ loading ? 'Searching...' : 'Search Casuals' }}

        </button>

      </div>
    </div>

    <div
      class="cards"
      *ngIf="rows.length">

      <div
        class="person casual-card"
        *ngFor="let casual of rows">

        <div class="person-main">

          <div class="title-row">

            <strong>{{ casual.name }}</strong>

            <span
              class="badge"
              [class.good]="casual.isAvailable">

              {{
                casual.isAvailable
                  ? 'Available'
                  : 'Unavailable'
              }}

            </span>

          </div>

          <span>
            Employee ID {{ casual.employeeId || '—' }}
            · {{ casual.city }}
            · {{ casual.phone }}
          </span>

          <span>
            Current zone:
            {{ casual.currentZoneName }}

            · Rating
            {{ casual.rating | number:'1.1-1' }}
          </span>

          <span *ngIf="casual.baseHourlyRate != null">

            Base rate
            {{
              casual.baseHourlyRate
                | currency:'AUD':'symbol':'1.2-2'
            }}/h

            · Shift rate
            {{
              casual.effectiveHourlyRate
                | currency:'AUD':'symbol':'1.2-2'
            }}/h

          </span>

          <span *ngIf="casual.baseHourlyRate != null">

            Paid hours
            {{ casual.paidHours | number:'1.1-2' }}

            · Estimated cost
            {{
              casual.estimatedCost
                | currency:'AUD':'symbol':'1.2-2'
            }}

          </span>

          <span
            class="muted"
            *ngIf="casual.baseHourlyRate == null">
            Pay rate not configured by Super Admin
          </span>

          <div class="skills-wrap">

            <span
              class="badge"
              *ngFor="let skill of casual.skills">
              {{ skill }}
            </span>

            <span
              class="muted"
              *ngIf="!casual.skills.length">
              No skills listed
            </span>

          </div>

          <div class="zone-note">
            Cross-zone request:
            {{ casual.currentZoneName }}
            →
            {{ filters.managedZoneName }}
          </div>

        </div>

        <div class="person-action">

          <button
            type="button"
            (click)="book(casual)"
            [disabled]="
              !casual.isAvailable ||
              casual.activeRequestExists ||
              bookingId === casual.casualProfileId ||
              !storeId
            ">

            {{
              bookingId === casual.casualProfileId
                ? 'Sending...'
                : (
                    casual.activeRequestExists
                      ? 'Booking Requested'
                      : 'Request booking'
                  )
            }}

          </button>

        </div>

      </div>
    </div>

    <div
      class="empty"
      *ngIf="
        searched &&
        !loading &&
        !rows.length
      ">
      No available Casuals matched those filters.
    </div>

    <div
      class="callout good"
      *ngIf="message">
      {{ message }}
    </div>

    <div
      class="callout error-box"
      *ngIf="error">
      {{ error }}
    </div>
  `,
  styleUrls: ['../page.scss'],
  styles: [`
    .search-grid label {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .search-grid label span {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }

    .skill-filter {
      margin-top: 18px;
    }

    .filter-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      color: #475569;
      font-size: 13px;
    }

    .skill-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .skill-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      background: #ffffff;
      cursor: pointer;
    }

    .skill-chip.selected {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .skill-chip input {
      width: 16px;
      height: 16px;
      margin: 0;
    }

    .search-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 18px;
      gap: 15px;
    }

    .scope-note,
    .muted {
      color: #64748b;
      font-size: 13px;
    }

    .casual-card {
      align-items: stretch;
    }

    .person-main {
      flex: 1;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }

    .skills-wrap {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    .zone-note {
      margin-top: 9px;
      font-size: 12px;
      color: #1d4ed8;
    }

    .person-action {
      display: flex;
      align-items: center;
    }

    @media (max-width: 1000px) {
      .skill-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 600px) {
      .skill-grid {
        grid-template-columns: 1fr;
      }

      .search-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .search-actions button {
        width: 100%;
      }
    }
  `]
})
export class AreaCasualsComponent implements OnInit {

  rows: AreaCasual[] = [];

  filters: AreaCasualSearchFilters = {
    city: '',
    managedZoneId: 0,
    managedZoneName: '',
    zones: [],
    stores: [],
    skills: []
  };

  city = '';

  zoneId: number | null = null;

  storeId: number | null = null;

  search = '';

  start = '';

  end = '';

  requiredSkillId: number | null = null;

  selectedSkillIds = new Set<number>();

  loading = false;

  searched = false;

  bookingId: number | null = null;

  message = '';

  error = '';

  constructor(
    private api: AreaManagerApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.api.casualFilters().subscribe({

      next: filters => {

        this.filters = filters;

        this.city = filters.city;

        this.cdr.detectChanges();
      },

      error: error => {

        this.error =
          error?.error?.message ??
          'Unable to load Area Manager search filters.';

        this.cdr.detectChanges();
      }

    });
  }

  toggleSkill(
    skillId: number,
    checked: boolean
  ): void {

    const selected =
      new Set(this.selectedSkillIds);

    if (checked) {
      selected.add(skillId);
    } else {
      selected.delete(skillId);
    }

    this.selectedSkillIds = selected;
  }

  run(): void {

    this.message = '';

    this.error = '';

    this.searched = true;

    if (!this.start || !this.end) {
      return;
    }

    this.loading = true;

    this.api
      .searchCasuals(
        this.city,
        this.search,
        this.start,
        this.end,
        this.zoneId,
        [...this.selectedSkillIds]
      )
      .pipe(
        finalize(() => {

          this.loading = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: rows => {

          this.rows = rows;

          this.cdr.detectChanges();
        },

        error: error => {

          this.error =
            error?.error?.message ??
            error.message;

          this.cdr.detectChanges();
        }

      });
  }

  book(casual: AreaCasual): void {

    if (!this.storeId) {
      return;
    }

    this.message = '';

    this.error = '';

    this.bookingId =
      casual.casualProfileId;

    this.api
      .createOverrideBooking({
        storeId: this.storeId,
        casualProfileId:
          casual.casualProfileId,
        startDateTime:
          this.start,
        endDateTime:
          this.end,
        requiredSkillId:
          this.requiredSkillId,
        overrideReason:
          `Cross-zone coverage approved by Area Manager: ${casual.currentZoneName} to ${this.filters.managedZoneName}`
      })
      .pipe(
        finalize(() => {

          this.bookingId = null;

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: () => {

          // Pending request should disable this button,
          // but should NOT make the Casual globally unavailable.
          casual.activeRequestExists = true;

          this.message =
            `Booking request sent to ${casual.name}.`;

          this.cdr.detectChanges();
        },

        error: error => {

          this.error =
            error?.error?.message ??
            error.message;

          this.cdr.detectChanges();
        }

      });
  }
}
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  Employee,
  employeeTypeLabel,
  RosterEntry,
  StaffingGap
} from '../../models/api.models';
import { StoreApiService } from '../../services/store-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Roster & Staffing Gaps</h1>

    <p class="lead">
      Paid staff are rostered manually. You can add the same shift across a selected
      date range in one action. Volunteer recurring schedules are generated only
      for the days/hours configured for that volunteer.
    </p>

    <!-- VIEW ROSTER -->
    <div class="panel form-grid">
      <label>
        View From
        <input type="date" [(ngModel)]="fromDate">
      </label>

      <label>
        View To
        <input type="date" [(ngModel)]="toDate">
      </label>

      <button
        type="button"
        (click)="refresh()"
        [disabled]="loadingRoster">

        {{ loadingRoster ? 'Loading...' : 'Load roster' }}

      </button>
    </div>

    <!-- ADD PAID STAFF RANGE -->
    <div class="panel">
      <h3>Add Paid Staff Across Multiple Days</h3>

      <p class="lead">
        Manager, Assistant Manager, FT and PT only.
        Example: 6–8 October, 9:00–17:00 creates three daily entries.
        An 8-hour scheduled shift counts as 7.5 paid hours after the
        unpaid 30-minute meal break. Sundays are skipped and the
        37.5 paid-hours weekly cap is enforced.
      </p>

      <div class="form-grid">

        <select [(ngModel)]="rangeEmployeeId">
          <option [ngValue]="0">Select paid worker</option>

          <option
            *ngFor="let e of paidStaff"
            [ngValue]="e.id">

            {{ e.firstName }} {{ e.lastName }}
            — {{ label(e.employeeType) }}

          </option>
        </select>

        <label>
          From
          <input type="date" [(ngModel)]="rangeFrom">
        </label>

        <label>
          To
          <input type="date" [(ngModel)]="rangeTo">
        </label>

        <label>
          Start
          <input type="time" [(ngModel)]="rangeStartTime">
        </label>

        <label>
          End
          <input type="time" [(ngModel)]="rangeEndTime">
        </label>

        <button
          type="button"
          (click)="addRosterRange()"
          [disabled]="savingRange">

          {{ savingRange ? 'Adding...' : 'Add date range' }}

        </button>

      </div>

      <div
        class="callout"
        *ngIf="rangeEmployeeId && rangeFrom && rangeTo">

        Preview:
        {{ rangeDayCount() }} rosterable day(s).

        Approx.
        {{ rangePaidHours() | number:'1.1-2' }}
        paid hour(s) in total before considering
        existing weekly roster hours.

      </div>
    </div>

    <!-- EDIT ROSTER ENTRY -->
    <div class="panel" *ngIf="editingId">

      <h3>Edit roster entry</h3>

      <p class="lead">
        A generated volunteer row becomes a manual override when edited.
      </p>

      <div class="form-grid">

        <input
          type="datetime-local"
          [(ngModel)]="editStart">

        <input
          type="datetime-local"
          [(ngModel)]="editEnd">

        <button
          type="button"
          (click)="saveEdit()"
          [disabled]="savingEdit">

          {{ savingEdit ? 'Saving...' : 'Save change' }}

        </button>

        <button
          type="button"
          class="secondary"
          (click)="cancelEdit()">

          Cancel

        </button>

      </div>

    </div>

    <!-- LEAVE / ABSENCE -->
    <div class="panel">

      <h3>Record leave / absence / weekly off</h3>

      <div class="form-grid">

        <select [(ngModel)]="absenceEmployeeId">

          <option [ngValue]="0">
            Worker
          </option>

          <option
            *ngFor="let e of staff"
            [ngValue]="e.id">

            {{ e.firstName }} {{ e.lastName }}

          </option>

        </select>

        <select [(ngModel)]="absenceType">

          <option [ngValue]="1">
            Leave
          </option>

          <option [ngValue]="2">
            Sick
          </option>

          <option [ngValue]="3">
            Weekly Off
          </option>

          <option [ngValue]="4">
            Unavailable
          </option>

        </select>

        <input
          type="datetime-local"
          [(ngModel)]="absenceStart">

        <input
          type="datetime-local"
          [(ngModel)]="absenceEnd">

        <input
          [(ngModel)]="reason"
          placeholder="Reason">

        <button
          type="button"
          (click)="addAbsence()"
          [disabled]="savingAbsence">

          {{
            savingAbsence
              ? 'Saving...'
              : 'Record absence'
          }}

        </button>

      </div>

    </div>

    <!-- MESSAGES -->
    <div
      class="callout error-box"
      *ngIf="error">

      {{ error }}

    </div>

    <div
      class="callout good"
      *ngIf="message">

      {{ message }}

    </div>

    <!-- STAFFING GAPS -->
    <div
      class="callout warn"
      *ngFor="let g of gaps">

      <strong>
        Staffing gap:
      </strong>

      {{ g.employeeName }}
      ({{ label(g.employeeType) }}),

      {{ g.startDateTime | date:'short' }}
      —
      {{ g.endDateTime | date:'short' }}.

      {{ g.reason }}

    </div>

    <!-- ROSTER TABLE -->
    <div class="panel">

      <table>

        <thead>

          <tr>
            <th>Worker</th>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Source</th>
            <th>Cost snapshot</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          <tr *ngFor="let r of roster">

            <td>
              {{ r.employeeName }}
            </td>

            <td>
              {{ label(r.employeeType) }}
            </td>

            <td>
              {{ r.startDateTime | date:'short' }}
            </td>

            <td>
              {{ r.endDateTime | date:'short' }}
            </td>

            <td>
              {{
                r.isGeneratedFromPattern
                  ? 'Volunteer weekly schedule'
                  : 'Manual'
              }}
            </td>

            <td>
              {{
                r.employeeType === 4
                  ? 'Unpaid'
                  : (r.estimatedCost | currency:'AUD')
              }}
            </td>

            <td>

              <button
                type="button"
                class="secondary"
                (click)="edit(r)">

                Edit

              </button>

            </td>

          </tr>

        </tbody>

      </table>

      <div
        class="empty"
        *ngIf="!roster.length">

        No roster entries in this range.

      </div>

    </div>
  `,
  styleUrls: ['../page.scss']
})
export class RosterComponent implements OnInit {

  staff: Employee[] = [];
  roster: RosterEntry[] = [];
  gaps: StaffingGap[] = [];

  rangeEmployeeId = 0;

  rangeFrom = '';
  rangeTo = '';

  rangeStartTime = '09:00';
  rangeEndTime = '17:00';

  absenceEmployeeId = 0;
  absenceType = 1;

  absenceStart = '';
  absenceEnd = '';

  reason = '';

  error = '';
  message = '';

  savingRange = false;
  savingAbsence = false;
  savingEdit = false;
  loadingRoster = false;

  editingId = 0;

  editStart = '';
  editEnd = '';

  label = employeeTypeLabel;

  fromDate = this.isoDate(
    this.startOfWeek(new Date())
  );

  toDate = this.isoDate(
    this.addDays(
      this.startOfWeek(new Date()),
      6
    )
  );

  constructor(
    private api: StoreApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.refresh();
  }

  get paidStaff() {

    return this.staff.filter(
      x =>
        x.isActive &&
        x.employeeType !== 4 &&
        x.employeeType !== 1
    );

  }

  startOfWeek(d: Date) {

    const x = new Date(d);

    const diff =
      (x.getDay() + 6) % 7;

    x.setDate(
      x.getDate() - diff
    );

    x.setHours(
      0,
      0,
      0,
      0
    );

    return x;

  }

  addDays(
    d: Date,
    n: number
  ) {

    const x = new Date(d);

    x.setDate(
      x.getDate() + n
    );

    return x;

  }

  isoDate(d: Date) {

    return d
      .toISOString()
      .slice(0, 10);

  }

  toLocalInput(value: string) {

    const d =
      new Date(value);

    const p =
      (n: number) =>
        String(n)
          .padStart(2, '0');

    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;

  }

  range() {

    const to =
      new Date(
        `${this.toDate}T00:00:00`
      );

    to.setDate(
      to.getDate() + 1
    );

    const p =
      (n: number) =>
        String(n)
          .padStart(2, '0');

    const toExclusive =
      `${to.getFullYear()}-${p(to.getMonth() + 1)}-${p(to.getDate())}T00:00:00`;

    return {
      from:
        `${this.fromDate}T00:00:00`,

      to:
        toExclusive
    };

  }

  refresh() {

    if (this.loadingRoster)
      return;

    this.loadingRoster = true;

    this.error = '';

    const r =
      this.range();

    forkJoin({

      staff:
        this.api
          .employees()
          .pipe(

            catchError(e => {

              this.error =
                this.appendError(
                  this.error,
                  e?.error?.message ??
                  'Unable to load staff.'
                );

              return of(
                [] as Employee[]
              );

            })

          ),

      roster:
        this.api
          .roster(
            r.from,
            r.to
          )
          .pipe(

            catchError(e => {

              this.error =
                this.appendError(
                  this.error,
                  e?.error?.message ??
                  'Unable to load roster.'
                );

              return of(
                [] as RosterEntry[]
              );

            })

          ),

      gaps:
        this.api
          .gaps(
            r.from,
            r.to
          )
          .pipe(

            catchError(e => {

              this.error =
                this.appendError(
                  this.error,
                  e?.error?.message ??
                  'Unable to load staffing gaps.'
                );

              return of(
                [] as StaffingGap[]
              );

            })

          )

    })
    .pipe(

      finalize(() => {

        this.loadingRoster =
          false;

        this.cdr.detectChanges();

      })

    )
    .subscribe(x => {

      this.staff =
        x.staff;

      this.roster =
        x.roster;

      this.gaps =
        x.gaps;

      this.cdr.detectChanges();

    });

  }

  private appendError(
    current: string,
    next: string
  ) {

    return current
      ? `${current} ${next}`
      : next;

  }

  private timeHours() {

    if (
      !this.rangeStartTime ||
      !this.rangeEndTime
    ) {
      return 0;
    }

    const [sh, sm] =
      this.rangeStartTime
        .split(':')
        .map(Number);

    const [eh, em] =
      this.rangeEndTime
        .split(':')
        .map(Number);

    const h =
      (
        eh * 60 +
        em -
        sh * 60 -
        sm
      ) / 60;

    return h > 0
      ? h
      : 0;

  }

  rangeDayCount() {

    if (
      !this.rangeFrom ||
      !this.rangeTo
    ) {
      return 0;
    }

    const from =
      new Date(
        `${this.rangeFrom}T00:00:00`
      );

    const to =
      new Date(
        `${this.rangeTo}T00:00:00`
      );

    if (to < from)
      return 0;

    let count = 0;

    for (
      let d =
        new Date(from);

      d <= to;

      d.setDate(
        d.getDate() + 1
      )
    ) {

      // Sunday excluded
      if (
        d.getDay() !== 0
      ) {
        count++;
      }

    }

    return count;

  }

  rangePaidHours() {

    const scheduled =
      this.timeHours();

    const paid =
      scheduled > 5
        ? scheduled - 0.5
        : scheduled;

    return Math.max(
      0,
      paid
    ) *
      this.rangeDayCount();

  }

  addRosterRange() {

    if (
      !this.rangeEmployeeId ||
      !this.rangeFrom ||
      !this.rangeTo ||
      !this.rangeStartTime ||
      !this.rangeEndTime ||
      this.savingRange
    ) {
      return;
    }

    this.error = '';
    this.message = '';

    this.savingRange = true;

    this.api
      .createRosterRange({

        employeeId:
          this.rangeEmployeeId,

        fromDate:
          this.rangeFrom,

        toDate:
          this.rangeTo,

        startTime:
          this.rangeStartTime,

        endTime:
          this.rangeEndTime

      })
      .pipe(

        finalize(() => {

          this.savingRange =
            false;

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: rows => {

          this.message =
            `${rows.length} roster entr${rows.length === 1 ? 'y' : 'ies'} added.`;

          this.refresh();

        },

        error: e => {

          this.error =
            e?.error?.message ??
            e.message;

          this.cdr.detectChanges();

        }

      });

  }

  edit(r: RosterEntry) {

    this.editingId =
      r.id;

    this.editStart =
      this.toLocalInput(
        r.startDateTime
      );

    this.editEnd =
      this.toLocalInput(
        r.endDateTime
      );

    this.error = '';
    this.message = '';

    this.cdr.detectChanges();

  }

  cancelEdit() {

    this.editingId = 0;

    this.editStart = '';
    this.editEnd = '';

  }

  saveEdit() {

    if (
      !this.editingId ||
      !this.editStart ||
      !this.editEnd ||
      this.savingEdit
    ) {
      return;
    }

    this.savingEdit = true;

    this.error = '';
    this.message = '';

    this.api
      .updateRoster(
        this.editingId,
        {
          startDateTime:
            this.editStart,

          endDateTime:
            this.editEnd
        }
      )
      .pipe(

        finalize(() => {

          this.savingEdit =
            false;

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: () => {

          this.cancelEdit();

          this.message =
            'Roster entry updated.';

          this.refresh();

        },

        error: e => {

          this.error =
            e?.error?.message ??
            e.message;

          this.cdr.detectChanges();

        }

      });

  }

  addAbsence() {

    if (
      !this.absenceEmployeeId ||
      !this.absenceStart ||
      !this.absenceEnd ||
      this.savingAbsence
    ) {
      return;
    }

    this.error = '';
    this.message = '';

    this.savingAbsence = true;

    this.api
      .recordAbsence({

        employeeId:
          this.absenceEmployeeId,

        absenceType:
          this.absenceType,

        startDateTime:
          this.absenceStart,

        endDateTime:
          this.absenceEnd,

        reason:
          this.reason

      })
      .pipe(

        finalize(() => {

          this.savingAbsence =
            false;

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: () => {

          this.message =
            'Absence / weekly off recorded.';

          this.refresh();

        },

        error: e => {

          this.error =
            e?.error?.message ??
            e.message;

          this.cdr.detectChanges();

        }

      });

  }

}
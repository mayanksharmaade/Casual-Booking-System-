import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  catchError,
  finalize,
  forkJoin,
  of
} from 'rxjs';

import {
  absenceTypeLabel,
  Booking,
  bookingStatusLabel,
  employeeTypeLabel,
  StaffingGap,
  StoreDashboard
} from '../../models/api.models';

import {
  StoreApiService
} from '../../services/store-api.service';

import {
  KpiComponent
} from '../../shared/ui/kpi.component';

@Component({
  standalone: true,

  imports: [
    CommonModule,
    KpiComponent
  ],

  template: `
    <h1>Store Dashboard</h1>

    <p class="lead">
      Daily staffing, Casual bookings and labour-budget position.
    </p>

    <!-- PUBLIC HOLIDAY -->
    <div
      class="holiday"
      *ngIf="d?.isPublicHoliday">

      Public holiday:
      {{ d?.publicHolidayName }}

    </div>

    <!-- MAIN KPI CARDS -->
    <div
      class="grid"
      *ngIf="d">

      <app-kpi
        label="Rostered Today"
        [value]="d.todayRostered"
        hint="Includes accepted Casuals"/>

      <app-kpi
        label="Staffing Gaps"
        [value]="d.staffingGaps"
        hint="Today's roster coverage gaps"/>

      <app-kpi
        label="Pending Casual Requests"
        [value]="d.pendingBookings"/>

      <app-kpi
        label="Upcoming Accepted"
        [value]="d.acceptedUpcoming"/>

      <app-kpi
        label="Daily Budget"
        [value]="
          (d.dailyBudget
            | currency:'AUD':'symbol':'1.0-0'
          ) || ''
        "/>

      <app-kpi
        label="Scheduled Labour"
        [value]="
          (d.scheduledLabourCost
            | currency:'AUD':'symbol':'1.0-0'
          ) || ''
        "/>

      <app-kpi
        label="Budget Status"
        [value]="d.budgetStatus"
        [hint]="
          'Variance ' +
          (
            d.budgetVariance
              | currency:'AUD':'symbol':'1.0-0'
          )
        "/>

      <app-kpi
        label="30-day Cancellations"
        [value]="d.cancellationsLast30Days"/>

    </div>

    <!-- TODAY'S WORKFORCE BREAKDOWN -->
    <div
      class="panel"
      *ngIf="d">

      <div class="section-head">

        <div>
          <h3>Today's Workforce</h3>

          <p>
            People actually scheduled to work today,
            including accepted Casual bookings.
          </p>
        </div>

        <span class="badge good">
          {{ d.todayRostered }} total
        </span>

      </div>

      <div class="workforce-grid">

        <div class="workforce-item">
          <span>Store Manager</span>

          <strong>
            {{ d.storeManagersToday }}
          </strong>
        </div>

        <div class="workforce-item">
          <span>Assistant Manager</span>

          <strong>
            {{ d.assistantManagersToday }}
          </strong>
        </div>

        <div class="workforce-item">
          <span>Full-Time</span>

          <strong>
            {{ d.fullTimeToday }}
          </strong>
        </div>

        <div class="workforce-item">
          <span>Part-Time</span>

          <strong>
            {{ d.partTimeToday }}
          </strong>
        </div>

        <div class="workforce-item">
          <span>Volunteers</span>

          <strong>
            {{ d.volunteersToday }}
          </strong>
        </div>

        <div class="workforce-item">
          <span>Casuals</span>

          <strong>
            {{ d.casualsToday }}
          </strong>
        </div>

      </div>

    </div>

    <!-- STAFFING GAP ALERT -->
    <div
      class="callout warn"
      *ngIf="gaps.length">

      {{ gaps.length }}
      staffing coverage gap(s)
      detected today.

      Review them below.

    </div>

    <!-- CASUAL BOOKINGS -->
    <div
      class="dashboard-columns"
      *ngIf="!loading">

      <!-- CONFIRMED CASUAL SHIFTS -->
      <div class="panel">

        <div class="section-head">

          <div>

            <h3>
              Confirmed Casual Shifts
            </h3>

            <p>
              Accepted future bookings.
            </p>

          </div>

          <span class="badge good">
            {{ confirmed.length }}
          </span>

        </div>

        <table
          *ngIf="confirmed.length">

          <thead>

            <tr>
              <th>Casual</th>
              <th>Date</th>
              <th>Time</th>
              <th>Skill</th>
              <th>Cost</th>
            </tr>

          </thead>

          <tbody>

            <tr
              *ngFor="let b of confirmed">

              <td>
                <b>
                  {{ b.casualName }}
                </b>
              </td>

              <td>
                {{
                  b.startDateTime
                    | date:'EEE, d MMM'
                }}
              </td>

              <td>
                {{
                  b.startDateTime
                    | date:'shortTime'
                }}
                –
                {{
                  b.endDateTime
                    | date:'shortTime'
                }}
              </td>

              <td>
                {{
                  b.requiredSkillName
                    || '—'
                }}
              </td>

              <td>
                {{
                  b.estimatedCost
                    | currency:'AUD':'symbol':'1.2-2'
                }}
              </td>

            </tr>

          </tbody>

        </table>

        <div
          class="empty"
          *ngIf="!confirmed.length">

          No accepted upcoming Casual shifts.

        </div>

      </div>

      <!-- PENDING CASUAL REQUESTS -->
      <div class="panel">

        <div class="section-head">

          <div>

            <h3>
              Pending Casual Requests
            </h3>

            <p>
              Waiting for Casual response.
            </p>

          </div>

          <span class="badge">
            {{ pending.length }}
          </span>

        </div>

        <table
          *ngIf="pending.length">

          <thead>

            <tr>
              <th>Casual</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            <tr
              *ngFor="let b of pending">

              <td>
                <b>
                  {{ b.casualName }}
                </b>
              </td>

              <td>
                {{
                  b.startDateTime
                    | date:'EEE, d MMM'
                }}
              </td>

              <td>
                {{
                  b.startDateTime
                    | date:'shortTime'
                }}
                –
                {{
                  b.endDateTime
                    | date:'shortTime'
                }}
              </td>

              <td>

                <span class="badge">
                  {{ bookingLabel(b.status) }}
                </span>

              </td>

            </tr>

          </tbody>

        </table>

        <div
          class="empty"
          *ngIf="!pending.length">

          No pending Casual requests.

        </div>

      </div>

    </div>

    <!-- TODAY'S STAFFING GAPS -->
    <div
      class="panel"
      *ngIf="!loading">

      <div class="section-head">

        <div>

          <h3>
            Today's Staffing Gaps
          </h3>

          <p>
            Rostered shifts affected by
            leave, sickness, weekly off
            or unavailability.
          </p>

        </div>

        <span
          class="badge"
          *ngIf="gaps.length">

          {{ gaps.length }}

        </span>

      </div>

      <table
        *ngIf="gaps.length">

        <thead>

          <tr>
            <th>Employee</th>
            <th>Shift</th>
            <th>Reason</th>
          </tr>

        </thead>

        <tbody>

          <tr
            *ngFor="let g of gaps">

            <td>
              <b>
                {{ g.employeeName }}
              </b>
            </td>

            <td>
              {{
                g.startDateTime
                  | date:'shortTime'
              }}
              –
              {{
                g.endDateTime
                  | date:'shortTime'
              }}
            </td>

            <td>
              {{ g.reason }}
            </td>

          </tr>

        </tbody>

      </table>

      <div
        class="empty"
        *ngIf="!gaps.length">

        No staffing gaps for today.

      </div>

    </div>

    <!-- NEXT 14 DAYS ABSENCE / LEAVE -->
    <div
      class="panel"
      *ngIf="d">

      <div class="section-head">

        <div>

          <h3>
            Upcoming Leave / Absence
          </h3>

          <p>
            {{
              d.absenceRangeFrom
                | date:'d MMM'
            }}
            –
            {{
              d.absenceRangeTo
                | date:'d MMM yyyy'
            }}
          </p>

        </div>

        <span class="badge">
          {{ d.absences.length }}
        </span>

      </div>

      <table
        *ngIf="d.absences.length">

        <thead>

          <tr>
            <th>Employee</th>
            <th>Employee Type</th>
            <th>Absence Type</th>
            <th>From</th>
            <th>To</th>
            <th>Reason</th>
          </tr>

        </thead>

        <tbody>

          <tr
            *ngFor="let a of d.absences">

            <td>
              <b>
                {{ a.employeeName }}
              </b>
            </td>

            <td>
              {{
                employeeLabel(
                  a.employeeType
                )
              }}
            </td>

            <td>

              <span class="badge">
                {{
                  absenceLabel(
                    a.absenceType
                  )
                }}
              </span>

            </td>

            <td>
              {{
                a.startDateTime
                  | date:'EEE, d MMM, shortTime'
              }}
            </td>

            <td>
              {{
                a.endDateTime
                  | date:'EEE, d MMM, shortTime'
              }}
            </td>

            <td>
              {{ a.reason || '—' }}
            </td>

          </tr>

        </tbody>

      </table>

      <div
        class="empty"
        *ngIf="!d.absences.length">

        No recorded leave, sickness,
        weekly off or unavailability
        in the next 14 days.

      </div>

    </div>

    <!-- TODAY'S LABOUR DETAILS -->
    <div
      class="panel"
      *ngIf="d">

      <div class="section-head">

        <div>

          <h3>
            Today's Labour Detail
          </h3>

          <p>
            Effective roster and accepted
            Casual labour used in today's
            budget calculation.
          </p>

        </div>

        <span class="badge good">
          {{
            d.scheduledLabourCost
              | currency:'AUD':'symbol':'1.0-0'
          }}
        </span>

      </div>

      <table
        *ngIf="d.labourItems.length">

        <thead>

          <tr>
            <th>Worker</th>
            <th>Type</th>
            <th>Scheduled</th>
            <th>Break</th>
            <th>Paid</th>
            <th>Base Rate</th>
            <th>Effective Rate</th>
            <th>Cost</th>
          </tr>

        </thead>

        <tbody>

          <tr
            *ngFor="let item of d.labourItems">

            <td>
              <b>
                {{ item.workerName }}
              </b>
            </td>

            <td>
              {{ item.workerType }}
            </td>

            <td>
              {{
                item.scheduledHours
                  | number:'1.1-2'
              }}
              h
            </td>

            <td>
              {{
                item.unpaidBreakHours
                  | number:'1.1-2'
              }}
              h
            </td>

            <td>
              {{
                item.paidHours
                  | number:'1.1-2'
              }}
              h
            </td>

            <td>
              {{
                item.baseHourlyRate
                  | currency:'AUD':'symbol':'1.2-2'
              }}
            </td>

            <td>
              {{
                item.effectiveHourlyRate
                  | currency:'AUD':'symbol':'1.2-2'
              }}
            </td>

            <td>
              {{
                item.cost
                  | currency:'AUD':'symbol':'1.2-2'
              }}
            </td>

          </tr>

        </tbody>

      </table>

      <div
        class="empty"
        *ngIf="!d.labourItems.length">

        No labour entries scheduled today.

      </div>

    </div>

    <!-- QUICK ACTIONS -->
    <div class="panel quick-actions">

      <h3>
        Quick Actions
      </h3>

      <p>
        Use the left navigation to open
        Find Casuals, Bookings,
        Roster & Gaps, Staff,
        Budget or Reports.
      </p>

    </div>

    <!-- ERROR -->
    <div
      class="callout error-box"
      *ngIf="error">

      {{ error }}

    </div>
  `,

  styleUrls: [
    '../page.scss'
  ],

  styles: [`
    .dashboard-columns {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 14px;
    }

    .section-head h3,
    .quick-actions h3 {
      margin: 0 0 4px;
    }

    .section-head p,
    .quick-actions p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .workforce-grid {
      display: grid;
      grid-template-columns:
        repeat(6, minmax(0, 1fr));
      gap: 12px;
    }

    .workforce-item {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .workforce-item span {
      color: #64748b;
      font-size: 13px;
    }

    .workforce-item strong {
      font-size: 24px;
      color: #0f172a;
    }

    @media(max-width:1200px) {
      .workforce-grid {
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
      }
    }

    @media(max-width:1050px) {
      .dashboard-columns {
        grid-template-columns: 1fr;
      }
    }

    @media(max-width:650px) {
      .workforce-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }
    }
  `]
})
export class StoreDashboardComponent
  implements OnInit {

  d?: StoreDashboard;

  confirmed: Booking[] = [];

  pending: Booking[] = [];

  gaps: StaffingGap[] = [];

  loading = false;

  error = '';

  bookingLabel =
    bookingStatusLabel;

  employeeLabel =
    employeeTypeLabel;

  absenceLabel =
    absenceTypeLabel;

  constructor(
    private api: StoreApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {

    this.loading = true;

    this.error = '';

    const today =
      new Date();

    const yyyy =
      today.getFullYear();

    const mm =
      String(
        today.getMonth() + 1
      ).padStart(2, '0');

    const dd =
      String(
        today.getDate()
      ).padStart(2, '0');

    const date =
      `${yyyy}-${mm}-${dd}`;

    /*
     * Local date/time strings are used here
     * so the Store API gets the intended
     * local calendar day.
     */
    const from =
      `${date}T00:00:00`;

    const tomorrow =
      new Date(
        yyyy,
        today.getMonth(),
        today.getDate() + 1
      );

    const tmm =
      String(
        tomorrow.getMonth() + 1
      ).padStart(2, '0');

    const tdd =
      String(
        tomorrow.getDate()
      ).padStart(2, '0');

    const to =
      `${tomorrow.getFullYear()}-${tmm}-${tdd}T00:00:00`;

    forkJoin({

      dashboard:
        this.api
          .dashboard(date)
          .pipe(

            catchError(e => {

              this.error =
                this.appendError(
                  this.error,

                  e?.error?.message ??
                  'Unable to load dashboard summary.'
                );

              return of(
                undefined
              );

            })

          ),

      bookings:
        this.api
          .bookings()
          .pipe(

            catchError(e => {

              this.error =
                this.appendError(
                  this.error,

                  e?.error?.message ??
                  'Unable to load bookings.'
                );

              return of(
                [] as Booking[]
              );

            })

          ),

      gaps:
        this.api
          .gaps(
            from,
            to
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

        this.loading =
          false;

        this.cdr.detectChanges();

      })

    )
    .subscribe(
      ({
        dashboard,
        bookings,
        gaps
      }) => {

        const now =
          Date.now();

        this.d =
          dashboard;

        this.confirmed =
          bookings
            .filter(
              x =>
                x.status === 2 &&
                new Date(
                  x.endDateTime
                ).getTime() >= now
            )
            .sort(
              this.byStartAsc
            )
            .slice(
              0,
              8
            );

        this.pending =
          bookings
            .filter(
              x =>
                x.status === 1
            )
            .sort(
              this.byStartAsc
            )
            .slice(
              0,
              8
            );

        this.gaps =
          [...gaps]
            .sort(
              (a, b) =>
                new Date(
                  a.startDateTime
                ).getTime()
                -
                new Date(
                  b.startDateTime
                ).getTime()
            );

        this.cdr.detectChanges();

      }
    );

  }

  private appendError(
    current: string,
    next: string
  ) {

    return current
      ? `${current} ${next}`
      : next;

  }

  private byStartAsc =
    (
      a: Booking,
      b: Booking
    ) =>
      new Date(
        a.startDateTime
      ).getTime()
      -
      new Date(
        b.startDateTime
      ).getTime();

}
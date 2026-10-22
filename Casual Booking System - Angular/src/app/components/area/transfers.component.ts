import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  AreaCasualSearchFilters,
  AreaTransferCandidate,
  CasualTransfer
} from '../../models/api.models';

import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Casual Zone Transfers</h1>

    <p class="lead">
      Transfer a Casual from your managed zone to another active zone
      in the same city.
    </p>

    <div
      class="scope"
      *ngIf="filters.managedZoneId > 0">

      <strong>
        {{ filters.city }} · {{ filters.managedZoneName }}
      </strong>

      <span>
        Only same-city destination zones are allowed.
      </span>

    </div>

    <div class="panel">

      <div
        class="loading"
        *ngIf="loading">

        Loading Casuals in
        {{ filters.managedZoneName || 'your zone' }}...

      </div>

      <div
        class="table-wrap"
        *ngIf="!loading && candidates.length">

        <table>

          <thead>
            <tr>
              <th>Casual</th>
              <th>Employee ID</th>
              <th>Skills</th>
              <th>Current zone</th>
              <th>Destination zone</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            <tr *ngFor="let casual of candidates">

              <td>
                <strong>{{ casual.name }}</strong>

                <br>

                <small>
                  Rating
                  {{ casual.rating | number:'1.1-1' }}
                </small>
              </td>

              <td>
                {{ casual.employeeId || '—' }}
              </td>

              <td>
                {{
                  casual.skills.length
                    ? casual.skills.join(', ')
                    : 'No skills'
                }}
              </td>

              <td>
                <strong>
                  {{ casual.currentZoneName }}
                </strong>
              </td>

              <td>

                <select
                  [(ngModel)]="
                    destination[casual.casualProfileId]
                  ">

                  <option [ngValue]="0">
                    Select zone
                  </option>

                  <option
                    *ngFor="let zone of filters.zones"
                    [ngValue]="zone.id">

                    {{ zone.name }}

                  </option>

                </select>

              </td>

              <td>

                <input
                  [(ngModel)]="
                    reasons[casual.casualProfileId]
                  "
                  placeholder="Transfer reason">

              </td>

              <td>

                <button
                  type="button"
                  (click)="transfer(casual)"
                  [disabled]="
                    transferringId === casual.casualProfileId ||
                    !destination[casual.casualProfileId] ||
                    !reasons[casual.casualProfileId]?.trim()
                  ">

                  {{
                    transferringId === casual.casualProfileId
                      ? 'Transferring...'
                      : 'Transfer'
                  }}

                </button>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <div
        class="empty"
        *ngIf="
          !loading &&
          loaded &&
          !candidates.length &&
          !error
        ">

        No Casuals are currently registered in
        {{ filters.managedZoneName || 'your zone' }}.

      </div>

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

    <div class="panel">

      <h2>Recent Transfers</h2>

      <div
        class="table-wrap"
        *ngIf="rows.length">

        <table>

          <thead>
            <tr>
              <th>When</th>
              <th>Casual</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
            </tr>
          </thead>

          <tbody>

            <tr *ngFor="let transfer of rows">

              <td>
                {{
                  transfer.transferredAtUtc
                    | date:'short'
                }}
              </td>

              <td>
                {{ transfer.casualName }}
              </td>

              <td>
                {{
                  transfer.fromZoneName ||
                  'Unassigned'
                }}
              </td>

              <td>
                {{ transfer.toZoneName }}
              </td>

              <td>
                {{ transfer.reason }}
              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <div
        class="empty"
        *ngIf="loaded && !rows.length">

        No transfers have been recorded yet.

      </div>

    </div>
  `,
  styleUrls: ['../page.scss'],
  styles: [`
    .scope {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      padding: 14px 18px;

      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;

      margin-bottom: 16px;
    }

    .scope span {
      color: #64748b;
      font-size: 13px;
    }

    .table-wrap {
      overflow: auto;
    }

    td input,
    td select {
      min-width: 150px;
    }

    .loading {
      padding: 18px 4px;
      color: #64748b;
    }

    @media (max-width: 700px) {
      .scope {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `]
})
export class AreaTransfersComponent implements OnInit {

  rows: CasualTransfer[] = [];

  candidates: AreaTransferCandidate[] = [];

  filters: AreaCasualSearchFilters = {
    city: '',
    managedZoneId: 0,
    managedZoneName: '',
    zones: [],
    stores: [],
    skills: []
  };

  destination: Record<number, number> = {};

  reasons: Record<number, string> = {};

  loading = false;

  loaded = false;

  transferringId: number | null = null;

  message = '';

  error = '';

  constructor(
    private api: AreaManagerApiService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading = true;

    this.error = '';

    forkJoin({
      filters:
        this.api.casualFilters(),

      candidates:
        this.api.transferCandidates(),

      transfers:
        this.api.transfers()
    })
    .subscribe({

      next: result => {

        this.filters =
          result.filters;

        this.candidates =
          result.candidates;

        this.rows =
          result.transfers;

        this.loading = false;

        this.loaded = true;
      },

      error: error => {

        this.error =
          error?.error?.message ??
          'Unable to load transfer data.';

        this.loading = false;

        this.loaded = true;
      }

    });
  }

  transfer(
    casual: AreaTransferCandidate
  ): void {

    const toZoneId =
      this.destination[
        casual.casualProfileId
      ];

    const reason =
      this.reasons[
        casual.casualProfileId
      ]?.trim();

    if (!toZoneId || !reason) {
      return;
    }

    this.message = '';

    this.error = '';

    this.transferringId =
      casual.casualProfileId;

    this.api
      .transferCasual({
        casualProfileId:
          casual.casualProfileId,

        toZoneId,

        reason
      })
      .subscribe({

        next: transfer => {

          this.message =
            `${transfer.casualName} transferred to ${transfer.toZoneName}.`;

          delete this.destination[
            casual.casualProfileId
          ];

          delete this.reasons[
            casual.casualProfileId
          ];

          // Casual has moved out of this Area Manager's zone,
          // so remove immediately from the candidate list.
          this.candidates =
            this.candidates.filter(
              x =>
                x.casualProfileId !==
                casual.casualProfileId
            );

          this.rows = [
            transfer,
            ...this.rows.filter(
              x => x.id !== transfer.id
            )
          ];

          this.transferringId = null;
        },

        error: error => {

          this.error =
            error?.error?.message ??
            error.message;

          this.transferringId = null;
        }

      });
  }
}
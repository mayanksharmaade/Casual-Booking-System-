import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { CasualApiService } from '../../services/casual-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>My Profile</h1>
    <p class="lead">Maintain searchable profile details and skills.</p>

    <div class="zone-chip" *ngIf="loaded">
      Current zone: {{ zoneName }}
    </div>

    <div class="panel profile-card" *ngIf="loaded">
      <div class="profile-grid">
        <label>
          <span>First name</span>
          <input [(ngModel)]="firstName" placeholder="First name">
        </label>

        <label>
          <span>Last name</span>
          <input [(ngModel)]="lastName" placeholder="Last name">
        </label>

        <label>
          <span>Phone</span>
          <input [(ngModel)]="phone" placeholder="Phone">
        </label>

        <label>
          <span>City</span>
          <input [(ngModel)]="city" placeholder="City">
        </label>

        <label>
          <span>Photo URL</span>
          <input [(ngModel)]="photoUrl" placeholder="Photo URL (optional)">
        </label>

        <div class="profile-action">
          <button
            type="button"
            (click)="save()"
            [disabled]="savingProfile">
            {{ savingProfile ? 'Saving...' : 'Save profile' }}
          </button>
        </div>
      </div>
    </div>

    <div class="panel skills-card" *ngIf="loaded">
      <div class="section-header">
        <div>
          <h3>Skills</h3>
          <p>Select all skills that apply to you.</p>
        </div>

        <div class="selected-count">
          {{ selected.size }} selected
        </div>
      </div>

      <div class="skills-grid" *ngIf="skills.length">
        <label
          class="skill-option"
          *ngFor="let s of skills"
          [class.selected]="selected.has(s.id)">

          <input
            type="checkbox"
            [checked]="selected.has(s.id)"
            (change)="toggle(s.id, $any($event.target).checked)">

          <span class="skill-name">
            {{ s.name }}
          </span>
        </label>
      </div>

      <div class="empty" *ngIf="!skills.length">
        No active skills configured.
      </div>

      <div class="skills-footer">
        <button
          type="button"
          (click)="saveSkills()"
          [disabled]="savingSkills">

          {{ savingSkills ? 'Saving...' : 'Save skills' }}
        </button>
      </div>
    </div>

    <div class="empty" *ngIf="loading">
      Loading profile...
    </div>

    <div class="error" *ngIf="error">
      {{ error }}
    </div>

    <div class="callout good" *ngIf="message">
      {{ message }}
    </div>
  `,
  styleUrls: ['../page.scss'],
  styles: [`
    .profile-card {
      margin-top: 18px;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
      gap: 14px;
      align-items: end;
    }

    .profile-grid label {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .profile-grid label span {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }

    .profile-grid input {
      width: 100%;
    }

    .profile-action {
      display: flex;
      align-items: flex-end;
    }

    .profile-action button {
      min-width: 150px;
    }

    .skills-card {
      margin-top: 22px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 20px;
    }

    .section-header h3 {
      margin: 0 0 4px;
    }

    .section-header p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .selected-count {
      background: #eff6ff;
      color: #2563eb;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .skill-option {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 52px;
      padding: 12px 14px;
      border: 1px solid #dbe3ee;
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease,
        background 0.15s ease;
    }

    .skill-option:hover {
      border-color: #93b4ff;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.08);
    }

    .skill-option.selected {
      border-color: #2563eb;
      background: #eff6ff;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.06);
    }

    .skill-option input {
      width: 17px;
      height: 17px;
      margin: 0;
      flex: 0 0 auto;
    }

    .skill-name {
      line-height: 1.3;
      font-weight: 500;
      color: #1e293b;
    }

    .skills-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid #edf1f6;
    }

    .skills-footer button {
      min-width: 140px;
    }

    @media (max-width: 1200px) {
      .profile-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .skills-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 850px) {
      .profile-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .skills-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 560px) {
      .profile-grid,
      .skills-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
      }

      .profile-action button,
      .skills-footer button {
        width: 100%;
      }
    }
  `]
})
export class CasualProfileComponent implements OnInit {
  loaded = false;
  loading = false;
  savingProfile = false;
  savingSkills = false;

  firstName = '';
  lastName = '';
  phone = '';
  city = '';
  photoUrl = '';
  zoneName = '';

  message = '';
  error = '';

  skills: { id: number; name: string }[] = [];
  selected = new Set<number>();

  constructor(
    private api: CasualApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loaded = false;
    this.error = '';

    forkJoin({
      profile: this.api.profile(),
      skills: this.api.skills()
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ profile, skills }) => {
          this.firstName = profile.firstName;
          this.lastName = profile.lastName;
          this.phone = profile.phone;
          this.city = profile.city;
          this.photoUrl = profile.photoUrl || '';
          this.zoneName = profile.currentZoneName;

          this.skills = skills;

          const names = new Set(profile.skills);

          this.selected = new Set(
            skills
              .filter(x => names.has(x.name))
              .map(x => x.id)
          );

          this.loaded = true;
          this.cdr.detectChanges();
        },

        error: e => {
          console.error('Failed to load profile', e);

          this.error =
            e?.error?.message ??
            'Unable to load profile.';

          this.cdr.detectChanges();
        }
      });
  }

  save(): void {
    if (this.savingProfile) {
      return;
    }

    this.savingProfile = true;
    this.message = '';
    this.error = '';

    this.api.updateProfile({
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      city: this.city,
      photoUrl: this.photoUrl || null
    })
      .pipe(
        finalize(() => {
          this.savingProfile = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: profile => {
          this.firstName = profile.firstName;
          this.lastName = profile.lastName;
          this.phone = profile.phone;
          this.city = profile.city;
          this.photoUrl = profile.photoUrl || '';
          this.zoneName = profile.currentZoneName;

          this.message = 'Profile updated.';
          this.cdr.detectChanges();
        },

        error: e => {
          this.error =
            e?.error?.message ??
            'Unable to update profile.';

          this.cdr.detectChanges();
        }
      });
  }

  toggle(id: number, on: boolean): void {
    const next = new Set(this.selected);

    if (on) {
      next.add(id);
    } else {
      next.delete(id);
    }

    this.selected = next;
  }

  saveSkills(): void {
    if (this.savingSkills) {
      return;
    }

    this.savingSkills = true;
    this.message = '';
    this.error = '';

    this.api.setSkills([...this.selected])
      .pipe(
        finalize(() => {
          this.savingSkills = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.message = 'Skills updated.';
          this.cdr.detectChanges();
        },

        error: e => {
          this.error =
            e?.error?.message ??
            'Unable to update skills.';

          this.cdr.detectChanges();
        }
      });
  }
}
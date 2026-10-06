import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector:'app-shell',
  standalone:true,
  imports:[CommonModule,RouterOutlet,RouterLink,RouterLinkActive],
  templateUrl:'./shell.component.html',
  styleUrl:'./shell.component.scss'
})
export class ShellComponent {
  constructor(public auth:AuthService){}

  readonly links=computed(()=>{
    const role=this.auth.role();

    if(role==='SuperAdmin') return [
      ['Dashboard','/admin/dashboard'],
      ['Registrations','/admin/registrations'],
      ['Users','/admin/users'],
      ['Stores','/admin/stores'],
      ['Zones','/admin/zones'],
      ['Area Managers','/admin/area-managers'],
      ['Pay Rates','/admin/pay-rates'],
      ['Public Holidays','/admin/public-holidays'],
      ['Reports & Audit','/admin/reports']
    ];

    if(role==='StoreManager'||role==='AssistantManager') return [
      ['Dashboard','/store/dashboard'],
      ['Staff','/store/staff'],
      ['Roster & Gaps','/store/roster'],
      ['Find Casuals','/store/casual-search'],
      ['Bookings','/store/bookings'],
      ['Budget','/store/budget'],
      ['Reports','/store/reports']
    ];

    if(role==='AreaManager') return [
      ['Dashboard','/area/dashboard'],
      ['Stores','/area/stores'],
      ['Staffing Gaps','/area/gaps'],
      ['Casuals','/area/casuals'],
      ['Bookings','/area/bookings'],
      ['Transfers','/area/transfers'],
      ['Reports','/area/reports']
    ];

    return [
      ['Dashboard','/casual/dashboard'],
      ['Bookings','/casual/bookings'],
      ['Availability','/casual/availability'],
      ['Profile','/casual/profile'],
      ['Notifications','/casual/notifications'],
      ['Reports','/casual/reports']
    ];
  });
}

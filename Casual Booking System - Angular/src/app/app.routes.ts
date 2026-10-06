import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes:Routes=[
  {path:'login',loadComponent:()=>import('./components/auth/login.component').then(m=>m.LoginComponent)},
  {path:'register/casual',loadComponent:()=>import('./components/auth/register-casual.component').then(m=>m.RegisterCasualComponent)},
  {path:'register/store',loadComponent:()=>import('./components/auth/register-store.component').then(m=>m.RegisterStoreComponent)},
  {path:'register/area-manager',loadComponent:()=>import('./components/auth/register-area-manager.component').then(m=>m.RegisterAreaManagerComponent)},

  {path:'',component:ShellComponent,canActivate:[authGuard],children:[
    {path:'admin/dashboard',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/dashboard.component').then(m=>m.AdminDashboardComponent)},
    {path:'admin/users',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/users.component').then(m=>m.UsersComponent)},
    {path:'admin/stores',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/stores.component').then(m=>m.StoresComponent)},
    {path:'admin/registrations',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/registrations.component').then(m=>m.RegistrationsComponent)},
    {path:'admin/zones',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/zones.component').then(m=>m.ZonesComponent)},
    {path:'admin/area-managers',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/area-managers.component').then(m=>m.AreaManagersAdminComponent)},
    {path:'admin/pay-rates',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/pay-rates.component').then(m=>m.PayRatesComponent)},
    {path:'admin/public-holidays',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/public-holidays.component').then(m=>m.PublicHolidaysComponent)},
    {path:'admin/reports',canActivate:[roleGuard],data:{roles:['SuperAdmin']},loadComponent:()=>import('./components/admin/reports.component').then(m=>m.AdminReportsComponent)},

    {path:'store/dashboard',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/dashboard.component').then(m=>m.StoreDashboardComponent)},
    {path:'store/staff',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/staff.component').then(m=>m.StaffComponent)},
    {path:'store/roster',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/roster.component').then(m=>m.RosterComponent)},
    {path:'store/casual-search',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/casual-search.component').then(m=>m.CasualSearchComponent)},
    {path:'store/bookings',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/bookings.component').then(m=>m.StoreBookingsComponent)},
    {path:'store/budget',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/budget.component').then(m=>m.BudgetComponent)},
    {path:'store/reports',canActivate:[roleGuard],data:{roles:['StoreManager','AssistantManager']},loadComponent:()=>import('./components/store/reports.component').then(m=>m.StoreReportsComponent)},

    {path:'casual/dashboard',canActivate:[roleGuard],data:{roles:['Casual']},loadComponent:()=>import('./components/casual/dashboard.component').then(m=>m.CasualDashboardComponent)},
    {path:'casual/bookings',canActivate:[roleGuard],data:{roles:['Casual']},loadComponent:()=>import('./components/casual/bookings.component').then(m=>m.CasualBookingsComponent)},
    {path:'casual/availability',canActivate:[roleGuard],data:{roles:['Casual']},loadComponent:()=>import('./components/casual/availability.component').then(m=>m.CasualAvailabilityComponent)},
    {path:'casual/profile',canActivate:[roleGuard],data:{roles:['Casual']},loadComponent:()=>import('./components/casual/profile.component').then(m=>m.CasualProfileComponent)},
    {path:'casual/notifications',canActivate:[roleGuard],data:{roles:['Casual']},loadComponent:()=>import('./components/casual/notifications.component').then(m=>m.NotificationsComponent)},
    {path:'casual/reports',canActivate:[roleGuard],data:{roles:['Casual']},loadComponent:()=>import('./components/casual/reports.component').then(m=>m.CasualReportsComponent)},

    {path:'area/dashboard',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/dashboard.component').then(m=>m.AreaDashboardComponent)},
    {path:'area/stores',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/stores.component').then(m=>m.AreaStoresComponent)},
    {path:'area/gaps',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/gaps.component').then(m=>m.AreaGapsComponent)},
    {path:'area/casuals',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/casuals.component').then(m=>m.AreaCasualsComponent)},
    {path:'area/bookings',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/bookings.component').then(m=>m.AreaBookingsComponent)},
    {path:'area/transfers',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/transfers.component').then(m=>m.AreaTransfersComponent)},
    {path:'area/reports',canActivate:[roleGuard],data:{roles:['AreaManager']},loadComponent:()=>import('./components/area/reports.component').then(m=>m.AreaReportsComponent)}
  ]},

  {path:'**',redirectTo:'login'}
];

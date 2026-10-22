import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Zone } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({standalone:true,imports:[CommonModule,FormsModule],template:`
<h1>Zones</h1><p class="lead">Each zone belongs to a city.</p>
<div class="panel form-row"><input [(ngModel)]="city" placeholder="City"><input [(ngModel)]="name" placeholder="Zone name"><button (click)="add()" [disabled]="saving||!city.trim()||!name.trim()">{{saving?'Adding...':'Add zone'}}</button></div>
<div class="panel"><table><thead><tr><th>City</th><th>Zone</th><th>Status</th><th></th></tr></thead><tbody><tr *ngFor="let z of rows"><td>{{z.city}}</td><td><strong>{{z.name}}</strong></td><td><span class="badge" [class.good]="z.isActive">{{z.isActive?'Active':'Inactive'}}</span></td><td><button (click)="toggle(z)">{{z.isActive?'Deactivate':'Activate'}}</button></td></tr></tbody></table></div>
<div class="callout good" *ngIf="message">{{message}}</div><div class="callout error-box" *ngIf="error">{{error}}</div>`,styleUrls:['../page.scss']})
export class ZonesComponent implements OnInit {rows:Zone[]=[];city='';name='';saving=false;message='';error='';constructor(private api:AdminApiService,private cdr:ChangeDetectorRef){}ngOnInit(){this.load();}load(){this.api.zones().subscribe({next:x=>{this.rows=x.sort((a,b)=>(a.city+a.name).localeCompare(b.city+b.name));this.cdr.detectChanges();},error:e=>{this.error=e?.error?.message??'Unable to load zones.';this.cdr.detectChanges();}});}add(){if(!this.city.trim()||!this.name.trim()||this.saving)return;this.saving=true;this.message='';this.error='';this.api.createZone(this.name.trim(),this.city.trim()).pipe(finalize(()=>{this.saving=false;this.cdr.detectChanges();})).subscribe({next:z=>{this.message=`${z.city} / ${z.name} added.`;this.city='';this.name='';this.load();},error:e=>{this.error=e?.error?.message??'Unable to add zone.';this.cdr.detectChanges();}});}toggle(z:Zone){this.api.setZoneActive(z.id,!z.isActive).subscribe(()=>this.load());}}

import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
@Component({selector:'app-kpi',standalone:true,imports:[NgIf],template:`<div class="kpi"><span>{{label}}</span><strong>{{value}}</strong><small *ngIf="hint">{{hint}}</small></div>`,styles:[`.kpi{background:#fff;border:1px solid #e6eaf0;border-radius:14px;padding:18px;box-shadow:0 2px 10px #0f172a0a}.kpi span{color:#64748b;font-size:13px}.kpi strong{display:block;font-size:28px;margin:8px 0;color:#172033}.kpi small{color:#64748b}`]})
export class KpiComponent{@Input()label='';@Input()value:string|number|null='';@Input()hint='';}

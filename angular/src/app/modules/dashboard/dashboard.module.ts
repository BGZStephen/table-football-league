import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppRoutes } from '../../app.routes';
import * as components from './components/dashboard-components-barrel';

@NgModule({
  declarations: [
    components.DashboardHomeComponent,
    components.DashboardNavbarComponent,
    components.DashboardViewWrapperComponent,
    components.DashboardFixturesComponent,
    components.DashboardTeamsComponent,
    components.DashboardLeaguesComponent,
    components.DashboardAccountComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    AppRoutes,
  ],
  providers: [],
})
export class DashboardModule { }

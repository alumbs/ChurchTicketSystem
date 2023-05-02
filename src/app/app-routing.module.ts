import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UploadSheetComponent } from './upload-sheet/upload-sheet.component';
import { PaidTicketsComponent } from './paid-tickets/paid-tickets.component';
import { EventCheckInComponent } from './event-check-in/event-check-in.component';

const routes: Routes = [{
  path: '',
  component: DashboardComponent
},
{
  path: 'upload-sheet',
  component: UploadSheetComponent
},
{
  path: 'record-payment',
  component: PaidTicketsComponent
},
{
  path: 'manage-tickets-used',
  component: EventCheckInComponent
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

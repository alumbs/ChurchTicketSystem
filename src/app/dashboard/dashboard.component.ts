import { Component } from '@angular/core';

interface AppFunctionality {
  name: string,
  description: string,
  url: string,
  disabled: boolean
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  appFunctions: AppFunctionality[] = [
    {
      name: 'Upload Ticket Sheet',
      description: `A page where you can upload a list of tickets.  <br>
  Here are the compulsory excel columns: <br>
  - Name: contains the user's name <br>
  - NumberOfTickets : contains a number 0 to 100 <br>
  - AmountPaid: a number <br>
  - HasPaid : contains yes or no <br>
  - DatePaid: any value 
  `,
      url: 'upload-sheet',
      disabled: false
    },
    {
      name: 'Record Ticket Payment',
      description: 'A page where you can record if someone has paid, how much they paid, and when they paid',
      url: 'record-payment',
      disabled: false
    },
    {
      name: 'Manage Tickets Used',
      description: `A page where you can check off how many
  of a person's tickets have been used.
  Best used at the event door when we are checking people in`,
      url: 'manage-tickets-used',
      disabled: true
    },
  ]
}

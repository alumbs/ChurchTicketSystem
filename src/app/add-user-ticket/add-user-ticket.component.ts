import { Component, Inject } from '@angular/core';
import { Ticket } from '../models/ticket';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-user-ticket',
  templateUrl: './add-user-ticket.component.html',
  styleUrls: ['./add-user-ticket.component.scss']
})
export class AddUserTicketComponent {


  constructor(
    public dialogRef: MatDialogRef<AddUserTicketComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Ticket,
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

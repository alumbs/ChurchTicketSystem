import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Firestore, collectionData, collection, addDoc, CollectionReference, DocumentData, updateDoc, doc, deleteDoc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs';
import { Ticket } from '../models/ticket';
import { MatDialog } from '@angular/material/dialog';
import { AddUserTicketComponent } from '../add-user-ticket/add-user-ticket.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

interface TicketChangeEvent { element: Ticket, fieldToUpdate: string, newValue: any };

@Component({
  selector: 'app-paid-tickets',
  templateUrl: './paid-tickets.component.html',
  styleUrls: ['./paid-tickets.component.scss']
})
export class PaidTicketsComponent implements OnInit, AfterViewInit {
  excelSheetPath = 'ifc_sheet_1';

  dbTickets$!: Observable<Ticket[]>;

  filterByName$ = new BehaviorSubject<string>('');

  // dbTicketList: Ticket[] = [];

  displayedColumns: any[] = [
    'Name',
    'NumberOfTickets',
    'AmountPaid',
    'HasPaid',
    'DatePaid'];

  // updateElement$ = new Subject<TicketChangeEvent>;
  updateElement$ = new Subject<Ticket>;
  dataSource = new MatTableDataSource<Ticket>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  totalSize: number = 0;

  constructor(private firestore: Firestore, public dialog: MatDialog) {
  }
  ngOnInit(): void {
    const collection = this.getFirestoreJournalCollection();

    combineLatest([collectionData(collection, { idField: 'id' }), this.filterByName$]).pipe(
      map(([data, filterString]: [DocumentData[], string]) => data ? data.filter(d => d['Name'].toLowerCase().includes(filterString.toLowerCase())) : []),
      tap(data => {
        // console.log('Filtered data is ', data);
        const ticketData = data as Ticket[];

        this.dataSource = new MatTableDataSource<Ticket>(ticketData);
        this.dataSource.paginator = this.paginator;
      }),
    ).subscribe();

    this.updateElement$.pipe(
      debounceTime(1000),
      tap(newTicketInfo => {
        const ticketWithDateInfo = { ...newTicketInfo, DatePaid: newTicketInfo.DatePaid ? new Date(newTicketInfo.DatePaid).toISOString() : '' };
        this.updateUserTicketInfo(ticketWithDateInfo)
      })
    ).subscribe();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }


  openDialog(): void {
    const newUserTicket: Ticket = {
      id: '',
      Name: '',
      NumberOfTickets: 5,
      AmountPaid: 0,
      HasPaid: false,
      DatePaid: ''//new Date().toISOString()
    }

    const dialogRef = this.dialog.open(AddUserTicketComponent, {
      data: newUserTicket,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('The dialog was closed', result);

        const newTicketInfo = { ...result, DatePaid: result.DatePaid ? result.DatePaid.toISOString() : '' };
        this.updateUserTicketInfo(newTicketInfo);
      }
    });
  }

  getFirestoreJournalCollection(): CollectionReference<DocumentData> {
    const journalCollection = collection(this.firestore, this.excelSheetPath);
    return journalCollection;
  }

  async updateUserTicketInfo(userTicketInfo: Ticket) {
    if (userTicketInfo) {
      const journalCollection = this.getFirestoreJournalCollection();

      // Create a query against the collection.
      const q = query(journalCollection, where("Name", "==", userTicketInfo.Name));

      const querySnapshot = await getDocs(q);

      const userExists = !querySnapshot.empty;

      let userRecord: Ticket | undefined = undefined;

      querySnapshot.forEach(record => {
        userRecord = {
          ...record.data(),
          id: record.id
        } as Ticket;
        return;
      });

      if (userRecord === undefined) {
        addDoc(journalCollection, { ...userTicketInfo }).then(result => {
          // this.messageService.add({
          //   severity: 'success',
          //   summary: 'Journal Entry Added Successfully',
          //   detail: `Add of ${userTicketInfo?.title} Successful`
          // });

          // After creating a new document, load it
          getDoc(result).then(newDoc => {
            const doc = { id: newDoc.id, ...newDoc.data() } as Ticket;
            // const createdDateAsDate = new Date(Date.parse(doc.createdDate))
            userTicketInfo = { ...doc };
          });
        });
      } else {
        console.log('userExists ', JSON.stringify(userRecord));

        const docRef = doc(this.firestore, this.excelSheetPath, (userRecord as Ticket).id);

        updateDoc(docRef, { ...userTicketInfo, updatedDate: new Date().toISOString() })
          .then(_result => {
            // this.messageService.add({
            //   severity: 'success',
            //   summary: 'Update Occurred Successfully',
            //   detail: `Update of ${userTicketInfo?.title} Successful`
            // });
          })
          .catch(error => {
            console.log(error);
          });
      }
    }

  }
}

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PaidTicketsComponent } from './paid-tickets/paid-tickets.component';
import { EventCheckInComponent } from './event-check-in/event-check-in.component';
import { MaterialModule } from './material.module';
import { UploadSheetComponent } from './upload-sheet/upload-sheet.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { AddUserTicketComponent } from './add-user-ticket/add-user-ticket.component';
// import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    PaidTicketsComponent,
    EventCheckInComponent,
    UploadSheetComponent,
    AddUserTicketComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

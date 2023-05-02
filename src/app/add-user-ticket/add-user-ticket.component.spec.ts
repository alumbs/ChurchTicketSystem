import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserTicketComponent } from './add-user-ticket.component';

describe('AddUserTicketComponent', () => {
  let component: AddUserTicketComponent;
  let fixture: ComponentFixture<AddUserTicketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUserTicketComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

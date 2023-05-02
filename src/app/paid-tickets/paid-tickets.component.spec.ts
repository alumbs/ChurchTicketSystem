import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaidTicketsComponent } from './paid-tickets.component';

describe('PaidTicketsComponent', () => {
  let component: PaidTicketsComponent;
  let fixture: ComponentFixture<PaidTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaidTicketsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaidTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

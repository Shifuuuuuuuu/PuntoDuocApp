import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallesEventoPage } from './detalles-evento.page';

describe('DetallesEventoPage', () => {
  let component: DetallesEventoPage;
  let fixture: ComponentFixture<DetallesEventoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetallesEventoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

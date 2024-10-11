import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialEventosPage } from './historial-eventos.page';

describe('HistorialEventosPage', () => {
  let component: HistorialEventosPage;
  let fixture: ComponentFixture<HistorialEventosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialEventosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

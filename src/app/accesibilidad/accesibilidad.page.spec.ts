import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccesibilidadPage } from './accesibilidad.page';

describe('AccesibilidadPage', () => {
  let component: AccesibilidadPage;
  let fixture: ComponentFixture<AccesibilidadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccesibilidadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

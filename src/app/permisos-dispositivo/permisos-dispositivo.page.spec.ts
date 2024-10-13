import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermisosDispositivoPage } from './permisos-dispositivo.page';

describe('PermisosDispositivoPage', () => {
  let component: PermisosDispositivoPage;
  let fixture: ComponentFixture<PermisosDispositivoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PermisosDispositivoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

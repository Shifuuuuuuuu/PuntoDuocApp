import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadisticaUsuarioPage } from './estadistica-usuario.page';

describe('EstadisticaUsuarioPage', () => {
  let component: EstadisticaUsuarioPage;
  let fixture: ComponentFixture<EstadisticaUsuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EstadisticaUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

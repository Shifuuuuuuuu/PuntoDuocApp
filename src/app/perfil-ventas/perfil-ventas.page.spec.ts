import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilVentasPage } from './perfil-ventas.page';

describe('PerfilVentasPage', () => {
  let component: PerfilVentasPage;
  let fixture: ComponentFixture<PerfilVentasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilVentasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

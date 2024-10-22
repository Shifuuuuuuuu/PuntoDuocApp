import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilGestorPage } from './perfil-gestor.page';

describe('PerfilGestorPage', () => {
  let component: PerfilGestorPage;
  let fixture: ComponentFixture<PerfilGestorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilGestorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

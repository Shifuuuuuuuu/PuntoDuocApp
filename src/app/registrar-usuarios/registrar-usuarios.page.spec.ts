import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrarUsuariosPage } from './registrar-usuarios.page';

describe('RegistrarUsuariosPage', () => {
  let component: RegistrarUsuariosPage;
  let fixture: ComponentFixture<RegistrarUsuariosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrarUsuariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

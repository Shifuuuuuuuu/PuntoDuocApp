import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrarInvitadoPage } from './registrar-invitado.page';

describe('RegistrarInvitadoPage', () => {
  let component: RegistrarInvitadoPage;
  let fixture: ComponentFixture<RegistrarInvitadoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrarInvitadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

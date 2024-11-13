import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardVendedorPage } from './dashboard-vendedor.page';

describe('DashboardVendedorPage', () => {
  let component: DashboardVendedorPage;
  let fixture: ComponentFixture<DashboardVendedorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardVendedorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

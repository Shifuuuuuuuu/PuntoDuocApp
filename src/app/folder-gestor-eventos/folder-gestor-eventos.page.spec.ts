import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FolderGestorEventosPage } from './folder-gestor-eventos.page';

describe('FolderGestorEventosPage', () => {
  let component: FolderGestorEventosPage;
  let fixture: ComponentFixture<FolderGestorEventosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderGestorEventosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

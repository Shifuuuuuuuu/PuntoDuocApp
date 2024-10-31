import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventsCategoryPage } from './events-category.page';

describe('EventsCategoryPage', () => {
  let component: EventsCategoryPage;
  let fixture: ComponentFixture<EventsCategoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsCategoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

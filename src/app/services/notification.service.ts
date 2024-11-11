import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCount.asObservable();

  constructor() {}

  incrementUnreadCount() {
    const currentCount = this.unreadCount.value;
    this.unreadCount.next(currentCount + 1);
  }

  resetUnreadCount() {
    this.unreadCount.next(0);
  }
}

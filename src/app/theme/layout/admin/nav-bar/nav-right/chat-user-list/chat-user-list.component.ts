import { TranslateModule } from '@ngx-translate/core';
import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { FriendComponent } from '../chat-user-list/friend/friend.component';

@Component({
  selector: 'app-chat-user-list',
  imports: [TranslateModule, FormsModule, NgScrollbarModule, FriendComponent],
  templateUrl: './chat-user-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./chat-user-list.component.scss']
})
export class ChatUserListComponent {
  @Output() ChatCollapse = new EventEmitter<void>();
  @Output() ChatToggle = new EventEmitter<void>();

  friendsList: any[] = [];
  searchFriends = '';

  constructor() {
    console.log('abriendo navbar-chat-user-list');
  }

  ChatOn(): void {
    this.ChatToggle.emit();
  }

  trackByFn(index: number, friend: any): any {
    return friend?.id ?? index;
  }
}

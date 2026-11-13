import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface friendsList {
  id: number;
  photo: string;
  name: string;
  new: number;
  status: number;
  time: string;
}

@Component({
  selector: 'app-friend',
  imports: [CommonModule],
  templateUrl: './friend.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./friend.component.scss']
})
export class FriendComponent {
  @Input() friends!: friendsList;
  @Output() ChatOn = new EventEmitter<number>();

  constructor() {
    console.log('abriendo navbar-friend');
  }

  public innerChatToggle(friends: friendsList) {
    this.ChatOn.emit(friends.id);
  }
}

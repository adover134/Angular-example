import { Component, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-custom-snackbar',
  template: `
    <div [@slideInOut]="state" class="custom-snackbar">
      {{ message }}
    </div>
  `,
  styles: [`
    .custom-snackbar {
      background: #323232;
      color: #fff;
      padding: 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      margin-bottom: 8px;
      width: fit-content;
      max-width: 320px;
    }
  `],
  animations: [
    trigger('slideInOut', [
      state('enter', style({ opacity: 1, transform: 'translateY(0)' })),
      state('leave', style({ opacity: 0, transform: 'translateY(20%)' })),
      transition('void => enter', [
        style({ opacity: 0, transform: 'translateY(20%)' }),
        animate('300ms ease-out')
      ]),
      transition('enter => leave', [
        animate('300ms ease-in')
      ])
    ])
  ],
  standalone: false
})
export class CustomSnackbar3Component {
  @Input() message = '';
  state: 'enter' | 'leave' = 'enter'; // 3. 상태 바인딩 변수 추가
}
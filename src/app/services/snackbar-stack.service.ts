import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CustomSnackbar3Component } from '../custom-snackbar3/custom-snackbar3.component';

interface SnackbarData {
  message: string;
  overlayRef: OverlayRef;
  componentRef: any; // 애니메이션 상태 확인을 위해 컴포넌트 참조 저장
}

@Injectable({ providedIn: 'root' })
export class SnackbarStackService {
  private snackbars: SnackbarData[] = [];

  constructor(
    private overlay: Overlay,
    private injector: Injector
  ) {}

  open(message: string) {
    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position()
        .global()
        .left('16px')
        .bottom(`${16 + this.snackbars.length * 72}px`),
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      panelClass: 'custom-snackbar-overlay'
    });

    const portal = new ComponentPortal(CustomSnackbar3Component, null, this.injector);
    const componentRef = overlayRef.attach(portal);

    if (componentRef.instance && typeof componentRef.instance === 'object') {
      (componentRef.instance as CustomSnackbar3Component).message = message;
    }

    const snackbarData: SnackbarData = { message, overlayRef, componentRef };
    this.snackbars.push(snackbarData);

    // 사라지기 전 애니메이션 트리거 후 제거
    setTimeout(() => {
      const instance = snackbarData.componentRef?.instance as CustomSnackbar3Component;
      if (instance) {
        instance.state = 'leave'; // 1. 상태를 leave로 바꿔서 애니메이션 트리거
        setTimeout(() => {
          this.close(snackbarData); // 2. 애니메이션 완료 후 제거
        }, 300); // 애니메이션 시간과 동일하게 맞춤
      } else {
        this.close(snackbarData);
      }
    }, 3000);
  }

  private close(data: SnackbarData) {
    const index = this.snackbars.indexOf(data);
    if (index > -1) {
      this.snackbars.splice(index, 1);
      data.overlayRef.detach();
      data.overlayRef.dispose();
      this.reposition();
    }
  }

  private reposition() {
    this.snackbars.forEach((data, index) => {
      const position = this.overlay.position()
        .global()
        .left('16px')
        .bottom(`${16 + index * 72}px`);
      data.overlayRef.updatePositionStrategy(position);
    });
  }
}
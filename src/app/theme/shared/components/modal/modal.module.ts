// Angular Import
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { UiModalComponent } from './ui-modal/ui-modal.component';
import { AnimationModalComponent } from './animation-modal/animation-modal.component';

@NgModule({
  // OT-023 fase 5: los dos son standalone; el módulo solo los reexporta
  imports: [CommonModule, UiModalComponent, AnimationModalComponent],
  exports: [UiModalComponent, AnimationModalComponent]
})
export class ModalModule {}

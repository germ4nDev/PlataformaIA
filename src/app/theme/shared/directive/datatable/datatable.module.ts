// Mismo nombre que el módulo de angular-datatables para que las pantallas solo cambien la ruta del import (OT-035).
import { NgModule } from '@angular/core';
import { DataTableDirective } from './datatable.directive';

@NgModule({
    imports: [DataTableDirective],
    exports: [DataTableDirective]
})
export class DataTablesModule {}

export { DataTableDirective };

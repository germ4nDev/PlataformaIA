import { traducir } from '../../../theme/shared/i18n/traducir';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataTablesModule, DataTableDirective } from 'angular-datatables';

@Component({
  selector: 'app-log-transacciones',
  standalone: true,
  imports: [DataTablesModule],
  templateUrl: './log-transacciones.component.html',
  styleUrl: './log-transacciones.component.scss'
})
export class LogTransaccionesComponent implements OnInit, AfterViewInit {
dtColumnSearchingOptions: object = {};
  @ViewChild(DataTableDirective)
  datatableElement!: DataTableDirective;

  // life cycle event
  ngOnInit() {
    this.dtColumnSearchingOptions = {
      ajax: 'fake-data/datatable-data.json',
      columns: [
        {
          title: traducir('WEB.PERFIL_CONFIGURACION.NAME'),
          data: 'name'
        },
        {
          title: traducir('WEB.COMUN.POSITION'),
          data: 'position'
        },
        {
          title: traducir('WEB.COMUN.OFFICE'),
          data: 'office'
        },
        {
          title: traducir('WEB.COMUN.AGE'),
          data: 'age'
        },
        {
          title: traducir('WEB.COMUN.START_DATE'),
          data: 'date'
        },
        {
          title: traducir('WEB.COMUN.SALARY'),
          data: 'salary'
        }
      ],
      responsive: true
    };
  }

  ngAfterViewInit(): void {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.columns().every(function () {
        // eslint-disable-next-line
        const input = $('input', this.footer()) as any;
        input.on('keyup change', () => {
          if (this.search() !== input.val()) {
            this.search(input.val()).draw();
          }
        });
      });
    });
  }
}

import { traducir } from '../../../theme/shared/i18n/traducir';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataTablesModule, DataTableDirective } from 'angular-datatables';
import type { Api } from 'datatables.net';

@Component({
  selector: 'app-historial-pagos',
  imports: [DataTablesModule],
  templateUrl: './historial-pagos.component.html',
  styleUrl: './historial-pagos.component.scss'
})
export class HistorialPagosComponent implements OnInit, AfterViewInit {
  dtColumnSearchingOptions: object = {};
  @ViewChild(DataTableDirective)
  datatableElement!: DataTableDirective;

  // life cycle event
  ngOnInit() {
    this.dtColumnSearchingOptions = {
      ajax: 'fake-data/datatable-data.json',
      columns: [
        {
          title: traducir('COMMON.NAME'),
          data: 'name'
        },
        {
          title: traducir('COMMON.POSITION'),
          data: 'position'
        },
        {
          title: traducir('COMMON.OFFICE'),
          data: 'office'
        },
        {
          title: traducir('COMMON.AGE'),
          data: 'age'
        },
        {
          title: traducir('COMMON.START_DATE'),
          data: 'date'
        },
        {
          title: traducir('COMMON.SALARY'),
          data: 'salary'
        }
      ],
      responsive: true
    };
  }

  ngAfterViewInit(): void {
    this.datatableElement.dtInstance.then((dtInstance: Api<any>) => {
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
const base_url = environment.apiUrl;

@Injectable({
    providedIn: 'root'
})
export class IngestaService {

    constructor(private http: HttpClient, private toastr: ToastrService) { }

    subirExcelRNDC(archivo: File): Observable<any> {
        const formData = new FormData();
        formData.append('archivoExcel', archivo);

        return this.http.post(`${base_url}/tclp-ingesta/rndc`, formData);
    }

    subirMatrizOperaciones(archivo: File): Observable<any> {
        const formData = new FormData();
        formData.append('archivoExcel', archivo);

        return this.http.post(`${base_url}/tclp-ingesta/matriz`, formData);
    }

    subirCsvMaritimo(archivo: File): Observable<any> {
        const formData = new FormData();
        formData.append('archivoCsv', archivo);

        return this.http.post(`${base_url}/tclp-ingesta/maritimo`, formData);
    }

    actualizarHistoricoSuperTrasnporte() {
        this.http.post(`${base_url}/tclp-ingesta/historico-supertransporte/sincronizar`, {}).subscribe({
            next: (res: any) => {
                // Si sale bien, lanzamos un toast de Éxito
                this.toastr.success(`✅ ${res.data.length || 'Los'} registros históricos fueron guardados.`, 'Auditoría Actualizada');
            },
            error: (err) => {
                // Si el portal del gobierno falla
                this.toastr.error('No se pudo conectar con datos.gov.co', 'Error de Sincronización');
            }
        });
    }

    subirLineUpMasivo(registros: any[]): Observable<any> {
        // console.log('enviar registros a la api', registros);
        const url = `${base_url}/tclp-ingesta/lineup/ingesta`;
        return this.http.post(url, { registros });
    }
}

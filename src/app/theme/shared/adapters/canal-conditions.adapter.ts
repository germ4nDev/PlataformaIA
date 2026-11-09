import { IBaseAdapter } from './base.adapter';
import { CanalModel } from '../_helpers/models/tablero-control/canal.model';

export class CanalConditionsAdapter implements IBaseAdapter<CanalModel> {
    transform(data: any): CanalModel {
        // Aquí encapsulamos la lógica: el backend puede cambiar los nombres,
        // pero tu modelo sigue siendo el mismo.
        return {
            titulo: 'CONDICIONES DEL CANAL · REPORTE',
            subtitulo: 'WEB.CANAL_CONDITIONS_ADAPTER.REPORTE_METEOROLOGICO_Y_ESTADO_DIMAR',
            marea: `${data.current_tide || 0} m`,
            visibilidad: `${data.visibility || 0} km`,
            viento: data.viento || 'Cerrado',
            estadoCanal: data.estadoCanal || 'Cerrado',
            claseEstado: data.estadoCanal === 'Abierto' ? 'text-success' : 'text-danger',
            pilotaje: 'Normal',
            pleamar: data.pleamar || '--'
        };
    }
}

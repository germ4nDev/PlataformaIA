/*
    Author: German Valencia
    Pattern: PORTTOS Front - Popups del mapa logístico
    Description: HTML de la ventana de detalle de cada capa. Los valores de texto de las propiedades se escapan
      (escaparHtml) para que un nombre o descripción con HTML no se ejecute en el navegador.
*/
import * as turf from '@turf/turf';

export interface ContextoPopup {
    isDark: boolean;
    ultimaFlotaGeoJson: any;
    ultimosIncidentes: any;
}

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(valor: any): string {
    return String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

/** Copia de las propiedades con todos los textos escapados (números, booleanos y objetos se conservan). */
export function escaparPropiedades(props: Record<string, any>): any {
    const salida: Record<string, any> = {};
    for (const [k, v] of Object.entries(props || {})) salida[k] = typeof v === 'string' ? escaparHtml(v) : v;
    return salida;
}

export function generarContenidoPopup(layerId: string, feature: any, ctx: ContextoPopup): string {
    // Todo texto que viene de datos se escapa antes de entrar al HTML del popup.
    const data = escaparPropiedades(feature.properties || {});

    switch (layerId) {
        case 'capa-infra-fill':
        case 'capa-infra-terminal-fill':
        case 'capa-infra-point':
        case 'infra-marcadores-puerto':
        case 'infra-marcadores-terminal':
        case 'infra-marcadores-detalle':
            return `<div class="custom-map-popup infra"><h3>${data.nombre || 'Sin nombre'}</h3><p><strong>Tipo:</strong> ${data.tipo ? data.tipo.toUpperCase() : 'N/A'
                }</p></div>`;

        case 'muelles-estado-fill': {
            const textoEstado: Record<string, string> = {
                LIBRE: 'Libre', OCUPADO: 'Ocupado', RESERVADO: 'Reservado', MANTENIMIENTO: 'En mantenimiento'
            };
            const colores: Record<string, string> = { LIBRE: '#16a34a', OCUPADO: '#dc2626', RESERVADO: '#f59e0b', MANTENIMIENTO: '#64748b' };
            const fuente: Record<string, string> = { AIS_Y_LINEUP: 'AIS y line-up', AIS: 'AIS', LINEUP: 'line-up (sin confirmar por AIS)' };
            const horas = (min: any) => {
                const m = Number(min);
                return Number.isFinite(m) ? (m >= 90 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`) : '';
            };
            const filas: string[] = [];
            if (data.nave) filas.push(`<p><strong>Nave:</strong> ${data.nave}${data.eslora ? ` · ${data.eslora} m` : ''}</p>`);
            if (data.minutosAtracada !== null && data.minutosAtracada !== undefined && data.minutosAtracada !== 'null') {
                filas.push(`<p><strong>Atracada hace:</strong> ${horas(data.minutosAtracada)}</p>`);
            }
            if (data.fuente && data.fuente !== 'null') filas.push(`<p><strong>Según:</strong> ${fuente[data.fuente] || data.fuente}</p>`);
            if (data.verificacion === 'DISCREPANCIA' || data.verificacion === 'NO_REPORTADO') {
                filas.push(`<p style="color:#dc2626"><strong>⚠ ${data.verificacionTexto}</strong></p>`);
            }
            if (data.proximoMotonave && data.proximoMotonave !== 'null') {
                filas.push(`<p><strong>Próximo atraque:</strong> ${data.proximoMotonave} en ${horas(data.proximoEnMinutos)}</p>`);
            }
            const detalle = [data.especialidad, data.caladoMetros && data.caladoMetros !== 'null' ? `calado ${data.caladoMetros} m` : '']
                .filter((x: any) => x && x !== 'null').join(' · ');
            return `<div class="custom-map-popup infra"><h3>Muelle ${data.codigoMuelle} · ${data.terminal}</h3>
                <p><span style="display:inline-block;padding:2px 8px;border-radius:10px;color:#fff;background:${colores[data.estado] || '#64748b'}">${textoEstado[data.estado] || data.estado}</span></p>
                ${detalle ? `<p>${detalle}</p>` : ''}${filas.join('')}</div>`;
        }

        case 'naves-individual': {
            const estadoNave = data.estado_nave || 'EN TRÁNSITO';
            const omi = data.omi || 'N/A';
            const bandera = data.bandera || 'Desconocida';
            const eta = data.eta ? new Date(data.eta).toLocaleString('es-CO') : 'No Registrada';
            const agencia = data.agencia || 'N/A';
            const velocidadnv =
                data.velocidad !== undefined && data.velocidad !== null ? `${data.velocidad} nudos` : 'N/A';
            const rumbo = data.rumbo !== undefined && data.rumbo !== null ? `${data.rumbo}°` : 'N/A';
            const tipoNave = data.tipo_nave || 'N/A';
            const terminal = data.instalacion_portuaria || 'N/A';
            const eslora = data.eslora || 'N/A';
            const calado = data.calado ? `${data.calado}m` : 'N/A';

            let badgeColor = '#64748b';
            if (estadoNave === 'AVISADAS') badgeColor = '#a855f7';
            if (estadoNave === 'FONDEADAS') badgeColor = '#facc15';
            if (estadoNave === 'ARRIBADAS') badgeColor = '#22c55e';

            // Estado AIS (motor de ingesta): independiente del estado DIMAR
            const estadoAis: string | null = data.estado_ais || data.estado_inferido || data.estadoInferido || null;
            const coloresAis: Record<string, string> = {
                'ATRACADO': '#22c55e', 'FONDEADO': '#facc15', 'EN MANIOBRA': '#38bdf8', 'NAVEGANDO': '#3b82f6',
                'DETENIDO': '#94a3b8', 'VARADO': '#ef4444', 'SIN GOBIERNO': '#ef4444', 'EMERGENCIA': '#dc2626',
                'PESCA': '#14b8a6', 'REMOLQUE': '#f97316'
            };
            const colorAis = (estadoAis && coloresAis[estadoAis]) || '#64748b';
            const desdeAis = data.estado_ais_desde ? new Date(data.estado_ais_desde).getTime() : NaN;
            const minutosAis = Number.isFinite(desdeAis) ? Math.max(0, Math.round((Date.now() - desdeAis) / 60000)) : NaN;
            const tiempoAis = Number.isFinite(minutosAis)
                ? (minutosAis >= 60 ? `${Math.floor(minutosAis / 60)} h ${minutosAis % 60} min` : `${minutosAis} min`)
                : '';
            const zonaAis = [data.id_puerto, data.id_terminal, data.codigo_muelle].filter(Boolean).join(' · ');
            const badgeAis = estadoAis
                ? `<span title="Declarado por la nave: ${data.estado_nav_ais_texto || 'N/D'}" style="background-color: ${colorAis}; color: ${estadoAis === 'FONDEADO' ? '#000' : '#fff'}; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">AIS: ${estadoAis}</span>`
                : '';
            const lineaAis = estadoAis
                ? `<b>Estado AIS:</b> ${estadoAis}${tiempoAis ? ` · hace ${tiempoAis}` : ''}${zonaAis ? ` · ${zonaAis}` : ''}<br>`
                : '';

            return `
            <div class="custom-map-popup nave-popup" style="min-width: 260px; font-family: sans-serif;">
                <div class="PORTTOS-popup-header" style="border-bottom: 2px solid #00E5FF; padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                        <h3 style="color: ${ctx.isDark ? '#38bdf8' : '#0056b3'}; margin:0; font-size: 10px; font-weight: 600; line-height: 1.4; word-wrap: break-word;">
                            🚢 ${data.nombre_motonave || 'DESCONOCIDA'}
                        </h3>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                        <span style="background-color: #334155; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">
                            MMSI: ${data.mmsi || 'N/A'}
                        </span>
                        <span style="background-color: ${badgeColor}; color: ${estadoNave === 'FONDEADAS' ? '#000' : '#fff'
                }; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; white-space: nowrap;">
                            ${estadoNave}
                        </span>
                        ${badgeAis}
                    </div>
                </div>
                <div class="PORTTOS-popup-body" style="font-size: 12px; line-height: 1.5; color: ${ctx.isDark ? '#e2e8f0' : '#334155'
                };">
                    <b>OMI:</b> ${omi}<br>
                    <b>Tipo:</b> ${tipoNave}<br>
                    <b>Bandera:</b> ${bandera}<br>
                    <b>Agencia:</b> ${agencia}<br>
                    <hr style="margin: 4px 0; border: 0.5px dashed #ccc;">
                    <b>Velocidad:</b> ${velocidadnv} | <b>Rumbo:</b> ${rumbo}<br>
                    ${lineaAis}
                    <b>Dimensiones:</b> Eslora ${eslora}m | Calado ${calado}<br>
                    <b>Instalación:</b> ${terminal}<br>
                    <b>ETA:</b> <span style="color: #d9534f; font-weight: bold;">${eta}</span>
                </div>
            </div>`;
        }

        case 'geocerca-fill-layer': {
            const colorKpi =
                data.estado_kpi === 'ROJO' ? '#dc2626' : data.estado_kpi === 'AMARILLO' ? '#facc15' : '#22c55e';
            const textoColor = data.estado_kpi === 'AMARILLO' ? '#000' : '#fff';

            const htmlTerrestre =
                data.total_camiones > 0 || data.tipo_faro !== 'MARITIMA'
                    ? `
                <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 8px;">
                    <div style="margin-bottom: 4px;"><strong>🚛 Terrestre en zona:</strong> ${data.total_camiones}</div>
                    <div style="margin-bottom: 4px; color: #22c55e; font-size: 11px;">&nbsp;↳ En movimiento: ${data.camiones_ruta}</div>
                    <div style="margin-bottom: 4px; color: #ef4444; font-size: 11px;">&nbsp;↳ Detenidos/Filas: ${data.camiones_detenidos}</div>
                </div>
            `
                    : '';

            const navesClasificadas = data.naves_fondeadas + data.naves_avisadas + data.naves_arribadas;
            const navesTransito = data.total_naves - navesClasificadas;

            const htmlMaritimo =
                data.total_naves > 0 || data.tipo_faro === 'MARITIMA'
                    ? `
                <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 8px;">
                    <div style="margin-bottom: 4px; color: #06b6d4;"><strong>🚢 Naves en zona:</strong> ${data.total_naves}</div>
                    <div style="margin-bottom: 4px; color: #facc15; font-size: 11px;">&nbsp;↳ Fondeadas (Espera): ${data.naves_fondeadas}</div>
                    <div style="margin-bottom: 4px; color: #a855f7; font-size: 11px;">&nbsp;↳ Avisadas (Aprox): ${data.naves_avisadas}</div>
                    <div style="margin-bottom: 4px; color: #22c55e; font-size: 11px;">&nbsp;↳ Arribadas (Muelle): ${data.naves_arribadas}</div>
                    <div style="margin-bottom: 4px; color: #94a3b8; font-size: 11px;">&nbsp;↳ Tránsito / Sin match: ${navesTransito}</div>
                </div>
            `
                    : '';

            return `
                <div class="custom-map-popup kpi" style="min-width: 230px;">
                    <div class="PORTTOS-popup-header" style="border-bottom: 2px solid ${colorKpi}; padding-bottom: 8px;">
                        <h3 style="color:${colorKpi}; margin:0; font-size: 15px;">📍 ${data.nombre_faro}</h3>
                        <span class="PORTTOS-badge" style="background-color:${colorKpi}; color: ${textoColor}; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 5px; display: inline-block;">
                            ESTADO ${data.estado_kpi}
                        </span>
                    </div>
                    <div class="PORTTOS-popup-body" style="font-size: 13px;">
                        ${htmlTerrestre}
                        ${htmlMaritimo}
                    </div>
                </div>
            `;
        }

        case 'viales-individual': {
            const tipo = data.tipoEvento ? data.tipoEvento.replace(/_/g, ' ') : 'ALERTA VIAL';
            const sev = parseInt(data.nivelSeveridad, 10);

            let sevBadgeClass = 'success';
            let sevText = '🟢 BAJA';
            if (sev >= 3) {
                sevBadgeClass = 'danger';
                sevText = '🔴 ALTA';
            } else if (sev === 2) {
                sevBadgeClass = 'warning';
                sevText = '🟠 MEDIA';
            }

            let fechaVial = 'Fecha desconocida';
            if (data.fechaInicio) {
                fechaVial = new Date(data.fechaInicio).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            let htmlVial = `
                <div class="PORTTOS-popup-header">
                    <h3>🚨 ${tipo}</h3>
                    <span class="PORTTOS-badge ${sevBadgeClass}">${sevText}</span>
                </div>
                <div class="PORTTOS-popup-body">
                    <div class="PORTTOS-col">
                        <span class="PORTTOS-label">📍 Corredor:</span>
                        <span class="PORTTOS-value">${data.corredor || data.corredorVial || 'No especificado'}</span>
                    </div>
                    <div class="PORTTOS-col">
                        <span class="PORTTOS-label">🛣️ Sector:</span>
                        <span class="PORTTOS-value">${data.sector || 'No especificado'}</span>
                    </div>
                    <div class="PORTTOS-col">
                        <span class="PORTTOS-label">🕒 Reportado:</span>
                        <span class="PORTTOS-value">${fechaVial}</span>
                    </div>
                    <div class="PORTTOS-divider" style="color: #e2e8f0; font-size: 11px; max-height: 80px; overflow-y: auto;">
                        ${data.descripcion || 'Sin descripción detallada.'}
                    </div>
            `;

            if (data.afectaPeaje === true || data.afectaPeaje === 'true') {
                htmlVial += `<div class="PORTTOS-alert-box">⚠️ CRÍTICO: Cerca a ${data.peajeAfectado}</div>`;
            }

            // Ciclo de vida (2026-10-26): de dónde viene y cuándo se reportó por última vez.
            // Los de TomTom se despejan solos cuando la fuente deja de reportarlos; los manuales, con el botón.
            const manual = data.manual === true || data.manual === 'true';
            const ultimo = data.ultimoReporte ? new Date(data.ultimoReporte) : null;
            const haceMin = ultimo && !isNaN(ultimo.getTime()) ? Math.max(0, Math.round((Date.now() - ultimo.getTime()) / 60000)) : null;
            htmlVial += `
                <div class="PORTTOS-col">
                    <span class="PORTTOS-label">📡 Fuente:</span>
                    <span class="PORTTOS-value">${manual ? 'Reporte manual' : 'TomTom'}${haceMin !== null ? ` · visto hace ${haceMin} min` : ''}</span>
                </div>`;
            if (manual && data.id) {
                // Código codificado (sin comillas ni < >): el mapa lo decodifica al pulsar
                htmlVial += `<button type="button" class="PORTTOS-btn-despejar" data-despejar="${encodeURIComponent(String(data.id))}">✅ Marcar como despejado</button>`;
            }
            return htmlVial + `</div>`;
        }

        case 'terrestre-individual': {
            const placa = data.placa || 'SIN PLACA';
            const conductor = data.conductor || 'No asignado';
            const velocidad = data.velocidad !== undefined ? data.velocidad : 0;
            const estadoCrudo = data.estado_camion || data.estado || 'DESCONOCIDO';
            const estadoCamion = estadoCrudo.replace(/_/g, ' ').toUpperCase();

            let estadoBadgeClass = 'warning';
            let estadoText = `🟡 ${estadoCamion}`;

            if (estadoCamion.includes('RUTA')) {
                estadoBadgeClass = 'success';
                estadoText = '🟢 EN RUTA';
            } else if (estadoCamion.includes('TRAFICO') || estadoCamion.includes('TRÁFICO')) {
                estadoBadgeClass = 'danger';
                estadoText = '🟠 TRÁFICO';
            } else if (estadoCamion.includes('DETENIDO')) {
                estadoBadgeClass = 'danger';
                estadoText = '🔴 DETENIDO';
            } else if (estadoCamion.includes('DESCARGANDO') || estadoCamion.includes('CARGANDO')) {
                estadoBadgeClass = 'info';
                estadoText = `🔵 ${estadoCamion}`;
            } else if (estadoCamion.includes('COLA')) {
                estadoBadgeClass = 'warning';
                estadoText = '🟡 EN COLA (PORTERÍA)';
            } else if (estadoCamion.includes('PATIO')) {
                estadoBadgeClass = 'info';
                estadoText = '🔵 EN PATIO';
            }

            return `
                <div class="PORTTOS-popup-header">
                    <h3>🚛 ${placa}</h3>
                    <span class="PORTTOS-badge ${estadoBadgeClass}">${estadoText}</span>
                </div>
                <div class="PORTTOS-popup-body">
                    <div class="PORTTOS-row">
                        <span class="PORTTOS-label">👨‍✈️ Conductor:</span>
                        <span class="PORTTOS-value">${conductor}</span>
                    </div>
                    <div class="PORTTOS-row">
                        <span class="PORTTOS-label">💨 Velocidad:</span>
                        <span class="PORTTOS-value" style="color: ${velocidad > 0 ? '#38bdf8' : '#f1f5f9'};">${velocidad} km/h</span>
                    </div>
                    <div class="PORTTOS-row">
                        <span class="PORTTOS-label">🚚 Tipo:</span>
                        <span class="PORTTOS-value">${data.tipo_camion || 'Furgón'}</span>
                    </div>
                </div>
            `;
        }

        case 'peajes-individual': {
            const nombrePeaje = data.nombre || 'Punto de Control';
            let totalCamiones = 0;
            let incidentesCercanos = 0;
            let tieneIncidenteCritico = false;

            try {
                if (feature.geometry && feature.geometry.coordinates) {
                    const centroPeaje = turf.point(feature.geometry.coordinates);
                    const areaInfluencia = turf.buffer(centroPeaje, 2, { units: 'kilometers' });

                    if (areaInfluencia) {
                        if (ctx.ultimaFlotaGeoJson && ctx.ultimaFlotaGeoJson.features) {
                            ctx.ultimaFlotaGeoJson.features.forEach((camion: any) => {
                                if (camion.geometry && camion.geometry.coordinates) {
                                    if (
                                        turf.booleanPointInPolygon(
                                            turf.point(camion.geometry.coordinates),
                                            areaInfluencia as any
                                        )
                                    ) {
                                        totalCamiones++;
                                    }
                                }
                            });
                        }

                        if (ctx.ultimosIncidentes && ctx.ultimosIncidentes.features) {
                            ctx.ultimosIncidentes.features.forEach((inc: any) => {
                                if (inc.geometry && inc.geometry.coordinates) {
                                    if (
                                        turf.booleanPointInPolygon(
                                            turf.point(inc.geometry.coordinates),
                                            areaInfluencia as any
                                        )
                                    ) {
                                        incidentesCercanos++;
                                        if (inc.properties.nivelSeveridad >= 3) {
                                            tieneIncidenteCritico = true;
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            } catch (e) { }

            let estadoKpiP = 'VERDE';
            let colorHexP = '#22c55e';
            let estadoTextoP = 'Flujo Normal';

            if (tieneIncidenteCritico || totalCamiones >= 20) {
                estadoKpiP = 'ROJO';
                colorHexP = '#dc2626';
                estadoTextoP = 'Crítico / Congestión';
            } else if (incidentesCercanos > 0 || totalCamiones >= 5) {
                estadoKpiP = 'AMARILLO';
                colorHexP = '#facc15';
                estadoTextoP = 'Tráfico Denso';
            }

            return `
                <div class="custom-map-popup kpi" style="min-width: 200px;">
                    <div class="PORTTOS-popup-header" style="border-bottom: 2px solid ${colorHexP}; padding-bottom: 8px; margin-bottom: 8px;">
                        <h3 style="color:${colorHexP}; margin:0; font-size: 15px;">🏢 ${nombrePeaje}</h3>
                        <span class="PORTTOS-badge" style="background-color:${colorHexP}; color: ${estadoKpiP === 'AMARILLO' ? '#000' : '#fff'
                }; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-top: 5px; display: inline-block;">
                            ESTADO ${estadoKpiP}
                        </span>
                    </div>
                    <div class="PORTTOS-popup-body" style="font-size: 13px;">
                        <div style="margin-bottom: 4px;"><strong>🚦 Operación:</strong> ${estadoTextoP}</div>
                        <div style="margin-bottom: 4px;"><strong>🚛 Camiones en zona (2km):</strong> ${totalCamiones}</div>
                        <div style="margin-bottom: 4px;"><strong>⚠️ Incidentes cercanos:</strong> ${incidentesCercanos}</div>
                    </div>
                </div>
            `;
        }

        case 'clima-individual': {
            const fenomenoStr = data.fenomeno || 'Alerta Climática';
            const nivelAlertaStr = data.nivel || 'N/A';
            const dptoStr = data.departamento || 'No especificado';
            const munStr = data.municipio || 'No especificado';
            const detalleClima = data.descripcion || data.description || 'Sin descripción detallada.';
            const colorClima = '#8b5cf6';

            return `
                <div class="custom-map-popup" style="padding: 16px; min-width: 260px;">
                    <div class="qplus-popup-header" style="border-bottom: 2px solid ${colorClima}; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="color: ${ctx.isDark ? '#f8fafc' : '#1e293b'}; margin:0; font-size: 14px; font-weight: bold; flex: 1; padding-right: 10px; line-height: 1.2;">
                            ☁️ ${fenomenoStr.toUpperCase()}
                        </h3>
                        <span class="qplus-badge" style="background-color: ${colorClima}; color: #ffffff; border-radius: 4px; padding: 4px 8px; font-size: 10px; font-weight: bold; flex-shrink: 0; text-align: center;">
                            NIVEL ${nivelAlertaStr.toUpperCase()}
                        </span>
                    </div>
                    <div class="qplus-popup-body" style="font-size: 13px; color: ${ctx.isDark ? '#cbd5e1' : '#64748b'
                };">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>📍 Ubicación:</span>
                            <span style="font-weight: 600; color: ${ctx.isDark ? '#f8fafc' : '#0f172a'
                }; text-align: right;">
                                ${munStr}, ${dptoStr}
                            </span>
                        </div>
                        <div style="margin-top: 10px; border-top: 1px solid #334155; padding-top: 10px; font-style: italic; text-transform: capitalize; color: ${ctx.isDark ? '#94a3b8' : '#475569'
                };">
                            ${detalleClima}
                        </div>
                    </div>
                </div>
            `;
        }

        default:
            return `<div class="custom-map-popup"><h3>Información</h3></div>`;
    }
}

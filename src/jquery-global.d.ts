// jQuery es global (lo carga angular.json → scripts, lo usa DataTables). Antes sus tipos llegaban con @types/datatables.net,
// que salió con DataTables 2 (OT-035 fase 1). Aquí se declara sin tipos para no volver a depender de @types/jquery.
declare const $: any;
declare module 'jquery';

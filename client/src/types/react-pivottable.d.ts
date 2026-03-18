declare module 'react-pivottable/PivotTableUI' {
    import { ComponentType } from 'react';
    const PivotTableUI: ComponentType<any>;
    export default PivotTableUI;
}

declare module 'react-pivottable/TableRenderers' {
    const TableRenderers: any;
    export default TableRenderers;
}

declare module 'react-pivottable/PlotlyRenderers' {
    const createPlotlyRenderers: (Plot: any) => any;
    export default createPlotlyRenderers;
}

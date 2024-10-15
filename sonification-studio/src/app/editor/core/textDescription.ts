import { GenericObject } from './utils/objects';

function removeRedundantNumberPrecision(str: string): string {
    return str.replace(/\.0+(\D)/g, '$1');
}


function getNumericalColumn(columnData: Array<string>) {
    const numerical: Array<number|null> = [];
    let lastValueIx = 0;

    for (const cell of columnData) {
        if (cell === null || !cell.trim()) {
            numerical.push(null);
        } else {
            if (isNaN(cell as any)) {
                return null;
            }
            lastValueIx = numerical.push(parseFloat(cell));
        }
    }

    if (!lastValueIx) {
        return null;
    }

    return numerical.slice(0, lastValueIx);
}


function describeStringColumn(columnData: Array<string>): string {
    const rowsWithData = columnData.filter((cell): boolean => !!cell.trim());
    const numRows = rowsWithData.length;

    if (!numRows) {
        return 'Column is empty.';
    }

    return `Column contains category data with ${numRows} ${numRows === 1 ? 'row' : 'rows'}`;
}


function describeNumericalColumn(columnData: Array<number|null>): string {
    const rowsWithData = columnData.filter((cell): boolean => cell !== null) as number[];
    const numRows = rowsWithData.length;
    const valToPrecision = (x: number): string => x.toPrecision(4);
    const minVal = Math.min(...rowsWithData);
    const maxVal = Math.max(...rowsWithData);
    const avgVal = rowsWithData.reduce((a, b) => a + b, 0) / numRows;
    const numRowsDescription =
        `Column contains numerical data with ${numRows} ${numRows === 1 ? 'row' : 'rows'}`;
    const firstLastDescription =
        `The first value is ${rowsWithData[0]} and the last value is ${rowsWithData[numRows - 1]}`;
    const minMaxDescription =
        `Minimum: ${valToPrecision(minVal)}, maximum: ${valToPrecision(maxVal)}`;
    const avgDescription =
        `The average is ${valToPrecision(avgVal)}`;

    return removeRedundantNumberPrecision([
        numRowsDescription,
        firstLastDescription,
        minMaxDescription,
        avgDescription
    ].join('. ') + '.');
}


/**
 * Create text description for a column with data.
 */
export function describeTable(table: GenericObject): string {
    const descriptions = [];
    for (const [columnName, columnData] of Object.entries(table)) {
        const numerical = getNumericalColumn(columnData);
        const columnDesc = numerical ? describeNumericalColumn(numerical) : describeStringColumn(columnData);
        descriptions.push(columnName + ': ' + columnDesc);
    }

    return descriptions.join('\n');
}

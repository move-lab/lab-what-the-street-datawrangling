var allowedUnits = ['km/h', 'nmi', 'mi', 'mph', 'km', 'm', 'knots', '\'"', 't', 'kg'];
// var convertAllowedUnits = {
//     'km/h': 1,
//     'nmi': 1852,
//     'mi': 1609.34,
//     'mph': 1.60934,
//     'km': 1000,
//     'm': 1,
//     'knots': 1.852,
//     't': 907.185,
//     'kg': 1
// }

var defaultDecimals = 2;


function returnValidUnit(value) {
    value = value.replace(',', '.');
    value = value.replace('  ', ' ');
    value = value.trim();
    value = addMissingZeroToFeetOrInch(value);

    //kmh fixes
    value = value.replace('kmh', 'km/h');
    value = value.replace('km h', 'km/h');

    //mph fixes
    value = value.replace('mp/h', 'mph');
    value = value.replace('mp h', 'mph');

    if (!isNaN(value)) {
        // Value is only a number -> correct
        return value;
    } else if (value === 'narrow') {
        return null;
    } else if (checkIfOnlyValidUnitsAreUsed(value)) {
        return addOrRemoveUnitSpaces(value);
    } else {
        return null;
    }
}

function addMissingZeroToFeetOrInch(value) {
    var testValue = value.replace(/ /g, '');
    testValue = testValue.replace(/\./g, '');
    testValue = testValue.replace(/[0-9]/g, '');

    if (testValue === "'") {
        value = value.replace(/ /g, '');
        value += '0"';
        return value;
    } else if (testValue === '"') {
        value = value.replace(/ /g, '');
        value = "0'" + value;
        return value;
    } else {
        return value;
    }
}

function checkIfOnlyValidUnitsAreUsed(value) {
    value = value.replace(/ /g, '');
    value = value.replace(/\./g, '');
    value = value.replace(/[0-9]/g, '');

    if (value === '') {
        // No units are used
        return true;
    } else {
        for (var i = 0; i < allowedUnits.length; i++) {
            var allowedUnit = allowedUnits[i];
            if (value.includes(allowedUnit)) {
                value = value.replace(allowedUnit, '');
                if (value === '') {
                    return true
                } else {
                    return false;
                }
            }
        }
    }
}

function addOrRemoveUnitSpaces(value) {
    for (var i = 0; i < allowedUnits.length; i++) {
        var allowedUnit = allowedUnits[i];
        if (value.includes(allowedUnit) && !value.includes(' ' + allowedUnit)) {
            return value.replace(allowedUnit, ' ' + allowedUnit);
        }
    }

    // Remove space after '
    if (value.includes("' ")) {
        return value.replace("' ", "'");
    }
    return value;
}

function simplifyUnits(value, measure) {
    switch (measure) {
        case 'length':
            return value.replace(' m', '');
            break;

        case 'distance':
            return value.replace(' km', '');
            break;

        case 'speed':
            return value.replace(' km/h', '');
            break;

        case 'weight':
            return value.replace(' t', '');
            break;
    }
}

function convertToDefaultUnits(value, measure) {
    measure = measure;
    value = returnValidUnit(value);

    // Not a valid unit
    if (value === null) {
        return null;
    }

    // Is already dafault unit
    if (!isNaN(value)) {
        return Number(value);
    }

    switch (measure) {
        case 'length':
            return convertToMeter(value) / 1000;
            break;

        case 'distance':
            return convertToMeter(value);
            break;

        case 'speed':
            return convertToKmH(value);
            break;

        case 'weight':
            return convertToKg(value);
            break;
    }
    return null;
}

function convertToKg(value, decimals) {
    decimals = decimals || defaultDecimals;
    var unit = detectUnit(value);
    if (unit === null) {
        return null;
    }
    value = value.replace(' ' + unit, '');
    switch (unit) {
        case 'kg':
            if (isNaN(value)) {
                return null;
            }
            return Number(value);
            break;
        case 't':
            if (isNaN(value)) {
                return null;
            }
            return Number(value) * 907.18;
            break;
        default:
            return null;
            break;
    }
}

function convertToKmH(value, decimals) {
    decimals = decimals || defaultDecimals;
    var unit = detectUnit(value);
    if (unit === null) {
        return null;
    }
    value = value.replace(' ' + unit, '');
    switch (unit) {
        case 'km/h':
            if (isNaN(value)) {
                return null;
            }
            return Number(value);
            break;

        case 'mph':
            if (isNaN(value)) {
                return null;
            }
            return Number(value) * 1.61;
            break;

        case 'knots':
            if (isNaN(value)) {
                return null;
            }
            return Number(value) * 1.85;
            break;

        default:
            return null;
            break;
    }
}

function convertToMeter(value, decimals) {
    decimals = decimals || defaultDecimals;
    var unit = detectUnit(value);
    value = value.replace(' ' + unit, '');
    switch (unit) {
        case 'km':
            if (isNaN(value)) {
                return null;
            }
            return Number(value) * 1000;
            break;
        case 'm':
            if (isNaN(value)) {
                return null;
            }
            return Number(value);
            break;
        case 'mi':
            if (isNaN(value)) {
                return null;
            }
            var meters = Number(value) * 1609.34;
            return roundToDecimals(meters, decimals);
            break;
        case 'nmi':
            if (isNaN(value)) {
                return null;
            }
            var meters = Number(value) * 1852;
            return roundToDecimals(meters, decimals);
            break;
        case 'feet':
            var feet = value.replace('"', '').split("'")[0];
            var inches = value.replace('"', '').split("'")[1];
            if (isNaN(feet) || isNaN(inches)) {
                return null;
            }
            var meters = Number(feet) * 0.3048 + Number(inches) * 0.025;
            return roundToDecimals(meters, decimals);
            break;
        default:
            return null;
            break;
    }
}

function roundToDecimals(value, numberOfDecimals) {
    var divide = Math.pow(10, numberOfDecimals);
    var roundedValue = Math.round(value * divide) / divide;
    return roundedValue;
}

function detectUnit(value) {
    var split = value.split(' ');
    if (split.length === 1) {
        // probably feet + inch
        if (value.includes('\'') || value.includes('"')) {
            return 'feet';
        } else {
            return null;
        }
    } else if (split.length === 2) {
        var unit = split[1];
        return unit;
    } else if (split.length > 2) {
        return null;
    }
    return null;
}

module.exports = {
    returnValidUnit: returnValidUnit,
    simplifyUnits: simplifyUnits,
    checkIfOnlyValidUnitsAreUsed: checkIfOnlyValidUnitsAreUsed,
    convertToDefaultUnits: convertToDefaultUnits
}
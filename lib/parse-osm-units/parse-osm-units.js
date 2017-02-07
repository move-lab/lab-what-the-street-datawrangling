var allowedUnits = ['km/h', 'nmi', 'mi', 'mph', 'km', 'm', 'knots', '\'"', 't', 'kg'];
var convertAllowedUnits = { 
	'km/h': 1, 
	'nmi': 1852, 
	'mi': 1609.34, 
	'mph': 1.60934, 
	'km': 1000, 
	'm': 1, 
	'knots' 1.852, 
	't': 907.185,
	'kg': 1
}

function returnValidUnit(value) {
    value = value.replace(',', '.');
    value = value.replace('  ', ' ');
    value = value.trim();
    value = addMissingZeroToFeetOrInch(value);

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
    value = returnValidUnit(value);
    if (!isNaN(value)) {
        // Is already dafault unit
        return value;
    }


    switch (measure) {
        case 'length':
            break;

        case 'distance':
            break;

        case 'speed':
            break;

        case 'weight':
            break;
    }
    return null;
}

function convertFromTo(argument) {

}

function detectUnit(value) {
    var split = value.split(' ');
    if (split.length == 1) {
        // probably feet + inch
        if (value.contains('\'') || value.contains('"')) {
            return 'feet';
        }else{
            return null;
        }
    } else if (split.length == 2) {
        var unit = split[1];
        return unit;
    } else if (split.length > 2) {
        return null;
    }
}

module.exports = {
    returnValidUnit: returnValidUnit,
    simplifyUnits: simplifyUnits,
    checkIfOnlyValidUnitsAreUsed: checkIfOnlyValidUnitsAreUsed,
    convertToDefaultUnits: convertToDefaultUnits
}
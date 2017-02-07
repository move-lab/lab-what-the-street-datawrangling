var chai = require('chai');
var expect = chai.expect;
var parseOsmUnits = require('./parse-osm-units')

describe('Ideal Behaviour', function() {
    it('Number should be returned as is', function() {
        var input = '560';
        var output = input;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });
});


describe('Invalid formatting should return null', function() {
    it('Narrow should return null', function() {
        var input = 'narrow';
        var output = null;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"sdlkfndfgkn" should return null', function() {
        var input = 'sdlkfndfgkn';
        var output = null;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"small" should return null', function() {
        var input = 'small';
        var output = null;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"106mm" should return null', function() {
        var input = '106mm';
        var output = null;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"20feet" should return null', function() {
        var input = '20feet';
        var output = null;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"20inches" return null', function() {
        var input = '20inches';
        var output = null;
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });
});

describe('Space typos should return valid units', function() {
    it('" 235 m  " -> "235 m"', function() {
        var input = ' 235 m  ';
        var output = '235 m';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"264 m     " -> "264 m"', function() {
        var input = '264 m     ';
        var output = '264 m';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"264  m     " -> "264 m"', function() {
        var input = '264  m     ';
        var output = '264 m';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });
});

describe('Check for valid units', function() {
    it('m   - is valid', function() {
        var input = '560m';
        var parsedValue = parseOsmUnits.checkIfOnlyValidUnitsAreUsed(input);
        expect(parsedValue).to.equal(true);
    });

    it('mm - is not valid', function() {
        var input = '560mm';
        var parsedValue = parseOsmUnits.checkIfOnlyValidUnitsAreUsed(input);
        expect(parsedValue).to.equal(false);
    });
});

describe('Format units properly', function() {
    it('Fix malformatted feet + inches - 5\' -> 5\'0"', function() {
        var input = '5\'';
        var output = '5\'0"';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('Fix malformatted feet + inches - 5" -> 0\'5"', function() {
        var input = '5"';
        var output = '0\'5"';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('Comma should be replaced with a period', function() {
        var input = '560,7 m';
        var output = '560.7 m';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('m     - Missing space before unit should be added', function() {
        var input = '560m';
        var output = '560 m';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('km    - Missing space before unit should be added', function() {
        var input = '560km';
        var output = '560 km';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('t     - Missing space before unit should be added', function() {
        var input = '560t';
        var output = '560 t';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('mi    - Missing space before unit should be added', function() {
        var input = '560mi';
        var output = '560 mi';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('km/h  - Missing space before unit should be added', function() {
        var input = '560km/h';
        var output = '560 km/h';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('nmi   - Missing space before unit should be added', function() {
        var input = '560nmi';
        var output = '560 nmi';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('mph   - Missing space before unit should be added', function() {
        var input = '560mph';
        var output = '560 mph';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('kg    - Missing space before unit should be added', function() {
        var input = '560kg';
        var output = '560 kg';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('knots - Missing space before unit should be added', function() {
        var input = '560knots';
        var output = '560 knots';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('feet  - Space should be removed', function() {
        var input = '12\' 5"';
        var output = '12\'5"';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });
});


describe('Strip unnecessary units', function() {
    it('km   - should be stripped from distances', function() {
        var parsedValue = parseOsmUnits.simplifyUnits('5 km', 'distance');
        expect(parsedValue).to.equal('5');
    });

    it('m    - should be stripped from lengths', function() {
        var parsedValue = parseOsmUnits.simplifyUnits('5 m', 'length');
        expect(parsedValue).to.equal('5');
    });

    it('km/h - should be stripped from speeds', function() {
        var parsedValue = parseOsmUnits.simplifyUnits('5 km/h', 'speed');
        expect(parsedValue).to.equal('5');
    });

    it('t    - should be stripped from weights', function() {
        var parsedValue = parseOsmUnits.simplifyUnits('5 t', 'weight');
        expect(parsedValue).to.equal('5');
    });
});

describe('Convert unit', function() {
    it('Distance 5 -> 5', function() {
        var input = '5';
        var output = input;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });

    it('Distance 5km -> 5000 m', function() {
        var input = '5km';
        var output = '5000 m';
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });
});
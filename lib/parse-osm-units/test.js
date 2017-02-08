var chai = require('chai');
var expect = chai.expect;
var parseOsmUnits = require('./parse-osm-units');

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
    it('" 235 m  "    -> "235 m"', function() {
        var input = ' 235 m  ';
        var output = '235 m';
        var parsedValue = parseOsmUnits.returnValidUnit(input);
        expect(parsedValue).to.equal(output);
    });

    it('"264 m     "  -> "264 m"', function() {
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
    it('\'m\'  is valid', function() {
        var input = '560m';
        var parsedValue = parseOsmUnits.checkIfOnlyValidUnitsAreUsed(input);
        expect(parsedValue).to.equal(true);
    });

    it('\'mm\' is not valid', function() {
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

describe('Convert distance units', function() {
    it('Distance: 5       -> 5', function() {
        var input = '5';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });

    it('Distance: 5km     -> 5000', function() {
        var input = '5km';
        var output = 5000;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });

    it('Distance: 5nmi    -> 9260', function() {
        var input = '5nmi';
        var output = 9260;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });

    it('Distance: 5.7mi   -> 9173.24', function() {
        var input = '5.7mi';
        var output = 9173.24;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });

    it('Distance: 15\'4"   -> 4.67', function() {
        var input = '15\'4"';
        var output = 4.67;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });

    it('Distance: 15mph   -> null (not a distance)', function() {
        var input = '15mph';
        var output = null;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'distance');
        expect(parsedValue).to.equal(output);
    });
});

describe('Convert length units', function() {
    it('Length:   5       -> 5', function() {
        var input = '5';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'length');
        expect(parsedValue).to.equal(output);
    });

    it('Length:   5km     -> 5', function() {
        var input = '5km';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'length');
        expect(parsedValue).to.equal(output);
    });

    it('Length:   5nmi    -> 9.26', function() {
        var input = '5nmi';
        var output = 9.26;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'length');
        expect(parsedValue).to.equal(output);
    });

    it('Length:   5.7mi   -> 9.17324', function() {
        var input = '5.7mi';
        var output = 9.17324;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'length');
        expect(parsedValue).to.equal(output);
    });

    it('length:   15\'4"   -> 0.00467', function() {
        var input = '15\'4"';
        var output = 0.00467;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'length');
        expect(parsedValue).to.equal(output);
    });

    it('length:   15sdf"  -> null', function() {
        var input = '15sdf';
        var output = null;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'length');
        expect(parsedValue).to.equal(output);
    });
});

describe('Convert speed units', function() {
    it('Speed:    5       -> 5', function() {
        var input = '5';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });

    it('Speed:    5km/h   -> 5', function() {
        var input = '5km/h';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });

    it('Speed:    5kmh    -> 5', function() {
        var input = '5kmh';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });

    it('Speed:    5mph    -> 8.05', function() {
        var input = '5mph';
        var output = 8.05;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });

    it('Speed:    5knots  -> 9.26', function() {
        var input = '5knots';
        var output = 9.25;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });

    it('Speed:    5km     -> null (not a speed)', function() {
        var input = '5km';
        var output = null;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });

    it('Speed:    5sdf    -> null (not a speed)', function() {
        var input = '5sdf';
        var output = null;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'speed');
        expect(parsedValue).to.equal(output);
    });
});

describe('Convert weight units', function() {
    it('Weight:    5      -> 5', function() {
        var input = '5';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'weight');
        expect(parsedValue).to.equal(output);
    });

    it('Weight:    5kg    -> 5', function() {
        var input = '5kg';
        var output = 5;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'weight');
        expect(parsedValue).to.equal(output);
    });

    it('Weight:    5t     -> 4535.9', function() {
        var input = '5t';
        var output = 4535.9;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'weight');
        expect(parsedValue).to.equal(output);
    });

    it('Weight:    5sdf   -> null', function() {
        var input = '5sdf';
        var output = null;
        var parsedValue = parseOsmUnits.convertToDefaultUnits(input, 'weight');
        expect(parsedValue).to.equal(output);
    });
});
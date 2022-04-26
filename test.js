'use strict';

const deepequal = require('deepequal');
const parse = require('./index');
const util = require('util');

const validETagChars = Buffer.from(
        [ 0x21, ...range(0x23, 0x7e), ...range(0x80, 0xff) ]
    ).toString('latin1');

const nonErrorTestCases = [
    [
        '""',
        [
            { eTag: '', weak: false }
        ]
    ],
    [
        'W/""',
        [
            { eTag: '', weak: true }
        ]
    ],
    [
        '"abc"',
        [
            { eTag: 'abc', weak: false }
        ]
    ],
    [
        '"abc","bcd"',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: false }
        ]
    ],
    [
        '"abc", "bcd"',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: false }
        ]
    ],
    [
        '"abc", "bcd", "cde"',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: false },
            { eTag: 'cde', weak: false }
        ]
    ],
    [
        ' "abc", "bcd", "cde" ',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: false },
            { eTag: 'cde', weak: false }
        ]
    ],
    [
        '\t"abc", "bcd", "cde"\t',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: false },
            { eTag: 'cde', weak: false }
        ]
    ],
    [
        'W/"abc", "bcd", "cde"',
        [
            { eTag: 'abc', weak: true },
            { eTag: 'bcd', weak: false },
            { eTag: 'cde', weak: false }
        ]
    ],
    [
        '"abc", W/"bcd", "cde"',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: true },
            { eTag: 'cde', weak: false }
        ]
    ],
    [
        '"abc", "bcd", W/"cde"',
        [
            { eTag: 'abc', weak: false },
            { eTag: 'bcd', weak: false },
            { eTag: 'cde', weak: true }
        ]
    ],
    [
        'W/"abc", W/"bcd", W/"cde"',
        [
            { eTag: 'abc', weak: true },
            { eTag: 'bcd', weak: true },
            { eTag: 'cde', weak: true }
        ]
    ],
    [
        '*',
        [
            { star: true }
        ]
    ],
    [
        '"*"',
        [
            { eTag: '*', weak: false }
        ]
    ],
    [
        'W/"*"',
        [
            { eTag: '*', weak: true }
        ]
    ],
    [
        `"${validETagChars}"`,
        [
            { eTag: validETagChars, weak: false }
        ]
    ]
];

const errorTestCases = [
    '',                 // No ETag
    ' ',                // No ETag (but valid whitespace #1)
    '\t',               // No ETag (but valid whitespace #2)
    'abc',              // No quotes
    '"abc',             // No closing quote
    '"abc",\n"bce"',    // Newline separator
    '"a\"bc"',          // Attempt at escaped quote
    '"a c"',            // Illegal character in quotes
    '"abc" "def"',      // No comma
    '"abc",,"def"',     // Double comma
    'W/*',              // Weak star
    '*, "abc"',         // Star and something else
    '"abc", *',         // Something else and star
    'W/*, "abc"',       // Weak star and something else
    '"abc", W/*',       // Something else and weak star
    ',"abc"',           // Comma prefix
    '"abc",',           // Comma suffix
];

for (const [input, expected] of nonErrorTestCases) {
    const actual = parse(input);
    if (!deepequal(expected, actual)) {
        throw new Error(`For input '${input}' expected `
                + `${util.inspect(expected)} but got ${util.inspect(actual)}`);
    }
}

for (const input of errorTestCases) {
    let e;
    let actual;
    try {
        actual = parse(input);
    }
    catch (e) {
        if (e.code !== 'PARSE_ERROR') {
            throw new Error('Unexpected error: ' + e);
        }
    }

    if (actual) {
        throw new Error(`For input '${input}', expected an error, but got `
                + `${util.inspect(actual)}`);
    }
}

console.log('All tests succeeded!');

function range(n1, n2) {
    let result = [];
    for (let i = n1; i <= n2; i++) {
        result.push(i);
    }
    return result;
}

'use strict';

const internalChar = /^\x21|[\x23-\x7E]|[\x80-\xFF]$/;
const whitespace = /^[ \t]$/;

module.exports = str => {
    const results = [];

    let expect;
    let quotedMaterialStart;
    let starPresent;
    let weak = false;
    let comma = false;

    let i = 0;
    for (const c of str) {
        if (quotedMaterialStart) {
            if (c === '"') {
                results.push({
                    eTag: str.substring(quotedMaterialStart, i),
                    weak
                });

                quotedMaterialStart = null;
                weak = false;
            }
            else {
                if (!internalChar.test(c)) {
                    throw parseError('Unexpected character inside quoted ETag: '
                            + c + ` (\\x${Buffer.from([c.codePointAt(0)]).toString('hex')})`);
                }
            }
        }
        else if (whitespace.test(c)) {
            // Do nothing.
        }
        else if (expect) {
            expect(c);
            expect = null;
        }
        else {
            switch (c) {
                case ',': {
                    if (results.length === 0 || comma) {
                        throw parseError(`Expected '"', "W", or "*", found: ,`);
                    }

                    comma = true;
                    break;
                }
                case '*': {
                    if (weak) {
                        throw parseError(
                                '"*" precondition may not be flagged weak');
                    }

                    if (results.length > 0 && comma) {
                        throw parseError('Expected ",", found "*".')
                    }

                    comma = false;
                    results.push({
                        star: true
                    });
                    starPresent = true;
                    break;
                }
                case '"': {
                    if (results.length > 0 && !comma) {
                        throw parseError('Expected ",", found \'"\'.')
                    }

                    comma = false;
                    quotedMaterialStart = i + 1;
                    break;
                }
                case 'W': {
                    weak = true;
                    expect = c => {
                        if (c !== '/') {
                            throw parseError(`Expected "/", found: "${c}".`);
                        }

                        expect = c => {
                            if (c !== '\"') {
                                throw parseError(
                                        `Expected '\"', found: "${c}".`);
                            }

                            quotedMaterialStart = i + 1;
                        };
                    }
                    break;
                }
                default: {
                    throw parseError(
                            `Expected '"', "W", or "*", found: ${c}`);
                    break;
                }
            }
        }

        i++;
    }

    if (results.length === 0 || expect || comma) {
        throw parseError('Unexpected end-of-input');
    }

    if (quotedMaterialStart) {
        throw parseError('Unclosed quoted ETag');
    }

    if (starPresent && results.length > 1) {
        throw parseError(
                'If "*" ETag precondition is present, it must be alone');
    }

    return results;
};

function parseError(msg) {
    const e = new Error(msg);
    e.code = 'PARSE_ERROR';
    return e;
}

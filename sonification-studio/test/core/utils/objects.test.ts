import {
    deepClone,
    deepFreeze,
    setNestedChildProp
} from '../../../src/app/editor/core/utils/objects';

describe('setNestedChildProp tests', () => {
    test('Setting single prop on empty object', () => {
        const empty = {};
        setNestedChildProp(empty, 'a', 1);
        expect(empty).toEqual({ a: 1 });
    });

    test('Setting single prop on non-empty object', () => {
        const obj = { a: 3 };
        setNestedChildProp(obj, 'b', 1);
        expect(obj).toEqual({ a: 3, b: 1 });
    });

    test('Modifying single prop', () => {
        const obj = { a: 3 };
        setNestedChildProp(obj, 'a', 1);
        expect(obj).toEqual({ a: 1 });
    });

    test('Setting nested prop on empty object', () => {
        const empty = {};
        setNestedChildProp(empty, 'a.b.c', 1);
        expect(empty).toEqual({ a: { b: { c: 1 } } });
    });

    test('Setting nested prop on non-empty object', () => {
        const obj = { d: { e: 3 }};
        setNestedChildProp(obj, 'a.b.c', 1);
        expect(obj).toEqual({ d: { e: 3 }, a: { b: { c: 1 } } });
    });

    test('Setting nested prop on existing object', () => {
        const obj = { a: { b: { c: { d: 5 } } } };
        setNestedChildProp(obj, 'a.b.f', 1);
        expect(obj).toEqual({ a: { b: { f: 1, c: { d: 5 } } } });
    });

    test('Modifying nested prop on existing object', () => {
        const obj = { a: { b: { c: { d: 5 } } } };
        setNestedChildProp(obj, 'a.b.c.d', 1);
        expect(obj).toEqual({ a: { b: { c: { d: 1 } } } });
        setNestedChildProp(obj, 'a.b.c', 2);
        expect(obj).toEqual({ a: { b: { c: 2 } } });
    });
});

describe('deepFreeze tests', () => {
    const testIllegalOperation = (obj: any, illegal: (param: any) => void): void => {
        const frozen = deepFreeze(obj);
        expect(() => illegal(frozen)).toThrow();
    };

    test('Given frozen object, can not add prop', () => {
        testIllegalOperation(
            {},
            o => o.a = 1
        );
    });

    test('Given frozen object, can not modify prop', () => {
        testIllegalOperation(
            { a: 1 },
            o => o.a = 2
        );
    });

    test('Given frozen object, can not modify array prop', () => {
        testIllegalOperation(
            { a: [0] },
            o => o.a.push(1)
        );
    });

    test('Given frozen object, can not modify function prop', () => {
        testIllegalOperation(
            { a(): void { return; } },
            o => o.a.prototype = {}
        );
    });

    test('Given frozen object, can not modify object prop', () => {
        testIllegalOperation(
            { a: { b: { c: 1 } } },
            o => o.a.b.c = 2
        );
    });

    test('Integration test', () => {
        testIllegalOperation(
            { a: { b: { c: [6, 5, 3, 1, 0, 2] } } },
            o => o.a.b.c.sort()
        );
    });
});

describe('deepClone tests', () => {
    const isEqual = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);
    const modifyObject = (o: any) => {
        const names = Object.getOwnPropertyNames(o);
        names.forEach(prop => {
            const val = o[prop];
            if (Array.isArray(val)) {
                val.push(42);
            } else if (typeof val === 'object' && val !== null) {
                modifyObject(val);
            } else {
                o[prop] = null;
            }
        });
        if (!names.length) {
            o.__newProp__ = 1;
        }
    };
    const isClone = (a: object, b: object) => {
        if (!isEqual(a, b)) {
            return false;
        }
        deepFreeze(a);
        modifyObject(b);
        return !isEqual(a, b);
    };
    const testClone = (o: object) => {
        expect(isClone(o, deepClone(o))).toBe(true);
    };

    test('Clones empty object', () => {
        testClone({});
    });

    test('Clones simple object', () => {
        const func = () => void 0;
        testClone({
            a: 1,
            b: null,
            c: 'str',
            d: true,
            e: func
        });
    });

    test('Clones object with objects', () => {
        testClone({
            a: {
                b: {
                    c: {
                        d: 1,
                        e: 'str'
                    }
                }
            }
        });
    });

    test('Clones object with array', () => {
        testClone({
            a: {
                b: {
                    c: {
                        d: [1, 2, 3, 4]
                    }
                }
            }
        });
    });

    test('Clones array with objects', () => {
        testClone([
            { a: 1 },
            { a: 2 },
            { a: 3 }
        ]);
    });

    test('Clones array with nested objects', () => {
        testClone([
            { a: { b: { c: 1 } } },
            { a: { b: { c: 'str' } } },
            { a: { b: { c: null } } }
        ]);
    });

    test('Clones object with nested arrays', () => {
        testClone({
            a: [1, 2, [1, 2, 3, [1, 2, 3, 4]]]
        });
    });

    test('Clones object with arrays with nested objects', () => {
        testClone({
            a: [
                { d: { e: { f: 'str' } } }
            ]
        });
    });

    test('Clones object with nested arrays and objects', () => {
        testClone({
            a: [[
                [[{ d: { e: { f: [{ a: 'str'}] } } }]]
            ]]
        });
    });

    test('Clones big array', () => {
        const arr = [];
        for (let i = 0; i < 10000; ++i) {
            arr.push({
                a: [[1, 2, 3, 4, { b: { c: { d: 5 } } }]],
                b: [[[5, 6, { a: 7 }]]]
            });
        }
        testClone(arr);
    });

    test('Clones date', async () => {
        function waitMs(ms: number): Promise<void> {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        const initialDate = new Date();
        await waitMs(200);
        const clone = deepClone({ a: initialDate });
        expect(isEqual(clone, { a: initialDate })).toBe(true);
        testClone({ a: [initialDate] });
    });
});

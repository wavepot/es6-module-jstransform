/* jshint esnext:true */
var foo2;
export default 42;
export default function () {}
export default function foo() {}
export default class {}
export default class Foo {}
export default {};
export default [];
export default foo2;
export default value2 = 1;

export default class A {
  method() {
    return 1;
  }
}

var x = 'should be on 13th line';

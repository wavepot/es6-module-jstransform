/* jshint esnext:true */
var foo2;
module.exports["default"] = 42;
module.exports["default"] = function () {}
function foo() {} module.exports["default"] = foo
module.exports["default"] = (function(){function ____Class1(){"use strict";}return ____Class1;})()
function Foo(){"use strict";} module.exports["default"] = Foo
module.exports["default"] = {};
module.exports["default"] = [];
module.exports["default"] = foo2;
var value2 = module.exports["default"] = 1;

function A(){"use strict";}
  A.prototype.method=function() {"use strict";
    return 1;
  };
 module.exports["default"] = A

for(var B____Key in B){if(B.hasOwnProperty(B____Key)){A[B____Key]=B[B____Key];}}var ____SuperProtoOfB=B===null?null:B.prototype;A.prototype=Object.create(____SuperProtoOfB);A.prototype.constructor=A;A.__superConstructor__=B;function A(){"use strict";if(B!==null){B.apply(this,arguments);}}
  A.prototype.method=function() {"use strict";
    return 1;
  };
 module.exports["default"] = A

var x = 'should be on 13th line';

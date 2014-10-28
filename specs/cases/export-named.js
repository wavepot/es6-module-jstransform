/* jshint esnext:true */
export {foo};
export {foo, bar};
export {foo as bar};
export {foo as bar, bar as baz};
export {foo as default};
export {foo as default, bar};

export {
  x as a,
  y as b
};

var should = "be on 11th line";

// the following aren't supported anymore
//export x = 11;
/*
export x = class A {

  render() {
    return 1;
  }
}
*/

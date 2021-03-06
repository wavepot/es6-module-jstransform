'use strict';

var assert  = require('assert');
var Syntax  = require('esprima-fb').Syntax;
var utils   = require('jstransform/src/utils');

/**
 * Visit ImportDeclaration.
 *
 * Examples:
 *
 *    import "module"
 *    import name from "module"
 *    import { name, one as other } from "module"
 */
function visitImportDeclaration(traverse, node, path, state) {
  var specifier, name;
  utils.catchup(node.range[0], state);
  var modID;
  if (node.specifiers.length === 0) {
    utils.append('require(' + node.source.raw + ');', state);
  }
  else if (node.specifiers.length === 1) {
    specifier = node.specifiers[0];
    name = specifier.name ? specifier.name.name : specifier.id.name;
    modID = 'require(' + node.source.raw + ')';
    switch (specifier.type) {
          case Syntax.ImportDefaultSpecifier:
            utils.append('var ' + name + ' = ' + modID +  '["default"];', state);
            break;
          case Syntax.ImportNamespaceSpecifier:
            utils.append('var ' + name + ' = ' + modID + ';', state);
            break;
          case Syntax.ImportSpecifier:
            utils.append('var ' + name + ' = ' + modID + '.' + specifier.id.name + ';', state);
            break;
            
      }
  }
  else {
    modID = genID('mod');
    utils.append('var ' + modID + ' = require(' + node.source.raw + ');', state);
    for (var i = 0, len = node.specifiers.length; i < len; i++) {
      specifier = node.specifiers[i];
      utils.catchupNewlines(specifier.range[0], state);
      name = specifier.name ? specifier.name.name : specifier.id.name;
      
      switch (specifier.type) {
          case Syntax.ImportDefaultSpecifier:
            utils.append('var ' + name + ' = ' + modID +  '["default"];', state);
            break;
          case Syntax.ImportNamespaceSpecifier:
            utils.append('var ' + name + ' = ' + modID + ';', state);
            break;
          case Syntax.ImportSpecifier:
            utils.append('var ' + name + ' = ' + modID + '.' + specifier.id.name + ';', state);
            break;
            
      }
      
    }
  }
  

  
  /*
  switch (node.kind) {

    // import "module"
    case undefined:
      utils.append('require(' + node.source.raw + ');', state);
      break;

    // import name from "module"
    case "default":
      specifier = node.specifiers[0];
      assert(specifier, "default import without specifier: " + node);
      name = specifier.name ? specifier.name.name : specifier.id.name;
      utils.append('var ' + name + ' = require(' + node.source.raw + ');', state);
      break;

    // import {name, one as other} from "module"
    case "named":
      var modID;

      if (node.specifiers.length === 1) {
        modID = 'require(' + node.source.raw + ')';
      } else {
        modID = genID('mod');
        utils.append('var ' + modID + ' = require(' + node.source.raw + ');', state);
      }

      for (var i = 0, len = node.specifiers.length; i < len; i++) {
        specifier = node.specifiers[i];
        utils.catchupNewlines(specifier.range[0], state);
        name = specifier.name ? specifier.name.name : specifier.id.name;
        utils.append('var ' + name + ' = ' + modID + '.' + specifier.id.name + ';', state);
      }

      break;

    default:
      assert(false, "don't know how to transform: " + node.kind);
  }
  */

  utils.catchupNewlines(node.range[1], state);
  //utils.move(node.range[1], state);
  return false;
}

visitImportDeclaration.test = function(node, path, state) {
  return node.type === Syntax.ImportDeclaration;
};

/**
 * Visit ExportDeclaration.
 *
 * Examples:
 *
 *    export default = value
 *    export default;
 *    export DECLARATION
 *    export { name, one as other }
 */
function visitExportDeclaration(traverse, node, path, state) {
  var specifier, name, len, i;
  utils.catchup(node.range[0], state);

  if (node.declaration) {
    // export default = value
    if (node.default) {
      //traverse(node.declaration, path, state);
      if (node.declaration.type == Syntax.AssignmentExpression) {
        // -1 compensates for an additional space after '=' token
        name = node.declaration.left.name;
        utils.append('var ' + name + ' = module.exports["default"] = ', state);
        utils.move(node.declaration.right.range[0], state);
        traverse(node.declaration.right, path, state);
        utils.move(node.declaration.range[1] - 1, state);
      } else {
        if (node.declaration.id) {
          utils.move(node.declaration.range[0], state);
          traverse(node.declaration, path, state);
          utils.append(' module.exports["default"] = ' + node.declaration.id.name, state);
        } else {
          utils.append('module.exports["default"] = ', state);
          utils.move(node.declaration.range[0], state);
          traverse(node.declaration, path, state);
        }
      }


    // export DECLARATION
    } else {
      switch (node.declaration.type) {
        // export var name = value
        case Syntax.VariableDeclaration:
          utils.move(node.declaration.range[0], state);
          node.declaration.declarations.forEach(function(declaration) {
            utils.catchup(declaration.id.range[1], state);
            utils.append(' = module.exports.' + declaration.id.name, state);
            traverse(declaration.init, path, state);
          });
          break;
        case Syntax.Identifier:
          name = node.declaration.name;
          utils.move(node.declaration.range[1], state);
          traverse(node.declaration, path, state);
          utils.append('module.exports.' + name + ' = ' + name, state);
          break;
        case Syntax.FunctionDeclaration:
          name = node.declaration.id.name;
          utils.move(node.declaration.range[0], state);
          traverse(node.declaration, path, state);
          utils.append(' module.exports.' + name + ' = ' + name + ';', state);
          break;
        case Syntax.ClassDeclaration:
          name = node.declaration.id.name;
          utils.move(node.declaration.range[0], state);
          traverse(node.declaration, path, state);
          utils.append('module.exports.' + name + ' = ' + name + ';', state);
          break;
        default:
          assert(false, "unknown declaration: " + node.declaration.type);
      }
    }

  } else if (node.source) {

    var modID;

    // export * from "module"
    if (node.specifiers.length === 1 &&
        node.specifiers[0].type === Syntax.ExportBatchSpecifier) {

      modID = genID('mod');
      utils.append('var ' + modID + ' = require(' + node.source.raw + ');', state);

      var keyID = genID('key');
      utils.append(
        'for (var ' + keyID + ' in ' + modID + ') ' +
        'module.exports[' + keyID + '] = ' + modID + '[' + keyID + '];',
        state
      );

      utils.move(node.range[1], state);

    // export {name, one as other} from "module"
    } else {

      if (node.specifiers.length === 1) {
        modID = 'require(' + node.source.raw + ')';
      } else {
        modID = genID('mod');
        utils.append('var ' + modID + ' = require(' + node.source.raw + ');', state);
      }

      for (i = 0, len = node.specifiers.length; i < len; i++) {
        specifier = node.specifiers[i];
        utils.catchupNewlines(specifier.range[0], state);
        name = specifier.name ? specifier.name.name : specifier.id.name;
        utils.append(
          'module.exports.' + name + ' = ' + modID +
          '.' + specifier.id.name + ';',
          state
        );
        utils.move(specifier.id.range[1], state);
      }
    }

    utils.catchupNewlines(node.range[1], state);
    utils.move(node.range[1], state);

  } else if (node.specifiers) {

    // export { name, one as other }
    for (i = 0, len = node.specifiers.length; i < len; i++) {
      specifier = node.specifiers[i];
      utils.catchupNewlines(specifier.range[0], state);
      name = specifier.name ? specifier.name.name : specifier.id.name;
      utils.append('module.exports.' + name + ' = ' + specifier.id.name + ';', state);
    }

    utils.catchupNewlines(node.range[1], state);
    utils.move(node.range[1], state);

  } else {

    assert(false, "don't know how to compile export declaration");
  }

  return false;
}

visitExportDeclaration.test = function(node, path, state) {
  return node.type === Syntax.ExportDeclaration;
};

/**
 * Visit ModuleDeclaration.
 *
 * Example:
 *
 *    module name from "module"
 */
function visitModuleDeclaration(traverse, node, path, state) {
  utils.catchup(node.range[0], state);
  utils.append('var ' + node.id.name + ' = require(' + node.source.raw + ')["default"];', state);
  utils.move(node.range[1], state);
  return false;
}

visitModuleDeclaration.test = function(node, path, state) {
  return node.type === Syntax.ModuleDeclaration;
};

function formatError(message, node) {
  return '' + node.loc.start.line + ':' + node.loc.start.column + ' ' + message;
}

var num = 0;

/**
 * Generate unique identifier with a given prefix.
 *
 * @private
 */
function genID(prefix) {
  return prefix + '$' + (num++);
}

module.exports.__resetModuleState = function() { num = 0; };

module.exports.visitorList = [
  visitImportDeclaration,
  visitModuleDeclaration,
  visitExportDeclaration
];

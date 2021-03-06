import { Compiler } from '@angular/core';

import {
  chain,
  move,
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
  externalSchematic
} from '@angular-devkit/schematics';

import {
  findImports,
  ImportKind,
  isImportDeclaration,
  isNamedImports
} from 'tsutils';

import {
  getDecoratorMetadata,
  getMetadataField,
  addDeclarationToModule
} from '@schematics/angular/utility/ast-utils';

import { getWorkspacePath, readJsonInTree, readWorkspaceJson, readTsConfig } from '@nrwl/workspace';
import Schema from './schema';
import { strings, experimental } from '@angular-devkit/core';
import * as ts from 'typescript';
import {
  insertImport,
  getSourceNodes,
  InsertChange,
  findNodes
} from '@nrwl/workspace/src/utils/ast-utils';

import * as get from 'lodash.get';

import * as fs from 'fs';

import * as path from 'path';
import { execFileSync } from 'child_process';

function getFeatureName(componentClassName) {
  return componentClassName.replace('Component', '');
}

function getModuleName(componentClassName) {
  return getFeatureName(componentClassName) + 'Module';
}

function getNewModulePath(componentClassName) {
  const moduleName = getModuleName(componentClassName);
}

function isWebComponent(element) {
  return element.tagName.includes('-');
}


function outputCwd(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    console.log(process.cwd());
    return host
  }
};

function outputLocalNgVersion(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const packageJson = readJsonInTree(host, '/package.json');
    const localNgVersion = packageJson.dependencies['@angular/core'];
    console.log(`TCL: localNgVersion`, localNgVersion);
    return host;
  }
};

function outputIsIvyEnabled(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const workspace = readWorkspaceJson();
    const project = workspace.projects[options.project];
    const tsConfigAppPath = project.architect.build.options.tsConfig;
    const tsConfigApp = readJsonInTree(host, tsConfigAppPath);
    const isEvyEnabled = get(tsConfigApp, 'angularCompilerOptions.enableIvy', false);
    console.log(`TCL: isEvyEnabled`, isEvyEnabled);
    return host;
  }
};

// function outputMainType(options: NormalizedSchema): Rule {
//   return (host: Tree) => {
//     const workspace = readWorkspaceJson();
//     const project = workspace.projects[options.project];
//     const mainTsPath = project.architect.build.options.main;
//     resolveEntryModuleFromMain
//     console.log(`TCL: mainTsPath`, mainTsPath);
//     return host;
//   }
// };

function compileComponent(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const compiler = new Compiler();
    const appPath = `${
      options.appProjectRoot
    }/src/app/app.module.ts`;

    const appAbsolutePath = path.join(process.cwd(), appPath);
    compileComponent
    import(appAbsolutePath).then((importedApp) => {
      console.log(importedApp);
      return host;

    })
  }
};

function runNgc(options: NormalizedSchema): Rule {
  return (tree: Tree) => {
    const workspace = readWorkspaceJson();

    const projectSourceRoot = workspace.projects[options.project].sourceRoot;

    if (!projectSourceRoot) {
      throw new SchematicsException(`Could not find sourceRoot for project '${options.project}' in workspace configuration (angular.json)`);
    }

    console.log(projectSourceRoot);

    const projectOutputPath = workspace.projects[options.project].architect.build.options.outputPath;

    if (!projectOutputPath) {
      throw new SchematicsException(`Could not find sourceRoot for project '${options.project}' in workspace configuration (angular.json)`);
    }

    console.log(projectOutputPath);

    console.log('Executing ngc');
    const ngcRelativePath = '/node_modules/.bin/ngc';
    const ngcAbsolutePath = path.join(process.cwd(), ngcRelativePath);

    if (!fs.existsSync(ngcAbsolutePath)) {
      throw new SchematicsException(`Could not find ngc at ${ngcAbsolutePath}`);
    }
    execFileSync(ngcAbsolutePath);

    return tree;
  }
}

// function addComponentToRoute(options: NormalizedSchema): Rule {
//   return (host: Tree) => {
//     const featureRoutingPath = `${
//       options.appProjectRoot
//     }/src/app/${strings.dasherize(
//       options.componentClassName
//     )}/${strings.dasherize(options.componentClassName)}-routing.module.ts`;

//     // tslint:disable-next-line
//     const featureRouting = host.read(featureRoutingPath)!.toString('utf-8');

//     const src = ts.createSourceFile(
//       `${strings.dasherize(options.componentClassName)}-routing.module.ts`,
//       featureRouting,
//       ts.ScriptTarget.Latest,
//       true
//     );

//     const route = `{
//       path: '',
//       pathMatch: 'full',
//       component: ${strings.capitalize(
//         options.componentClassName
//       )}ContainerComponent
//     }`;

//     const nodes = getSourceNodes(src);
//     const routeNodes = nodes
//       .filter((n: ts.Node) => {
//         if (n.kind === ts.SyntaxKind.VariableDeclaration) {
//           if (
//             n.getChildren().findIndex(c => {
//               return (
//                 c.kind === ts.SyntaxKind.Identifier && c.getText() === 'routes'
//               );
//             }) !== -1
//           ) {
//             return true;
//           }
//         }
//         return false;
//       })
//       .map((n: ts.Node) => {
//         const arrNodes = n
//           .getChildren()
//           .filter(c => c.kind === ts.SyntaxKind.ArrayLiteralExpression);
//         return arrNodes[arrNodes.length - 1];
//       });

//     if (routeNodes.length === 1) {
//       const navigation: ts.ArrayLiteralExpression = routeNodes[0] as ts.ArrayLiteralExpression;
//       const pos = navigation.getStart() + 1;
//       const fullText = navigation.getFullText();
//       let toInsert = '';
//       if (navigation.elements.length > 0) {
//         if (fullText.match(/\r\n/)) {
//           toInsert = `${fullText.match(/\r\n(\r?)\s*/)[0]}${route},`;
//         } else {
//           toInsert = `${route},`;
//         }
//       } else {
//         toInsert = `${route}`;
//       }

//       const recorder = host.beginUpdate(featureRoutingPath);
//       recorder.insertRight(pos, toInsert);

//       const componentChange = insertImport(
//         src,
//         featureRoutingPath,
//         `${strings.capitalize(options.componentClassName)}ContainerComponent`,
//         `./${strings.dasherize(
//           options.componentClassName
//         )}-container/${strings.dasherize(
//           options.componentClassName
//         )}-container.component`,
//         false
//       );
//       if (componentChange instanceof InsertChange) {
//         recorder.insertLeft(
//           (componentChange as InsertChange).pos,
//           (componentChange as InsertChange).toAdd
//         );
//       }

//       host.commitUpdate(recorder);
//       return host;

//   };
// }

function moveComponentRoutes(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const appRoutingPath = `${
      options.appProjectRoot
    }/src/app/app-routing.module.ts`;

    // tslint:disable-next-line
    const appRouting = host.read(appRoutingPath)!.toString('utf-8');

    const appRoutingSrc = ts.createSourceFile(
      'app-routing.module.ts',
      appRouting,
      ts.ScriptTarget.Latest,
      true
    );

    const appRoutingNodes = getSourceNodes(appRoutingSrc);
    const appRoutingRouteNodes = appRoutingNodes
      .filter((n: ts.Node) => {
        if (n.kind === ts.SyntaxKind.VariableDeclaration) {
          if (
            n.getChildren().findIndex(c => {
              return (
                c.kind === ts.SyntaxKind.Identifier && c.getText() === 'routes'
              );
            }) !== -1
          ) {
            return true;
          }
        }
        return false;
      })
      .map((n: ts.Node) => {
        const arrNodes = n
          .getChildren()
          .filter(c => c.kind === ts.SyntaxKind.ArrayLiteralExpression);
        return arrNodes[arrNodes.length - 1];
      });

    const appRoutes: ts.ArrayLiteralExpression = appRoutingRouteNodes[0] as ts.ArrayLiteralExpression;

    const appRoutingNonLazyLoadedAppRoutes = appRoutes.elements.filter(
      appRoute => {
        return (appRoute as ts.ObjectLiteralExpression).properties.some(
          p => p.name.getText() === 'component'
        );
      }
    );

    const appRoutingComponentRoutes = appRoutingNonLazyLoadedAppRoutes.filter(
      appRoute => {
        const maybeRouteComponentPropertyWithSchematicComponent = (appRoute as ts.ObjectLiteralExpression).properties.filter(
          p => {
            const isComponentProperty = p.name.getText() === 'component';
            if (!isComponentProperty) return false;

            const componentPropertyValue = (p as ts.PropertyAssignment).initializer.getText();
            const isComponentPropertyValueComponentClassName =
              componentPropertyValue === options.componentClassName;

            return (
              isComponentProperty && isComponentPropertyValueComponentClassName
            );
          }
        )[0];

        return (
          typeof maybeRouteComponentPropertyWithSchematicComponent !==
          'undefined'
        );
      }
    );

    const appRoutingComponentRoutesText = appRoutingComponentRoutes.map(cr =>
      cr.getText()
    );
    // const appRoutingRecorder = host.beginUpdate(appRoutingPath);

    // appRoutingComponentRoutes.forEach(appRoutingComponentRoute => {
    //   appRoutingRecorder.remove(
    //     appRoutingComponentRoute.getStart(),
    //     appRoutingComponentRoute.getEnd() - appRoutingComponentRoute.getStart()
    //   );
    // });

    // host.commitUpdate(appRoutingRecorder);

    const featureName = getFeatureName(options.componentClassName);

    const featureRoutingPath = `${
      options.appProjectRoot
    }/src/app/${strings.dasherize(featureName)}/${strings.dasherize(
      featureName
    )}-routing.module.ts`;

    // tslint:disable-next-line
    const featureRouting = host.read(featureRoutingPath)!.toString('utf-8');

    const featureRoutingSrc = ts.createSourceFile(
      `${strings.dasherize(featureName)}-routing.module.ts`,
      featureRouting,
      ts.ScriptTarget.Latest,
      true
    );

    const featureRoutingNodes = getSourceNodes(featureRoutingSrc);
    const featureRoutingRouteNodes = featureRoutingNodes
      .filter((n: ts.Node) => {
        if (n.kind === ts.SyntaxKind.VariableDeclaration) {
          if (
            n.getChildren().findIndex(c => {
              return (
                c.kind === ts.SyntaxKind.Identifier && c.getText() === 'routes'
              );
            }) !== -1
          ) {
            return true;
          }
        }
        return false;
      })
      .map((n: ts.Node) => {
        const arrNodes = n
          .getChildren()
          .filter(c => c.kind === ts.SyntaxKind.ArrayLiteralExpression);
        return arrNodes[arrNodes.length - 1];
      });

    const featureRoutingRecorder = host.beginUpdate(featureRoutingPath);

    const appRoutingComponentRoutesTextFormatted = `\n  ${appRoutingComponentRoutesText.join(`,\n  `)}\n`;
    const featureRoutingRouteArrayLiteral: ts.ArrayLiteralExpression = featureRoutingRouteNodes[0] as ts.ArrayLiteralExpression;
    const pos = featureRoutingRouteArrayLiteral.getStart() + 1;
    featureRoutingRecorder.insertRight(pos, appRoutingComponentRoutesTextFormatted);

    const newComponentPath = `./${strings.dasherize(featureName)}/${strings.dasherize(featureName)}.component`;

    const componentChange = insertImport(
      featureRoutingSrc,
      featureRoutingPath,
      options.componentClassName,
      newComponentPath,
      false
    );

    if (componentChange instanceof InsertChange) {
      featureRoutingRecorder.insertLeft(
        (componentChange as InsertChange).pos,
        (componentChange as InsertChange).toAdd
      );
    }

    host.commitUpdate(featureRoutingRecorder);

    const featurePath = `${
      options.appProjectRoot
    }/src/app/${strings.dasherize(featureName)}/${strings.dasherize(
      featureName
    )}.module.ts`;

    // tslint:disable-next-line
    const feature = host.read(featurePath)!.toString('utf-8');

    const featureSrc = ts.createSourceFile(
      `${strings.dasherize(featureName)}.module.ts`,
      featureRouting,
      ts.ScriptTarget.Latest,
      true
    );

    const featureRecorder = host.beginUpdate(featurePath);

    const addDeclaration = addDeclarationToModule(featureSrc, featurePath, options.componentClassName, newComponentPath);
      if (addDeclaration instanceof InsertChange) {
        featureRecorder.insertLeft(
          (addDeclaration as InsertChange).pos,
          (addDeclaration as InsertChange).toAdd
        )
      }

    host.commitUpdate(featureRecorder);

    return host;
  };
}

function addRoute(routingRouteNodes, routeText, recorder) {
  const routingRouteArrayLiteral: ts.ArrayLiteralExpression = routingRouteNodes[0] as ts.ArrayLiteralExpression;
  const pos = routingRouteArrayLiteral.getStart() + 1;
  const fullText = routingRouteArrayLiteral.getFullText();
  let toInsert = '';
  if (routingRouteArrayLiteral.elements.length > 0) {
    if (fullText.match(/\r\n/)) {
      toInsert = `${fullText.match(/\r\n(\r?)\s*/)[0]}${routeText},`;
    } else {
      toInsert = `${routeText},`;
    }
  } else {
    toInsert = `${routeText}`;
  }
  
  console.log('inserting right', pos, toInsert);
  recorder.insertRight(pos, toInsert);
}

function getComponentImportDetails(src, componentClassName) {
  for (const importNode of findImports(src, ImportKind.All)) {
    const parentNode = importNode.parent;

    // Disable strict-boolean-expressions for the next few lines so our &&
    // checks can help type inference figure out if when don't have undefined.
    // tslint:disable strict-boolean-expressions
    const importClause =
      parentNode && isImportDeclaration(parentNode)
        ? parentNode.importClause
        : undefined;

    // Below, check isNamedImports to rule out the
    // `import * as ns from "..."` case.
    const importsSpecificNamedExports =
      importClause &&
      importClause.namedBindings &&
      isNamedImports(importClause.namedBindings);

    if (!importsSpecificNamedExports) {
      continue;
    }

    const namedImportsElementNameEscapedTexts = (importClause.namedBindings as ts.NamedImports).elements.map(
      ni => String(ni.name.escapedText)
    );

    if (
      namedImportsElementNameEscapedTexts.indexOf(componentClassName) !== -1
    ) {
      return { componentRelativePath: importNode.text, parentNode: parentNode };
    }
  }
  return null;
}

function getRemoveInterval(targetNode, targetNodeIndex, elements) {
  // console.log('node', node);
  //   console.log('mapNodesEscapedTexts', elements);
  //   console.log('indexOfTargetNode', targetNodeIndex);

  const targetNodeIsSingle = elements.length === 1;

  // build the interval of char indexes
  // to remove as part of removing the item
  // from the declarations array from NgModule
  const removeInterval = {
    start: null,
    end: null,
    length: null
  };

  const declarationsParentNode = elements[0].parent;
  console.log('mapNodesEscapedTexts.length', elements.length);

  const targetNodePrevIndex = targetNodeIndex - 1;
  const targetNodeIsFirst = targetNodePrevIndex === -1;
  console.log('TCL: targetNodeIsFirst', targetNodeIsFirst);

  const targetNodeNextIndex = targetNodeIndex + 1;
  const targetNodeIsLast = targetNodeIndex + 1 === elements.length;
  console.log('TCL: targetNodeIsLast', targetNodeIsLast);

  if (targetNodeIsSingle) {
    console.log('node is single');
    removeInterval.start = targetNode.getStart();
    removeInterval.end = targetNode.getEnd();
  } else if (targetNodeIsFirst) {
    console.log('node is first');
    removeInterval.start = targetNode.getStart();
    removeInterval.end = elements[targetNodeNextIndex].getStart();
  } else if (targetNodeIsLast) {
    console.log('node is last');
    removeInterval.start = elements[targetNodePrevIndex].getEnd();
    console.log(
      'declarationsParentNode.getEnd()',
      declarationsParentNode.getEnd()
    );
    removeInterval.end = declarationsParentNode.getEnd() - 1;
  } else {
    // target node is in-between
    console.log('node is in-between');
    removeInterval.start = targetNode.getStart();
    removeInterval.end = elements[targetNodeNextIndex].getStart();
  }

  removeInterval.length = removeInterval.end - removeInterval.start;
  console.log('removeInterval', removeInterval);

  // const srcText = src.getText();
  // let stringThatWillBeRemoved = '';
  // for (let i = removeInterval.start; i < removeInterval.end; i++) {
  //   stringThatWillBeRemoved += srcText[i];
  // }
  // console.log('stringThatWillBeRemoved', stringThatWillBeRemoved);

  return removeInterval;
}

function removeComponentImportAndDeclarationsArrayEntry(
  options: NormalizedSchema
): Rule {
  return (host: Tree) => {
    const appSourcePath = `${options.appProjectRoot}/src/app`;
    const appModulePath = path.join(appSourcePath, `app.module.ts`);

    // tslint:disable-next-line
    const appModule = host.read(appModulePath)!.toString('utf-8');

    const src = ts.createSourceFile(
      `app.module.ts`,
      appModule,
      ts.ScriptTarget.Latest,
      true
    );

    const componentImportDetails = getComponentImportDetails(
      src,
      options.componentClassName
    );

    if (componentImportDetails === null) {
      throw new Error(
        `Couldn't get componentImportDetails for componentClassName ${
          options.componentClassName
        }`
      );
    }

    const { componentRelativePath, parentNode } = componentImportDetails;
    const componentParentDirectory = path.dirname(componentRelativePath);
    const componentParentDirectoryPath = path.join(
      appSourcePath,
      componentParentDirectory
    );

    const recorder = host.beginUpdate(appModulePath);
    recorder.remove(
      parentNode.getStart(),
      parentNode.getEnd() - parentNode.getStart()
    );

    const nodes = getDecoratorMetadata(src, 'NgModule', '@angular/core');
    let maybeDeclarationsArrElements: any = nodes[0]; // tslint:disable-line:no-any

    // Find the decorator declaration.
    if (!maybeDeclarationsArrElements) {
      throw new Error(`Couldn't find NgModule decorator!`);
    }

    // Get all the children property assignment of object literals.
    const matchingProperties = getMetadataField(
      maybeDeclarationsArrElements as ts.ObjectLiteralExpression,
      'declarations'
    );

    const assignment = matchingProperties[0] as ts.PropertyAssignment;

    // If it's not an array, nothing we can do really.
    if (assignment.initializer.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
      throw new Error(`Malformed NgModule. 'declarations' is not an array.`);
    }

    const arrLiteral = assignment.initializer as ts.ArrayLiteralExpression;
    if (arrLiteral.elements.length === 0) {
      // Forward the property.
      maybeDeclarationsArrElements = arrLiteral;
    } else {
      maybeDeclarationsArrElements = arrLiteral.elements;
    }
    maybeDeclarationsArrElements.forEach(dar => {
      console.log(dar);
    })
    const nodeEscapedTexts = maybeDeclarationsArrElements.map(
      n => n.escapedText
    );
    console.log(`TCL: nodeEscapedTexts`, nodeEscapedTexts);
    const nodeTexts = maybeDeclarationsArrElements.map(
      n => n.getText()
    );
    console.log(`TCL: nodeTexts`, nodeTexts);
    const targetNodeIndex = nodeEscapedTexts.indexOf(
      options.componentClassName
    );
    const targetNode = maybeDeclarationsArrElements[targetNodeIndex];

    const removeInterval = getRemoveInterval(
      targetNode,
      targetNodeIndex,
      maybeDeclarationsArrElements
    );

    recorder.remove(removeInterval.start, removeInterval.length);

    host.delete(path.join(appSourcePath, componentRelativePath + '.ts'));
    console.log('componentParentDirectoryPath', componentParentDirectoryPath);
    const componentDirEntry = host.getDir(componentParentDirectoryPath);

    // const newModulePath = ;
    // componentDirEntry.subfiles.forEach((subfile) => {
    //   const subfilePath = path.join(componentParentDirectoryPath, subfile);
    //   host.delete(subfilePath);
    // });
    host.commitUpdate(recorder);

    return host;
  };
}

function showTree(node: ts.Node, indent: string = '    '): void {
  console.log(indent + ts.SyntaxKind[node.kind]);

  if (node.getChildCount() === 0) {
    console.log(indent + '    Text: ' + node.getText());
  }

  for (const child of node.getChildren()) {
    showTree(child, indent + '    ');
  }
}

interface NormalizedSchema extends Schema {
  appProjectRoot: string;
}

function normalizeOptions(host: Tree, options: Schema): NormalizedSchema {
  const appProjectRoot = `apps/${options.project}`;

  return {
    ...options,
    appProjectRoot
  };
}

export default function(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(host, schema);

    const angularJson = readJsonInTree(host, getWorkspacePath(host));
    if (!angularJson.projects[options.project]) {
      throw new SchematicsException(
        `Project ${options.project} is not in angular.json file!`
      );
    }

    return chain([
      // outputLocalNgVersion(options),
      // externalSchematic('@schematics/angular', 'module', {
      //   project: options.project,
      //   name: `${getFeatureName(options.componentClassName)}`,
      //   routing: true
      // }),
      // runNgc(options),
      // move('apps/qwerty/src/app/x', 'apps/qwerty/src/app/y'),
      // removeComponentImportAndDeclarationsArrayEntry(options),
      // outputCwd(options),
      removeComponentImportAndDeclarationsArrayEntry(options),
      compileComponent(options),
      // outputMainType(options)
      // outputIsIvyEnabled(options)
      // moveComponentRoutes(options),
    ]);
  };
}

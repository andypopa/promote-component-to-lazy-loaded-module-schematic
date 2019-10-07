import {
  chain,
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
  isNamedImports,
} from 'tsutils';

import {
  getDecoratorMetadata,
  getMetadataField
} from '@schematics/angular/utility/ast-utils';

import { getWorkspacePath, readJsonInTree } from '@nrwl/workspace';
import Schema from './schema';
import { strings } from '@angular-devkit/core';
import * as ts from 'typescript';
import {
  insertImport,
  getSourceNodes,
  InsertChange,
  findNodes
} from '@nrwl/workspace/src/utils/ast-utils';

function isWebComponent(element) {
  return element.tagName.includes("-");
}

function addComponentToRoute(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const featureRoutingPath = `${
      options.appProjectRoot
      }/src/app/${strings.dasherize(options.componentClassName)}/${strings.dasherize(
        options.componentClassName
      )}-routing.module.ts`;

    // tslint:disable-next-line
    const featureRouting = host.read(featureRoutingPath)!.toString('utf-8');

    const src = ts.createSourceFile(
      `${strings.dasherize(options.componentClassName)}-routing.module.ts`,
      featureRouting,
      ts.ScriptTarget.Latest,
      true
    );

    const route = `{
      path: '',
      pathMatch: 'full',
      component: ${strings.capitalize(options.componentClassName)}ContainerComponent
    }`;

    const nodes = getSourceNodes(src);
    const routeNodes = nodes
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

    if (routeNodes.length === 1) {
      const navigation: ts.ArrayLiteralExpression = routeNodes[0] as ts.ArrayLiteralExpression;
      const pos = navigation.getStart() + 1;
      const fullText = navigation.getFullText();
      let toInsert = '';
      if (navigation.elements.length > 0) {
        if (fullText.match(/\r\n/)) {
          toInsert = `${fullText.match(/\r\n(\r?)\s*/)[0]}${route},`;
        } else {
          toInsert = `${route},`;
        }
      } else {
        toInsert = `${route}`;
      }

      const recorder = host.beginUpdate(featureRoutingPath);
      recorder.insertRight(pos, toInsert);

      const componentChange = insertImport(
        src,
        featureRoutingPath,
        `${strings.capitalize(options.componentClassName)}ContainerComponent`,
        `./${strings.dasherize(options.componentClassName)}-container/${strings.dasherize(
          options.componentClassName
        )}-container.component`,
        false
      );
      if (componentChange instanceof InsertChange) {
        recorder.insertLeft(
          (componentChange as InsertChange).pos,
          (componentChange as InsertChange).toAdd
        );
      }

      host.commitUpdate(recorder);
      return host;
    }
  };
}

function addRouteToApp(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const appRoutingPath = `${
      options.appProjectRoot
      }/src/app/app-routing.module.ts`;

    // tslint:disable-next-line
    const appRouting = host.read(appRoutingPath)!.toString('utf-8');

    const src = ts.createSourceFile(
      'app-routing.module.ts',
      appRouting,
      ts.ScriptTarget.Latest,
      true
    );

    const route = `{
      path: '${options.componentClassName}',
      loadChildren: './${strings.dasherize(
      options.componentClassName
    )}/${strings.dasherize(options.componentClassName)}.module#${strings.capitalize(
      options.componentClassName
    )}Module'
    }`;

    const nodes = getSourceNodes(src);
    const routeNodes = nodes
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

    if (routeNodes.length === 1) {
      const navigation: ts.ArrayLiteralExpression = routeNodes[0] as ts.ArrayLiteralExpression;
      const pos = navigation.getStart() + 1;
      const fullText = navigation.getFullText();
      let toInsert = '';
      if (navigation.elements.length > 0) {
        if (fullText.match(/\r\n/)) {
          toInsert = `${fullText.match(/\r\n(\r?)\s*/)[0]}${route},`;
        } else {
          toInsert = `${route},`;
        }
      } else {
        toInsert = `${route}`;
      }

      const recorder = host.beginUpdate(appRoutingPath);
      recorder.insertRight(pos, toInsert);

      host.commitUpdate(recorder);

      return host;
    }
  };
}

function addNavigation(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    return host;

    const componentPath = `${options.appProjectRoot}/src/app/app.component.ts`;
    const navPath = `{name: '${strings.capitalize(
      options.componentClassName
    )}', router: '/${options.componentClassName}'}`;
    // tslint:disable-next-line
    const appComponent = host.read(componentPath)!.toString('utf-8');

    const src = ts.createSourceFile(
      'app.component.ts',
      appComponent,
      ts.ScriptTarget.Latest,
      true
    );

    const nodes = getSourceNodes(src);
    const navNodes = nodes
      .filter((n: ts.Node) => {
        if (n.kind === ts.SyntaxKind.BinaryExpression) {
          if (
            n.getChildren().findIndex(c => {
              return (
                c.kind === ts.SyntaxKind.PropertyAccessExpression &&
                c.getText() === 'this.navigation'
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
          .filter(c => (c.kind = ts.SyntaxKind.ArrayLiteralExpression));
        return arrNodes[arrNodes.length - 1];
      });

    if (navNodes.length === 1) {
      const navigation: ts.ArrayLiteralExpression = navNodes[0] as ts.ArrayLiteralExpression;
      const pos = navigation.getEnd() - 1;
      const fullText = navigation.getFullText();
      let toInsert = '';
      if (navigation.elements.length > 0) {
        if (fullText.match(/\r\n/)) {
          toInsert = `,${fullText.match(/\r\n(\r?)\s*/)[0]}${navPath}`;
        } else {
          toInsert = `, ${navPath}`;
        }
      } else {
        toInsert = `${navPath}`;
      }

      const recorder = host.beginUpdate(componentPath);
      recorder.insertLeft(pos, toInsert);
      host.commitUpdate(recorder);
    }

    return host;
  };
}

function getComponentImportDetails(src, componentClassName) {
  for (const importNode of findImports(src, ImportKind.All)) {
    const parentNode = importNode.parent;

    // Disable strict-boolean-expressions for the next few lines so our &&
    // checks can help type inference figure out if when don't have undefined.
    // tslint:disable strict-boolean-expressions
    const importClause =
        parentNode && isImportDeclaration(parentNode) ? parentNode.importClause : undefined;

    // Below, check isNamedImports to rule out the
    // `import * as ns from "..."` case.
    const importsSpecificNamedExports =
        importClause &&
        importClause.namedBindings &&
        isNamedImports(importClause.namedBindings);

    if (!importsSpecificNamedExports) {
      continue;
    }

    const namedImportsElementNameEscapedTexts = (importClause.namedBindings as ts.NamedImports)
      .elements.map((ni) => String(ni.name.escapedText));

    if (namedImportsElementNameEscapedTexts.indexOf(componentClassName) !== -1) {
      return { componentPath: importNode.text, parentNode: parentNode };
    }
  }
  return null;
}

function removeComponentImportAndDeclarationsArrayEntry(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    const appModulePath = `${
      options.appProjectRoot
      }/src/app/app.module.ts`;

    // tslint:disable-next-line
    const appModule = host.read(appModulePath)!.toString('utf-8');

    const src = ts.createSourceFile(
      `app.module.ts`,
      appModule,
      ts.ScriptTarget.Latest,
      true
    );

    const componentImportDetails = getComponentImportDetails(src, options.componentClassName);

    if (componentImportDetails === null) {
      throw new Error(`Couldn't get componentImportDetails for componentClassName ${options.componentClassName}`);
    }

    const { componentPath, parentNode } = componentImportDetails;

    const recorder = host.beginUpdate(appModulePath);
    recorder.remove(parentNode.getStart(), parentNode.getEnd() - parentNode.getStart());

    const nodes = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    let node: any = nodes[0];  // tslint:disable-line:no-any
  
    // Find the decorator declaration.
    if (!node) {
      throw new Error(`Couldn't find NgModule decorator!`);
    }
  
    // Get all the children property assignment of object literals.
    const matchingProperties = getMetadataField(
      node as ts.ObjectLiteralExpression,
      metadataField,
    );

    // host.commitUpdate(recorder);




    // const rootNode = src;
    // const allImports = findNodes(rootNode, ts.SyntaxKind.ImportDeclaration);
    // allImports.forEach((importDeclaration) => {
    //   console.log(ts.isImportDeclaration(importDeclaration));
    //   // console.log(importDeclaration.kind);
    //   console.log(importDeclaration.getSourceFile());
    //   // console.log(importDeclaration);
    // });
    // // get nodes that map to import statements from the file fileName
    // const relevantImports = allImports.filter(node => {
    //   // StringLiteral of the ImportDeclaration is the import file (fileName in this case).
    //   const importFiles = node.getChildren()
    //     .filter(child => {
    //       return child.kind === ts.SyntaxKind.StringLiteral})
    //     .map(n => (n as ts.StringLiteral).text);
    //   return importFiles.filter(file => file === options.componentClassName).length === 1;
    // });

    // console.log("TCL: relevantImports", relevantImports)


    // const nodes = getSourceNodes(src);
    // const routeNodes = nodes
    //   .filter((n: ts.Node) => {
    //     if (n.kind === ts.SyntaxKind.VariableDeclaration) {
    //       if (
    //         n.getChildren().findIndex(c => {
    //           return (
    //             c.kind === ts.SyntaxKind.Identifier && c.getText() === 'routes'
    //           );
    //         }) !== -1
    //       ) {
    //         return true;
    //       }
    //     }
    //     return false;
    //   })
    //   .map((n: ts.Node) => {
    //     const arrNodes = n
    //       .getChildren()
    //       .filter(c => c.kind === ts.SyntaxKind.ArrayLiteralExpression);
    //     return arrNodes[arrNodes.length - 1];
    //   });

    // if (routeNodes.length === 1) {
    //   const navigation: ts.ArrayLiteralExpression = routeNodes[0] as ts.ArrayLiteralExpression;
    //   const pos = navigation.getStart() + 1;
    //   const fullText = navigation.getFullText();


    //   const recorder = host.beginUpdate(featureRoutingPath);
    //   recorder.insertRight(pos, toInsert);

    //   const componentChange = insertImport(
    //     src,
    //     featureRoutingPath,
    //     `${strings.capitalize(options.componentClassName)}ContainerComponent`,
    //     `./${strings.dasherize(options.componentClassName)}-container/${strings.dasherize(
    //       options.componentClassName
    //     )}-container.component`,
    //     false
    //   );
    //   if (componentChange instanceof InsertChange) {
    //     recorder.insertLeft(
    //       (componentChange as InsertChange).pos,
    //       (componentChange as InsertChange).toAdd
    //     );
    //   }

    //   host.commitUpdate(recorder);
    return host;
  }
  // };
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

export default function (schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(host, schema);

    const angularJson = readJsonInTree(host, getWorkspacePath(host));
    if (!angularJson.projects[options.project]) {
      throw new SchematicsException(
        `Project ${options.project} is not in angular.json file!`
      );
    }

    return chain([
      removeComponentImportAndDeclarationsArrayEntry(options),
      // externalSchematic('@schematics/angular', 'module', {
      //   project: options.project,
      //   name: `${options.componentClassName}`,
      //   routing: true
      // }),
      // externalSchematic('@schematics/angular', 'component', {
      //   project: options.project,
      //   name: `${options.componentClassName}/${options.componentClassName}-container`,
      //   changeDetection: 'OnPush'
      // }),
      // addComponentToRoute(options),
      // addRouteToApp(options),
      // addNavigation(options)
    ]);
  };
}

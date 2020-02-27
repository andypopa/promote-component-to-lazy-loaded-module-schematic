import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
} from '@angular-devkit/schematics';
import { getWorkspacePath, readJsonInTree } from '@nrwl/workspace';
import Schema from './schema';
import { strings } from '@angular-devkit/core';

function getComponentDirectoryPath(options: NormalizedSchema) {
  const featureName = getFeatureName(options.componentClassName);

  const componentDirectoryPath = `${
    options.appProjectRoot
    }/src/app/${strings.dasherize(featureName)}`;

  return componentDirectoryPath;
}

function getNewComponentDirectoryPath(options: NormalizedSchema) {
  const featureName = getFeatureName(options.componentClassName);

  const componentDirectoryPath = ''; //getComponentDirectoryPath(options);
  const newComponentDirectoryPath = `${componentDirectoryPath}/${strings.dasherize(featureName)}`;
  // console.log(`TCL: getNewComponentDirectoryPath -> newComponentDirectoryPath`, newComponentDirectoryPath);
  
  return newComponentDirectoryPath;
}

function getFeatureName(componentClassName) {
  return componentClassName.replace('Component', '');
}

function createNewComponentDirectory(options): Rule {
  console.log('createNewComponentDirectory fn');
  return (host: Tree) => {
    console.log('createNewComponentDirectory λ');
    const newComponentDirectoryPath = getComponentDirectoryPath(options) + getNewComponentDirectoryPath(options);
    const gitKeepPath = `${newComponentDirectoryPath}/.gitkeep`;
    host.create(gitKeepPath, '');
    return host;
  };
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
      createNewComponentDirectory(options),
    ]);
  };
}

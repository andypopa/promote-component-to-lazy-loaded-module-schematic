import { chain, externalSchematic, Rule, noop, branchAndMerge, apply, Tree, SchematicContext, url, mergeWith, move } from '@angular-devkit/schematics';

export default function (schema: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    tree.getDir('apps/qwerty/src/app/map')
      .visit((filePath) => {
        const content = tree.read(filePath);
        tree.create(
          filePath.replace('apps/qwerty/src/app/map', 'apps/qwerty/src/app/map/map'),
          content
        );
        tree.delete(filePath);
      })
  }
}

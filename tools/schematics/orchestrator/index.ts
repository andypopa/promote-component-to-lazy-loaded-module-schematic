import { chain, externalSchematic, Rule, noop, branchAndMerge } from '@angular-devkit/schematics';

export default function(schema: any): Rule {
  return chain([
    externalSchematic('.', 'create-new-dir', {
      project: 'qwerty',
      componentClassName: 'MapComponent'
    }),
    externalSchematic('.', 'promote-component-to-lazy-loaded-module', {
      project: 'qwerty',
      componentClassName: 'MapComponent'
    })
  ]);
}

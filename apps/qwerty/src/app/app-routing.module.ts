import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DummyGuard } from '@martzcodes/core';
const routes: Routes = [
  {
    path: 'asdf',
    loadChildren: () => import('./asdf/asdf.module').then(m => m.AsdfModule),
    canLoad: [DummyGuard]
  }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

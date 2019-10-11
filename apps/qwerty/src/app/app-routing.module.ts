import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapComponent } from './map/map.component';
const routes: Routes = [
  {
    path: 'map',
    component: MapComponent
  },
  {
    path: 'map/:city',
    component: MapComponent
  }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

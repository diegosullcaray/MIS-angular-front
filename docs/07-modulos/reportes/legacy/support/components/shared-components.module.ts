
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';

import { NgModule } from '@angular/core';
import { MaterialModule } from 'app/material/material.module';
const components = [
    //NotFoundComponent
  ]

@NgModule({
    imports: [
      //CommonModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule,
      FlexLayoutModule,
      //SharedDirectivesModule,
      MaterialModule,
      //TranslateModule    
    ],
    declarations: components,
    exports: [FormsModule,
      ReactiveFormsModule,MaterialModule]
  })
  export class SharedComponentsLegacyModule {}
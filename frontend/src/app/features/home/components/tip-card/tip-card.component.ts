import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-tip-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './tip-card.component.html',
  styleUrl: './tip-card.component.css'
})
export class TipCardComponent {

}

import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-tip-card',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './tip-card.html',
  styleUrl: './tip-card.css'
})
export class TipCard {

}

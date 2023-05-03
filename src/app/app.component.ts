import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Location } from './location'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  apiLoaded: Observable<boolean>;
  location: location = {
    lat: 40,
    lng: 50,
    time: new Date()
  }
  center: google.maps.LatLngLiteral = { lat: 40, lng: 50 };
  label: google.maps.MarkerLabel = {
    color: 'black',
    text: 'Drone',
  };
  zoom = 4;
  markerOptions: google.maps.MarkerOptions = { draggable: false };
  markerPositions: google.maps.LatLngLiteral[] = [];
  constructor(httpClient: HttpClient) {
    this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyBRr1QVPOU8Fyw3LupHhS5UJ8nT-f-NEPA', 'callback')
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      );
  }
  droneData: any = [];
  vertices: google.maps.LatLngLiteral[] = [];
  simulationInterval: any;
  simulationSpeed: number = 1000; // default simulation speed is 1 second
  simulationRunning: boolean = false;
  currentIndex = 0
  pauseButton = false;
  importedData: any;

  ngOnInit() {
  }

  add() {
    let loc = {
      lat: Number(this.location.lat),
      lng: Number(this.location.lng),
      time: this.location.time
    }
    this.droneData = [...this.droneData, loc]
    console.log(this.droneData);
  }

  simulate() {
    this.droneData.map((el: location, i: number) => {
      let pos: any = { lat: el.lat, lng: el.lng }
      this.vertices.push(pos)
    })
    this.vertices = [...this.vertices];
    //intial drone position
    let { lat, lng } = this.droneData[0]
    this.markerPositions = [{ lat, lng }]
    this.center = { lat, lng };
    this.simulationSpeed = Math.abs(new Date(this.droneData[0].time).getTime() - new Date().getTime())
    this.updateDronePosition();
  }

  updateDronePosition() {
    if (this.droneData.length > 0) {
      this.simulationRunning = true;
      this.simulationInterval = setInterval(() => {
        this.currentIndex++;
        this.simulationSpeed = Math.abs(new Date(this.droneData[this.currentIndex].time).getTime() - new Date().getTime())
        if (this.currentIndex < this.droneData.length) {
          let { lat, lng } = this.droneData[this.currentIndex];
          this.markerPositions = [{ lat, lng }]
          this.center = { lat, lng }
        } else {
          clearInterval(this.simulationInterval);
          this.simulationRunning = false;
        }
      }, this.simulationSpeed);
    }
  }

  pauseSimulation() {
    clearInterval(this.simulationInterval);
    this.simulationRunning = false;
  }

  importDataFromCSV(csvText: string): Array<any> {
    const propertyNames = csvText.slice(0, csvText.indexOf('\n')).split(',');
    const dataRows = csvText.slice(csvText.indexOf('\n') + 1).split('\n');
    dataRows.forEach((row) => {
      let values = row.split(',');
      let obj: any = new Object();
      for (let index = 0; index < propertyNames.length; index++) {
        const propertyName: string = propertyNames[index].trim();
        
        let val: any = values[index];
        if (val === '') {
          val = null;
        }
        if(propertyName === 'lat' || propertyName === 'lng') {
          obj[propertyName] = Number(val.trim());
        } else {
          obj[propertyName] = new Date(val.trim());
        }
       
      }
      this.droneData.push(obj);
    });
    return this.droneData;
  }
  async getTextFromFile(event: any) {
    const file: File = event.target.files[0];
    let fileContent = await file.text();

    return fileContent;
  }
  async droneDataFile(event: any) {
    let fileContent = await this.getTextFromFile(event);
    this.importedData = this.importDataFromCSV(fileContent);
  }


}

interface location {
  lat: Number;
  lng: Number;
  time: Object
}
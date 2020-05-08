import { MeasuresOverlay } from './measures.js';
import { RandomGenerator } from './random.js';
import { wrapAnimDelay } from './promise-utils.js';
import { messageDesc } from './game-props.js';

export class Board {
  constructor(doc, seed) {
    this.doc = doc;
    this.elem = doc.getElementById('board');
    this.rng = new RandomGenerator(seed);
    doc.getElementById('seed').textContent = seed;
    this.goOnCallback = null;
    this.goOnButton = doc.getElementById('go-on');
    this.goOnButton.onclick = () => {
      if (this.goOnCallback) {
        this.buttonDisable();
        this.goOnCallback();
      }
    };
    this.measuresOverlay = new MeasuresOverlay(doc);
    doc.getElementById('measures-toggle').onclick = () => this.measuresOverlay.toggleDisplay();
    this.planetToken = null;
    this.planetTokenPlanet = null;
    this.allPlanets = [];
    this.allPublicPlaces = [];
    this.planetsPerType = {};
    this.publicPlacesPerType = [];
    this.bonusInfection = 0; // nb d'infectés à enlever dans lors de la contagion (effet carte mesure gestes barrières)
  }
  addPlanet(planet) {
    this.allPlanets.push(planet);
    if (!this.planetsPerType[planet.type]) {
      this.planetsPerType[planet.type] = [];
    }
    this.planetsPerType[planet.type].push(planet);
    return planet;
  }
  addPublicPlace(publicPlace) {
    this.allPublicPlaces.push(publicPlace);
    if (!this.publicPlacesPerType[publicPlace.type]) {
      this.publicPlacesPerType[publicPlace.type] = [];
    }
    this.publicPlacesPerType[publicPlace.type].push(publicPlace);
    return publicPlace;
  }
  planetTokenAcquirePawn(pawn) {
    return wrapAnimDelay(() => this.planetTokenPlanet.acquirePawn(pawn)).then(() => wrapAnimDelay(() => this.movePlanetTokenTo(this.planetTokenPlanet.nextPlanet)));
  }
  movePlanetTokenTo(planet) {
    this.planetTokenPlanet = planet;
    this.planetToken.setPos(planet.getPosToken());
  }
  updatePlanets(board) {
    board.allPlanets.forEach((planet) => { // pour chaque planète
      planet.isContaminated(); // mise à jour du statut de contamination
    });
    board.allPublicPlaces.forEach((planet) => { // pour chaque planète
      planet.isContaminated(); // mise à jour du statut de contamination
    });
    board.robotAcademy.isContaminated();
    board.batterieMarketZ1.isContaminated();
    board.batterieMarketZ2.isContaminated();
  }
  updateCounters() {
    this.doc.getElementById('sane').textContent = this.doc.getElementsByClassName('sane').length;
    this.doc.getElementById('incubating').textContent = this.doc.getElementsByClassName('incubating').length;
    this.doc.getElementById('sick').textContent = this.doc.getElementsByClassName('sick').length;
    this.doc.getElementById('healed').textContent = this.doc.getElementsByClassName('healed').length;
  }
  buttonEnable() {
    this.goOnButton.disabled = false;
    this.goOnButton.classList.remove('disabled');
  }
  buttonDisable() {
    this.goOnButton.disabled = true;
    this.goOnButton.classList.add('disabled');
  }
  printState() {
    console.log('********** ROBOPITAL **********');
    console.log('Colonne A > Nb pions : ', this.garageColA.getNumberPawns());
    console.log('Colonne B > Nb pions : ', this.garageColB.getNumberPawns());
    console.log('Colonne C > Nb pions : ', this.garageColC.getNumberPawns());
    console.log('*******************************');
  }
  evalWinning() {
    messageDesc(this, 'Avez-vous gagné, perdu ou pouvez-vous continuer ?');
    /*
      Pour chaque lieu hors hôpital :
      Nombre total de malades += Nombre de malades du lieu
      Nombre total de guéris += Nombre de guéris du lieu
      Si(Nombre total de malades = 0) :
          YOU WIN !
      Si(Nombre total de guéris >= 40) :
          YOU WIN !
      Pour l'hôpital :
      Si(Nombre de malades > capacité totale ) :
          YOU LOSE !
      Si(Numero du tour > 10) :
          YOU LOSE !
    */
    let nbSick = 0;
    let nbHealed = 0;
    this.allPlanets.forEach((planet) => {
      nbSick += planet.getAllPawnsWithState('sick').length;
      nbHealed += planet.getAllPawnsWithState('healed').length;
    });
    this.allPublicPlaces.forEach((element) => {
      nbSick += element.getAllPawnsWithState('sick').length;
      nbHealed += element.getAllPawnsWithState('healed').length;
    });
    nbSick += this.robotAcademy.getAllPawnsWithState('sick').length;
    nbHealed += this.robotAcademy.getAllPawnsWithState('healed').length;
    nbSick += this.batterieMarketZ1.getAllPawnsWithState('sick').length;
    nbHealed += this.batterieMarketZ1.getAllPawnsWithState('healed').length;
    nbSick += this.batterieMarketZ2.getAllPawnsWithState('sick').length;
    nbHealed += this.batterieMarketZ2.getAllPawnsWithState('healed').length;
    messageDesc(this, 'Nb de pions malades (hors Robopital) : ', nbSick);
    if (nbSick === 0 && this.garageColA.extraPawns.length === 0) {
      messageDesc(this, 'PARTIE FINIE : Vous avez gagné !');
    }
    messageDesc(this, 'Nb de pions guéris : ', nbHealed);
    if (nbHealed > 39 && this.garageColA.extraPawns.length === 0) {
      messageDesc(this, 'PARTIE FINIE : Vous avez gagné !');
    }
    if (this.garageColA.extraPawns.length > 0) {
      messageDesc(this, `Robopital surchargé de ${ this.garageColA.extraPawns.length } robots ... `);
      messageDesc(this, 'PARTIE FINIE : Vous avez perdu !');
    }
  }
}

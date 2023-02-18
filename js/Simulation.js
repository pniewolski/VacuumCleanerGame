class Simulation {
    constructor(canvas, map, traceBox, telemetry, speed) {
        this.map = map;
        this.board = new CanvasBoard(canvas,map.walls,map.holes,map.checkpoints);
        this.board.paint_polygons(map.walls,"#eff1df","#827759",true);
        this.board.paint_polygons(map.holes,false,"#4f1f1f");
        this.board.paint_flags_init(map.checkpoints);
        this.isCollision = false;
        this.isHoleAlert = false;
        this.isWin = 0;
        
        this.traceBox = traceBox;
        this.traceBox.value = "";
        this.telemetryDiv = telemetry;
		
		this.pathArray = false;
		this.taskCounter = 0;
		this.radarAlert = 0;
		this.radarActive = true;
		this.lastRadar = 0;
		
		this.interface = new RobotInterface(this);
		
        this.f_start = () => {};
		this.f_collision = () => {};
		this.f_fall = () => {};
		this.f_idle = () => {};
		this.f_radar = () => {};
        
        this.tickInterval = speed;
        this.globalCounter = 0;
        this.batteryLevelMax = 160000;
        this.batteryLevel = this.batteryLevelMax;       	
    }
    
    paintTelemetry() {
        if (!this.telemetryDiv) return;
        let batteryPercent = Math.ceil((this.batteryLevel/this.batteryLevelMax)*100)+"%";
        let timeStamp = this.globalCounter/100;
        this.telemetryDiv.innerHTML = "<span>bateria: "+batteryPercent+"</span><span>czas: "+timeStamp+"</span><span>punkty: "+this.board.getScore()+"</span>";
        if (this.isWin > 0) this.telemetryDiv.innerHTML += "<span>Wygrana! ("+(this.isWin/100)+")</span>";
        
    }
    
    traceBoxAdd(text) {
        this.traceBox.value += "[" + this.globalCounter + "] " + text +'\n';
        this.traceBox.scrollTop = this.traceBox.scrollHeight;
    }
    
    registerFunctions(f_start,f_collision,f_fall,f_idle,f_radar) {
        this.f_start = f_start;
		this.f_collision = f_collision;
		this.f_fall = f_fall;
		this.f_idle = f_idle;
		this.f_radar = f_radar;
    }
	
	setEngines(left, right) {
		this.board.f.l = left;
		this.board.f.r = right;
	}
    
    simStart() {
        this.f_start(this.interface);
        this.intervalID = setInterval(this.tick, this.tickInterval, this);
    }
    
    simChangeTempo(newTempo) {
        this.tickInterval = newTempo;
        if (!this.intervalID) return;
        clearInterval(this.intervalID);
        this.intervalID = setInterval(this.tick, this.tickInterval, this);
    }
    
    simStop() {
        clearInterval(this.intervalID);
        this.intervalID = false;
    }
    
    tick(self) {
        //rysowanie dziur, flag i odkurzonej przestrzeni
        if (self.globalCounter % 10 == 0) {
            self.board.paint_flags_init(self.map.checkpoints,false);
            self.board.paint_polygons(self.map.holes,false,"#141414");
        }      
        self.board.paint_simple(true);
        
        //radar
		let radarVal = self.board.getRadarValue();
		self.lastRadar = radarVal;
		if (radarVal) {
			if (self.radarAlert > 0 && radarVal < self.radarAlert) {
				if (this.radarActive) {
					self.f_radar(self.interface,radarVal);
					this.radarActive = false;
				}
			} else {
				this.radarActive = true;
			}        
		}
		
        //chodzenie po zaprogramowanej sciezce
		if (self.pathArray) {
			let subCounter = self.taskCounter;
			let stopEngines = true;
			for (let n=0 ; n<self.pathArray.length ; n++) {
				if (subCounter > self.pathArray[n].t) {
					subCounter -= self.pathArray[n].t;
				} else {
					stopEngines = false;
					self.setEngines(self.pathArray[n].l, self.pathArray[n].r);
					if (n == self.pathArray.length-1 && subCounter == self.pathArray[n].t) {
						self.f_idle(self.interface,self.board.isCollision,self.lastRadar);	
					} 
					break;
				}
			};
			if (stopEngines) {
				self.setEngines(0, 0);
				self.pathArray = false;
			}
		}
		self.taskCounter += 1;
		
        //kolizje i dziury
        self.isCollision = self.board.isCollision;
        self.isHoleAlert = self.board.isHoleAlert;
        
        let simStatus = self.board.move();
        if(!simStatus) {            
            self.simStop();
            self.traceBoxAdd("Koniec gry. Wpadłeś w przepaść.");
            self.board.paint_message("Koniec gry. Wpadłeś w przepaść.");
        }
		
        if (self.isCollision == false && self.board.isCollision) {
            self.f_collision(self.interface,self.board.lastCollisionAngle);
        }
        if (self.isHoleAlert == false && self.board.isHoleAlert) {
            self.f_fall(self.interface);
        }
		
        //rysowanie robota
        self.board.paint_simple();
        
        //telemetria
        self.globalCounter += 1;
        self.batteryLevel -= Math.abs(self.board.f.l) + Math.abs(self.board.f.r);
        if (self.batteryLevel <= 0) {
            self.simStop();
            self.traceBoxAdd("Koniec gry. Skończyła się bateria.");
            self.board.paint_message("Koniec gry. Skończyła się bateria.");
        }
        self.paintTelemetry();
        
        //zwyciestwo
        if(self.isWin==0 && self.board.getRawPoints() >=  self.board.checkpoints.length) {
            self.isWin = self.globalCounter;
            self.traceBoxAdd("Brawo! Udało się zdobyć wszystkie flagi!");    
        }
    }

}
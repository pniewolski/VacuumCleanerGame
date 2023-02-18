class Game{
    constructor() {
        this.simulation = null;
        this.editor = null;
        this.slider = null;  
        this.canvas = document.getElementById("simulationCanvas");  
        this.telemetry = document.getElementById("telemetry");
        this.traceBox = document.getElementById("traceBox");
        this.slider = document.getElementById("speedRange");
        this.levelsSelect = document.getElementById("gameLevels");
        
        this.addListeners();
        this.initEditor();
        this.initResizable();
        this.initLevels();
        this.prepareCanvas();        
    }

    async loadLevel(level) { 
        const response = await fetch(this.levelsSelect.value);
        const mapCode = await response.json();
        this.simulationStart(mapCode);
    }   
    
    simulationStart(mapObj) {
    	this.hideControls(); 

        if (this.simulation) {
            this.simulation.simStop();
        }    
        this.simulation = new Simulation(this.canvas,mapObj,this.traceBox,this.telemetry,this.slider.value);
        let functionsCode = this.editor.getValue();
        (0, eval)(functionsCode);
        this.simulation.registerFunctions(onStarted,onCollision,onFallDetection,onTaskFinished,onRadarAlert);
        this.simulation.simStart();
    }
    
    simulationStop() {
    	this.showControls();
        this.simulation.simStop();
    }
    
    initEditor() {
        this.editor = ace.edit("editor");
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/javascript");
    }
    
    initResizable() {
        Split(['#split-0', '#split-1']);
    }
    
    initLevels() {
        for(let n=0; n<=10 ; n++) {
            let opt = document.createElement('option');
            opt.value = 'levels/level'+n+'.json';
            if (n == 1) opt.selected = "selected";
            if (n == 0) opt.text = "Trening";
            else opt.text = "Poziom "+n;
            this.levelsSelect.appendChild(opt);
        }
    
    }
    
    saveCode() {
        let dataToSave = this.editor.getValue();
        localStorage.setItem('userGameCode', dataToSave);
        document.querySelector("#saveStatus").innerHTML = "Zapisano kod w pamięci Twojej przeglądarki";
    }
    
    restoreCode() {
        let dataToRestore = localStorage.getItem('userGameCode');
        if (dataToRestore) {
            this.editor.setValue(dataToRestore);
            document.querySelector("#saveStatus").innerHTML = "Odczytano Twój ostatnio zapisany kod";
        } else {
            document.querySelector("#saveStatus").innerHTML = "Nie znaleziono kodu do odczytu";
        }
        
    }
    
    prepareCanvas() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let cx = 100;
        let cy = 100;
        ctx.strokeStyle = "#827759";
        ctx.moveTo(cy, cy);
        for(let n=0; n<400; n++) {
            cx += Math.random()*160 - 75;
            ctx.lineTo(cx, cy);
            cy += Math.random()*160 - 75;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        
        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("Oczekiwanie na rozpoczęcie symulacji....", 160, 200);
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(850, 50);
        ctx.lineTo(850, 630);
        ctx.lineTo(50, 630);
        ctx.lineTo(50, 50);
        ctx.stroke();
    }
    
    
    addListeners() {
        document.querySelector("#simStartBtn").onclick = () => {
          this.loadLevel("level1");
        }
        
        document.querySelector("#simStopBtn").onclick = () => {
          this.simulationStop();
        }
        
        document.querySelector("#saveCode").onclick = () => {
          this.saveCode();
        }
        
        document.querySelector("#restoreCode").onclick = () => {
          this.restoreCode();
        }
        
        this.slider.addEventListener('change', (e) => {
          this.simulation.simChangeTempo(e.target.value);
        }, false);
        
        this.levelsSelect.addEventListener('change', (e) => {
          this.prepareCanvas();
        }, false);
        
    }
    
    hideControls() {	
    	document.querySelectorAll('.displayOnStop').forEach(function(el) {
    	   el.style.display = 'none';
    	});
        document.querySelectorAll('.displayOnPlay').forEach(function(el) {
    	   el.style.display = '';
    	});
    }
    
    showControls() {	
    	document.querySelectorAll('.displayOnStop').forEach(function(el) {
    	   el.style.display = '';
    	});
        document.querySelectorAll('.displayOnPlay').forEach(function(el) {
    	   el.style.display = 'none';
    	});
    }
}


window.onload = function(event){ 
    let g = new Game();	
}; 
class RobotInterface {

    #simulation;
    
	constructor(simulation) {
		this.#simulation = simulation;
	}
	
	go(pathArray) {
        if(!pathArray) {
            pathArray = [{l:0,r:0,t:1}];
        }
		pathArray.forEach(path => {
            if (!path.l || isNaN(path.l)) {
                path.l = 0;
            } else {
                if (path.l < -100) path.l = -100;
                else if (path.l > 100) path.l = 100;
                
                path.l = (path.l*this.#simulation.board.max_engine_speed)/100;
            }
            if (!path.r || isNaN(path.r)) {
                path.r = 0;
            } else {
                if (path.r < -100) path.r = -100;
                else if (path.r > 100) path.r = 100;
                
                path.r = (path.r*this.#simulation.board.max_engine_speed)/100;
            }
            if (!path.t || isNaN(path.t)) {
                path.t = 1;
            }                         
        });
		this.#simulation.taskCounter = 0;
		this.#simulation.pathArray = pathArray;
	}
	
	stop() {
		this.#simulation.setEngines(0, 0);
	}
	
	setRadarAlert(value) {
		if (value > this.#simulation.board.radar_range) value = this.#simulation.board.radar_range;
		this.#simulation.radarAlert = value;
	}
    
    color(color) {
        this.#simulation.board.robot_color = color;
    }
    
    shout(text) {
        this.#simulation.traceBoxAdd(text);
    }

}
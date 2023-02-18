class CollistionHelper {

    static distanceTwoPoints(t,p) {
        return Math.sqrt((t.x-p.x)**2+(t.y-p.y)**2);
    }
    
    static distanceBetweenPointAndLineSegment(t,p1,p2) {
        let line = this.lineFrom2Points(p1,p2);
        let closestP = this.closestPointInLine(line,t);     
        let p1_dist = this.distanceTwoPoints(t,p1);
        let p2_dist = this.distanceTwoPoints(t,p2);
           
        //czy closest jest na odcinku
        if (Math.min(p1.x,p2.x) <= closestP.x && closestP.x <= Math.max(p1.x,p2.x) && Math.min(p1.y,p2.y) <= closestP.y && closestP.y <= Math.max(p1.y,p2.y)) {
            let lineDist = this.distanceTwoPoints(t,closestP);
            
            if (lineDist < p1_dist && lineDist < p2_dist) {
                return {dist:lineDist, pushPoint: closestP, line: line};
            }   
        } else if (p1_dist < p2_dist) {
            return {dist:p1_dist, pushPoint: p1, line: line};
        } else {
            return {dist:p2_dist, pushPoint: p2, line: line};
        }
    }
    
    static lineFrom2Points(p1,p2) {
        let a = p1.y - p2.y;
        let b = - p1.x + p2.x;
        let c = p1.x*p2.y - p2.x*p1.y; 
        return {a: a, b: b, c: c};
    }
    
    static closestPointInLine(l,p) {
        let x1 = (l.b*(l.b*p.x - l.a*p.y) - l.a*l.c)/(l.a**2 + l.b**2);
        let y1 = (l.a*(-l.b*p.x + l.a*p.y) - l.b*l.c)/(l.a**2 + l.b**2);
        return {x: x1, y: y1};     
    }
    
    static pushToDistance(p1,p2,expectedDist) {
        let currDist = this.distanceTwoPoints(p1,p2);
        if (currDist == 0) return p1;
        let x = p1.x + ((p2.x-p1.x)*expectedDist)/currDist;
        let y = p1.y + ((p2.y-p1.y)*expectedDist)/currDist;
        return {x: x, y: y};
    }
                                        
    
    static checkIfLineInRange(radius,p1,p2,curr) {
        let minx = Math.min(p1.x,p2.x) - radius;
        let miny = Math.min(p1.y,p2.y) - radius;
        let maxx = Math.max(p1.x,p2.x) + radius;
        let maxy = Math.max(p1.y,p2.y) + radius;
        
        if (minx <= curr.x && curr.x <= maxx && miny <= curr.y && curr.y <= maxy) {
            return true;
        }
        return false;
    }
	
	static lineSegmentsIntersection(p1,p2,p3,p4) {
		let c2x = p3.x - p4.x; // (x3 - x4)
		let c3x = p1.x - p2.x; // (x1 - x2)
		let c2y = p3.y - p4.y; // (y3 - y4)
		let c3y = p1.y - p2.y; // (y1 - y2)
	  
		let d  = c3x * c2y - c3y * c2x;
	  
		if (d == 0) {
			return false;
		}
	  
		let u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
		let u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)

		let px = (u1 * c2x - c3x * u4) / d;
		let py = (u1 * c2y - c3y * u4) / d;
		
		if (
			((p1.x <= px && px <= p2.x) || (p2.x <= px && px <= p1.x)) &&
			((p1.y <= py && py <= p2.y) || (p2.y <= py && py <= p1.y)) &&
			((p3.x <= px && px <= p4.x) || (p4.x <= px && px <= p3.x)) && 
			((p3.y <= py && py <= p4.y) || (p4.y <= py && py <= p3.y))
		) {	
			let p = { x: px, y: py };		  
			return p;		
		}
		
		return false;
	}
}